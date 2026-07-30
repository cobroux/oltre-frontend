import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { ExpensesComponent } from './expenses';
import { ExpensesSevice } from '../../core/services/expenses.service';
import { ExpensesDTO } from '../../core/models/expenses.dto';

const mockExpenses: ExpensesDTO[] = [
  { id: 1, expensesName: 'Netflix', amount: 13, recType: 'Monthly', startDate: '2026-07-01' },
  { id: 2, expensesName: 'Loyer', amount: 800, recType: 'Monthly', startDate: '2026-07-01' }
];

describe('ExpensesComponent', () => {
  let component: ExpensesComponent;
  let fixture: ComponentFixture<ExpensesComponent>;

  const mockService = {
  expensesListSignal: signal(mockExpenses),
  intSignal: signal(813),
  loadAllExpenses: vi.fn(() => of(mockExpenses)),
  addExpense: vi.fn((_expense: ExpensesDTO) => of({})),
  deleteExpenses: vi.fn((_id: number) => of(undefined)),
  getAmountPerMonth: vi.fn(() => of(813))
};

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ExpensesComponent],
      providers: [
        { provide: ExpensesSevice, useValue: mockService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler loadAllExpenses au démarrage', () => {
    expect(mockService.loadAllExpenses).toHaveBeenCalled();
  });

  it('ne devrait pas soumettre si formulaire invalide', () => {
    component.addForm.reset();
    component.onSubmit();
    expect(mockService.addExpense).not.toHaveBeenCalled();
  });

  it('devrait appeler deleteExpenses avec le bon id', () => {
    component.deleteExpenses(1);
    expect(mockService.deleteExpenses).toHaveBeenCalledWith(1);
  });

  it('devrait retourner le bon label de récurrence', () => {
    expect(component.getRecLabel('Monthly')).toBe('Mensuel');
    expect(component.getRecLabel('Yearly')).toBe('Annuel');
    expect(component.getRecLabel('Daily')).toBe('Quotidien');
  });

  it('devrait retourner le bon icône Tabler', () => {
    expect(component.getIcon('Monthly')).toBe('ti-repeat');
    expect(component.getIcon('Yearly')).toBe('ti-calendar-event');
    expect(component.getIcon('Daily')).toBe('ti-sun');
    expect(component.getIcon('Unknown')).toBe('ti-wallet');
  });
});