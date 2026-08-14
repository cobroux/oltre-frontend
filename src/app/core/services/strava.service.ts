import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { StravaActivity, StravaWeekStats } from '../models/strava.dto';

@Injectable({ providedIn: 'root' })
export class StravaService {
  private readonly API = 'http://localhost:8080/api/strava';

  activitiesSignal = signal<StravaActivity[]>([]);
  weekStatsSignal  = signal<StravaWeekStats | null>(null);
  isLoading        = signal(false);

  constructor(private http: HttpClient) {}

  loadActivities() {
    this.isLoading.set(true);
    
    // Calcule le lundi de la semaine courante
    const now = new Date();
    const day = now.getUTCDay() || 7;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1));
    const mondayStr = monday.toISOString().split('T')[0];

    return this.http.get<StravaActivity[]>(`${this.API}/activities?monday=${mondayStr}`).pipe(
      tap(activities => {
        this.activitiesSignal.set(activities);
        this.weekStatsSignal.set(this.computeWeekStats(activities));
        this.isLoading.set(false);
      })
    );
  }

  private computeWeekStats(activities: StravaActivity[]): StravaWeekStats {
    const now = new Date();
    const day = now.getUTCDay() || 7; 
    
    // Lundi de la semaine courante en UTC
    const monday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - day + 1
    ));
    const mondayStr = monday.toISOString().split('T')[0];

    // Dimanche de la semaine courante
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const sundayStr = sunday.toISOString().split('T')[0];

    const weekActivities = activities.filter(a => {
      const dateStr = a.startLocal.split('T')[0];
      return dateStr >= mondayStr && dateStr <= sundayStr;
    });

    const runs    = weekActivities.filter(a => a.sportType === 'Run');
    const rides   = weekActivities.filter(a => a.sportType === 'Ride');
    const weights = weekActivities.filter(a => a.sportType === 'WeightTraining');
    const swims = weekActivities.filter(a => a.sportType === 'Swim');


    return {
      totalCalories:  weekActivities.reduce((s, a) => s + (a.calories ?? 0), 0),
      runCount:        runs.length,
      runDistance:     runs.reduce((s, a) => s + a.distance, 0),
      runCalories:     runs.reduce((s, a) => s + (a.calories ?? 0), 0),
      rideCount:       rides.length,
      rideDistance:    rides.reduce((s, a) => s + a.distance, 0),
      rideCalories:    rides.reduce((s, a) => s + (a.calories ?? 0), 0),
      weightCount:     weights.length,
      weightCalories:  weights.reduce((s, a) => s + (a.calories ?? 0), 0),
      totalActivities: weekActivities.length,
      swimCount:      swims.length,
      swimDistance:   swims.reduce((s, a) => s + a.distance, 0),
      runElevation:   runs.reduce((s, a) => s + (a.elevationGain ?? 0), 0),
      rideElevation:  rides.reduce((s, a) => s + (a.elevationGain ?? 0), 0)

    };
  }

  private getMonday(): Date {
  const n = new Date();
  const day = n.getUTCDay() || 7;
  const m = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() - day + 1));
  return m;
}
}