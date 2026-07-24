import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FoodDTO } from '../models/food.dto';

@Injectable({ providedIn: 'root' })
export class FoodSevice {
  private readonly API = 'http://localhost:8080/api/food';

  intSignal = signal<number | null>(null);
  expensesSignal = signal<FoodDTO | null>(null);
  expensesListSignal = signal<FoodDTO[]>([]);
  constructor(private http: HttpClient) {}

  
}