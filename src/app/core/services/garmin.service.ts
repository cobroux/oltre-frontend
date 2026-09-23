import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { GarminActivity, GarminWeekStats } from '../models/garmin.dto';

@Injectable({ providedIn: 'root' })
export class GarminService {
  private readonly API = 'http://localhost:8080/api/garmin';
  private readonly userId = 1;

  activitiesSignal = signal<GarminActivity[]>([]);
  weekStatsSignal  = signal<GarminWeekStats | null>(null);
  isLoading        = signal(false);
  isConnected      = signal(false);
  connectError     = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  checkStatus() {
    return this.http.get<{ connected: boolean }>(`${this.API}/${this.userId}/status`).pipe(
      tap(res => this.isConnected.set(res.connected)),
      catchError(() => {
        this.isConnected.set(false);
        return of({ connected: false });
      })
    );
  }

  connect(email: string, password: string) {
    this.connectError.set(null);
    return this.http.post<void>(`${this.API}/${this.userId}/connect`, { email, password }).pipe(
      tap(() => this.isConnected.set(true)),
      catchError((err: HttpErrorResponse) => {
        this.connectError.set(err.error?.error ?? 'Connexion Garmin impossible. Vérifie tes identifiants.');
        this.isConnected.set(false);
        return of(null);
      })
    );
  }

  disconnect() {
    return this.http.delete<void>(`${this.API}/${this.userId}/connect`).pipe(
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

    return this.http.get<GarminActivity[]>(`${this.API}/${this.userId}/activities?monday=${mondayStr}`).pipe(
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
