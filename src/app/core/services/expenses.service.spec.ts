import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ExpensesSevice } from './expenses.service';
import { ExpensesDTO } from '../models/expenses.dto';

describe('ExpensesService', () => {
  let service: ExpensesSevice;
  let httpMock: HttpTestingController;

  const mockExpenses: ExpensesDTO[] = [
    { id: 1, expensesName: 'Netflix', amount: 13, recType: 'Monthly', startDate: '2026-07-01' },
    { id: 2, expensesName: 'Spotify', amount: 10, recType: 'Monthly', startDate: '2026-07-01' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExpensesSevice, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ExpensesSevice);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait charger les dépenses et mettre à jour expensesListSignal', () => {
    service.loadAllExpenses().subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/expenses/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockExpenses);

    expect(service.expensesListSignal()).toEqual(mockExpenses);
  });

  it('devrait recharger les dépenses après un ajout', () => {
    const newExpense: ExpensesDTO = { id: 0, expensesName: 'Amazon', amount: 50, recType: 'Monthly', startDate: '2026-07-01' };

    service.addExpense(newExpense).subscribe();

    const saveReq = httpMock.expectOne('http://localhost:8080/api/expenses/save');
    expect(saveReq.request.method).toBe('POST');
    expect(saveReq.request.body).toEqual(newExpense);
    saveReq.flush({ ...newExpense, id: 3 });

    // recharge loadAllExpenses + getAmountPerMonth dans le tap
    httpMock.expectOne('http://localhost:8080/api/expenses/all').flush(mockExpenses);
    httpMock.expectOne('http://localhost:8080/api/expenses/amountPerMonth').flush(23);
  });

  it('devrait recharger les dépenses après une suppression', () => {
    service.deleteExpenses(1).subscribe();

    const deleteReq = httpMock.expectOne('http://localhost:8080/api/expenses/1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);

    httpMock.expectOne('http://localhost:8080/api/expenses/all').flush([mockExpenses[1]]);
    httpMock.expectOne('http://localhost:8080/api/expenses/amountPerMonth').flush(10);
  });

  it('devrait charger le montant mensuel et mettre à jour intSignal', () => {
    service.getAmountPerMonth().subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/expenses/amountPerMonth');
    expect(req.request.method).toBe('GET');
    req.flush(813);

    expect(service.intSignal()).toBe(813);
  });
});