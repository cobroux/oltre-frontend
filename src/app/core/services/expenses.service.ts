import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ExpensesDTO, ExpensesMonthlyTrendDTO, ExpensesYearRecapDTO } from '../models/expenses.dto';
import { getApiUrl } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class ExpensesSevice {
  private readonly API = `${getApiUrl()}/api/expenses`;

  intSignal = signal<number | null>(null);
  expensesSignal = signal<ExpensesDTO | null>(null);
  expensesListSignal = signal<ExpensesDTO[]>([]);
  constructor(private http: HttpClient) {}

  // Vidé à la déconnexion pour qu'un autre compte ne voie pas ces données
  reset() {
    this.intSignal.set(null);
    this.expensesSignal.set(null);
    this.expensesListSignal.set([]);
  }

  loadAllExpenses() {
    return this.http.get<ExpensesDTO[]>(this.API+"/all").pipe(
      tap(expenses => this.expensesListSignal.set(expenses))
    );
  }

  addExpense(expense: ExpensesDTO) {
    return this.http.post<ExpensesDTO>(this.API + "/save", expense).pipe(
      tap(() => this.refresh())
    );
  }

  deleteExpenses(id: number) {
    return this.http.delete<void>(this.API + "/" + id).pipe(
      tap(() => this.refresh())
    );
  }

  // Rechargement après une écriture réussie : si la relecture échoue, on
  // garde simplement les données déjà affichées plutôt que de lever une
  // erreur non gérée.
  private refresh() {
    this.loadAllExpenses().pipe(catchError(() => EMPTY)).subscribe();
    this.getAmountPerMonth().pipe(catchError(() => EMPTY)).subscribe();
  }


  getAmountPerMonth(){
    return this.http.get<number>(this.API+"/amountPerMonth").pipe(
      tap(amount => this.intSignal  .set(amount))
    );  }

  getYearRecap() {
    return this.http.get<ExpensesYearRecapDTO>(this.API + "/yearRecap");
  }

  getMonthlyTrend() {
    return this.http.get<ExpensesMonthlyTrendDTO>(this.API + "/monthlyTrend");
  }
}