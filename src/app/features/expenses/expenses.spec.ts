import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
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
  getAmountPerMonth: vi.fn(() => of(813)),
  getYearRecap: vi.fn(() => of({ total: 0, monthlyTotal: 0, dailyTotal: 0, yearlyTotal: 0, items: [] })),
  getMonthlyTrend: vi.fn(() => of({ year: 2026, currentMonth: 7, amounts: Array(12).fill(0) }))
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
    component.requestDelete(1);
    component.requestDelete(1);
    expect(mockService.deleteExpenses).toHaveBeenCalledWith(1);
  });

  it('devrait afficher un message si la suppression échoue', () => {
    mockService.deleteExpenses.mockReturnValueOnce(throwError(() => new Error('x')));

    component.requestDelete(1);
    component.requestDelete(1);
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Impossible de supprimer la dépense. Réessaie plus tard.');
    const banner: HTMLElement | null = fixture.nativeElement.querySelector('.error-banner');
    expect(banner?.textContent).toContain('Impossible de supprimer la dépense');
    expect(component.confirmDeleteId()).toBeNull();
  });

  it("devrait afficher un message si l'ajout échoue et garder le formulaire rempli", () => {
    mockService.addExpense.mockReturnValueOnce(throwError(() => new Error('x')));
    component.addForm.setValue({
      expensesName: 'Netflix',
      amount: 13,
      startDate: '2026-07-01',
      recType: 'Monthly'
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(mockService.addExpense).toHaveBeenCalled();
    expect(component.errorMessage()).toBe("Impossible d'ajouter la dépense. Réessaie plus tard.");
    expect(fixture.nativeElement.querySelector('.error-banner')).not.toBeNull();
    expect(component.addForm.value.expensesName).toBe('Netflix');
  });

  it("devrait effacer le message d'erreur après une action réussie", () => {
    component.errorMessage.set('Ancienne erreur');

    component.requestDelete(2);
    component.requestDelete(2);
    fixture.detectChanges();

    expect(component.errorMessage()).toBeNull();
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeNull();
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

  it('liste vide : état vide avec bouton qui focus le formulaire', () => {
    mockService.expensesListSignal.set([]);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ajoute ta première dépense');
    el.querySelector<HTMLButtonElement>('.empty-state button')!.click();
    expect(document.activeElement).toBe(el.querySelector('input[formControlName="expensesName"]'));
    mockService.expensesListSignal.set(mockExpenses);
  });
});