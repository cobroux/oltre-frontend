import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { ExpensesDTO } from '../models/expenses.dto';

@Injectable({ providedIn: 'root' })
export class ExpensesSevice {
  private readonly API = 'http://localhost:8080/api/expenses';

  //expensesSignal = signal<ExpensesDTO | null>(null);
  expensesListSignal = signal<ExpensesDTO[]>([]);
  constructor(private http: HttpClient) {}

  loadAllExpenses() {
    return this.http.get<ExpensesDTO[]>(this.API+"/all").pipe(
      tap(expenses => this.expensesListSignal.set(expenses))
    );
  }

  addExpense(expense: ExpensesDTO) {
  return this.http.post<ExpensesDTO>(this.API+"/save", expense);
}
}