import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CoachPlanDTO, SportGoalDTO } from '../models/coach.dto';
import { getApiUrl } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class CoachService {
  private readonly API = `${getApiUrl()}/api/coach`;

  goalsSignal = signal<SportGoalDTO[]>([]);
  planSignal = signal<CoachPlanDTO | null>(null);

  constructor(private http: HttpClient) {}

  // Vidé à la déconnexion pour qu'un autre compte ne voie pas ces données
  reset() {
    this.goalsSignal.set([]);
    this.planSignal.set(null);
  }

  loadGoals() {
    return this.http.get<SportGoalDTO[]>(`${this.API}/goals`).pipe(
      tap(goals => this.goalsSignal.set(goals))
    );
  }

  addGoal(goal: SportGoalDTO) {
    return this.http.post<SportGoalDTO>(`${this.API}/goals`, goal).pipe(
      tap(() => this.refreshGoals())
    );
  }

  deleteGoal(id: number) {
    return this.http.delete<void>(`${this.API}/goals/${id}`).pipe(
      tap(() => this.refreshGoals())
    );
  }

  // Rechargement après une écriture réussie : si la relecture échoue, on
  // garde les objectifs déjà affichés plutôt que de lever une erreur non gérée.
  private refreshGoals() {
    this.loadGoals().pipe(catchError(() => EMPTY)).subscribe();
  }

  loadPlan() {
    return this.http.get<CoachPlanDTO | null>(`${this.API}/plan`).pipe(
      tap(plan => this.planSignal.set(plan))
    );
  }

  generatePlan() {
    return this.http.post<CoachPlanDTO>(`${this.API}/plan/generate`, {}).pipe(
      tap(plan => this.planSignal.set(plan))
    );
  }

  toggleDay(index: number) {
    return this.http.post<CoachPlanDTO>(`${this.API}/plan/days/${index}/toggle`, {}).pipe(
      tap(plan => this.planSignal.set(plan))
    );
  }
}
