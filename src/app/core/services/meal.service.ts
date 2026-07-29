import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { MealDTO } from '../models/meal.dto';

@Injectable({ providedIn: 'root' })
export class MealService {
  private readonly API = 'http://localhost:8080/api/meals';

  mealsSignal = signal<MealDTO[]>([]);

  constructor(private http: HttpClient) {}

  // Charge tous les repas de la semaine
  loadWeek(monday: string) {
    return this.http.get<MealDTO[]>(`${this.API}/week?monday=${monday}`).pipe(
      tap(meals => this.mealsSignal.set(meals))
    );
  }

  // Sauvegarde un repas
  save(meal: Partial<MealDTO>) {
    return this.http.post<MealDTO>(`${this.API}/save`, meal).pipe(
      tap(saved => this.mealsSignal.update(list => [...list, saved]))
    );
  }

  // Supprime un repas
  delete(id: number) {
    return this.http.delete<void>(`${this.API}/${id}`).pipe(
      tap(() => this.mealsSignal.update(list => list.filter(m => m.id !== id)))
    );
  }
}