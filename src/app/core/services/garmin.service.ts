import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { GarminActivity, GarminWeekStats, GarminRecords, GarminRecordsResponse, GarminActivityDetail } from '../models/garmin.dto';
import { getApiUrl } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class GarminService {
  private readonly API = `${getApiUrl()}/api/garmin`;

  activitiesSignal = signal<GarminActivity[]>([]);
  weekStatsSignal  = signal<GarminWeekStats | null>(null);
  isLoading        = signal(false);
  isConnected      = signal(false);
  connectError     = signal<string | null>(null);
  connectLoading   = signal(false);

  lastWeekActivitiesSignal = signal<GarminActivity[]>([]);
  lastWeekStatsSignal      = signal<GarminWeekStats | null>(null);
  isLoadingLastWeek        = signal(false);

  constructor(private http: HttpClient) {}

  checkStatus() {
    return this.http.get<{ connected: boolean }>(`${this.API}/status`).pipe(
      tap(res => this.isConnected.set(res.connected)),
      catchError(() => {
        this.isConnected.set(false);
        return of({ connected: false });
      })
    );
  }

  connect(email: string, password: string) {
    this.connectError.set(null);
    this.connectLoading.set(true);
    return this.http.post<void>(`${this.API}/connect`, { email, password }).pipe(
      tap(() => this.isConnected.set(true)),
      catchError((err: HttpErrorResponse) => {
        this.connectError.set(err.error?.error ?? 'Connexion Garmin impossible. Vérifie tes identifiants.');
        this.isConnected.set(false);
        return of(null);
      }),
      finalize(() => this.connectLoading.set(false))
    );
  }

  disconnect() {
    return this.http.delete<void>(`${this.API}/connect`).pipe(
      tap(() => {
        this.isConnected.set(false);
        this.activitiesSignal.set([]);
        this.weekStatsSignal.set(null);
      }),
      catchError(() => of(null))
    );
  }

  loadActivities() {
    this.isLoading.set(true);

    const now = new Date();
    const day = now.getUTCDay() || 7;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1));
    const mondayStr = monday.toISOString().split('T')[0];

    return this.http.get<GarminActivity[]>(`${this.API}/activities?monday=${mondayStr}`).pipe(
      tap(activities => {
        this.activitiesSignal.set(activities);
        this.weekStatsSignal.set(this.computeWeekStats(activities));
        this.isLoading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) this.isConnected.set(false);
        return of(null);
      })
    );
  }

  // Semaine passée (lundi -> dimanche précédents), pour la consulter dans
  // Sport sans attendre la fin de la semaine en cours. L'API n'a pas de
  // borne haute pour /activities, donc on la filtre nous-mêmes au dimanche
  // de cette semaine-là - même logique que computeWeekStats, généralisée.
  loadLastWeek() {
    this.isLoadingLastWeek.set(true);

    const now = new Date();
    const day = now.getUTCDay() || 7;
    const thisMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1));
    const lastMonday = new Date(thisMonday);
    lastMonday.setUTCDate(thisMonday.getUTCDate() - 7);
    const lastMondayStr = lastMonday.toISOString().split('T')[0];
    const lastSunday = new Date(lastMonday);
    lastSunday.setUTCDate(lastMonday.getUTCDate() + 6);
    const lastSundayStr = lastSunday.toISOString().split('T')[0];

    return this.http.get<GarminActivity[]>(`${this.API}/activities?monday=${lastMondayStr}&limit=200`).pipe(
      tap(activities => {
        const weekActivities = activities.filter(a => {
          const dateStr = a.startLocal.split('T')[0];
          return dateStr >= lastMondayStr && dateStr <= lastSundayStr;
        });
        this.lastWeekActivitiesSignal.set(weekActivities);
        this.lastWeekStatsSignal.set(this.computeStatsForActivities(weekActivities));
        this.isLoadingLastWeek.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoadingLastWeek.set(false);
        if (err.status === 401) this.isConnected.set(false);
        return of(null);
      })
    );
  }

  getActivitiesSince(sinceDate: string, limit = 200) {
    return this.http.get<GarminActivity[]>(`${this.API}/activities?monday=${sinceDate}&limit=${limit}`).pipe(
      catchError(() => of([] as GarminActivity[]))
    );
  }

  getActivityDetails(activityId: string) {
    return this.http.get<GarminActivityDetail>(`${this.API}/activities/${activityId}/details`);
  }

  getRecords() {
    const emptyPeriod: GarminRecords = { runningRecords: [], otherRecords: [] };
    const empty: GarminRecordsResponse = { allTime: emptyPeriod, thisYear: emptyPeriod };
    return this.http.get<GarminRecordsResponse>(`${this.API}/records`).pipe(
      catchError(() => of(empty))
    );
  }

  private computeWeekStats(activities: GarminActivity[]): GarminWeekStats {
    const now = new Date();
    const day = now.getUTCDay() || 7;

    const monday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - day + 1
    ));
    const mondayStr = monday.toISOString().split('T')[0];

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const sundayStr = sunday.toISOString().split('T')[0];

    const weekActivities = activities.filter(a => {
      const dateStr = a.startLocal.split('T')[0];
      return dateStr >= mondayStr && dateStr <= sundayStr;
    });

    return this.computeStatsForActivities(weekActivities);
  }

  // Agrège des stats à partir d'un lot d'activités déjà filtré à la bonne
  // semaine - séparé de computeWeekStats (qui filtre "cette semaine" depuis
  // "maintenant") pour pouvoir le réutiliser sur n'importe quelle semaine
  // (ex: loadLastWeek, qui filtre sur la semaine précédente).
  private computeStatsForActivities(weekActivities: GarminActivity[]): GarminWeekStats {
    const isRun    = (t: string) => t?.includes('running');
    const isRide   = (t: string) => t?.includes('cycling') || t?.includes('biking');
    const isWeight = (t: string) => t?.includes('strength');
    const isSwim   = (t: string) => t?.includes('swim');

    const runs    = weekActivities.filter(a => isRun(a.sportType));
    const rides   = weekActivities.filter(a => isRide(a.sportType));
    const weights = weekActivities.filter(a => isWeight(a.sportType));
    const swims   = weekActivities.filter(a => isSwim(a.sportType));

    return {
      totalCalories:   weekActivities.reduce((s, a) => s + (a.calories ?? 0), 0),
      runCount:        runs.length,
      runDistance:     runs.reduce((s, a) => s + a.distance, 0),
      runCalories:     runs.reduce((s, a) => s + (a.calories ?? 0), 0),
      rideCount:       rides.length,
      rideDistance:    rides.reduce((s, a) => s + a.distance, 0),
      rideCalories:    rides.reduce((s, a) => s + (a.calories ?? 0), 0),
      weightCount:     weights.length,
      weightCalories:  weights.reduce((s, a) => s + (a.calories ?? 0), 0),
      totalActivities: weekActivities.length,
      swimCount:       swims.length,
      swimDistance:    swims.reduce((s, a) => s + a.distance, 0),
      runElevation:    runs.reduce((s, a) => s + (a.elevationGain ?? 0), 0),
      rideElevation:   rides.reduce((s, a) => s + (a.elevationGain ?? 0), 0)
    };
  }
}
