import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { CalendarComponent } from './calendar';
import { AppointmentService } from '../../core/services/appointment.service';
import { MealService } from '../../core/services/meal.service';
import { TasksService } from '../../core/services/tasks.service';
import { ExpensesSevice } from '../../core/services/expenses.service';
import { AppointmentDTO } from '../../core/models/appointment.dto';
import { MealDTO } from '../../core/models/meal.dto';
import { TasksDTO } from '../../core/models/tasks.dto';
import { ExpensesDTO } from '../../core/models/expenses.dto';

const today = new Date().toISOString().split('T')[0];

const mockAppts: AppointmentDTO[] = [
  { id: 1, title: 'Médecin', apptDate: today, apptTime: '09:30', apptType: 'MEDICAL', location: 'Cabinet Martin' },
  { id: 2, title: 'Yoga', apptDate: today, apptTime: '18:30', apptType: 'SPORT' }
];

const mockMeals: MealDTO[] = [
  { id: 1, mealName: 'Poulet rôti', mealType: 'DEJEUNER', mealDate: today },
  { id: 2, mealName: 'Yaourt', mealType: 'COLLATION', mealDate: today }
];

const mockTasks: TasksDTO[] = [
  { id: 1, tasksName: 'Courses', tasksType: 'PERSO', tasksPriority: 'HIGH', tasksDate: today },
  { id: 2, tasksName: 'Réunion', tasksType: 'TRAVAIL', tasksPriority: 'MEDIUM', tasksStatus: 'DONE', tasksDate: today }
];

const mockExpenses: ExpensesDTO[] = [
  { id: 1, expensesName: 'Loyer', amount: 785, recType: 'Monthly', startDate: today },
  { id: 2, expensesName: 'Netflix', amount: 13, recType: 'Monthly', startDate: today },
  { id: 3, expensesName: 'Spotify', amount: 10, recType: 'Yearly', startDate: today }
];

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;

  const mockApptService = {
    appointmentsSignal: signal(mockAppts),
    loadWeek: vi.fn(() => of(mockAppts))
  };

  const mockMealService = {
    mealsSignal: signal(mockMeals),
    loadWeek: vi.fn(() => of(mockMeals))
  };

  const mockTasksService = {
    tasksListSignal: signal(mockTasks),
    loadAllTasks: vi.fn(() => of(mockTasks))
  };

  const mockExpensesService = {
    expensesListSignal: signal(mockExpenses),
    intSignal: signal(808),
    loadAllExpenses: vi.fn(() => of(mockExpenses)),
    getAmountPerMonth: vi.fn(() => of(808))
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        { provide: AppointmentService, useValue: mockApptService },
        { provide: MealService, useValue: mockMealService },
        { provide: TasksService, useValue: mockTasksService },
        { provide: ExpensesSevice, useValue: mockExpensesService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler loadMonth au démarrage', () => {
    expect(mockApptService.loadWeek).toHaveBeenCalled();
    expect(mockMealService.loadWeek).toHaveBeenCalled();
    expect(mockTasksService.loadAllTasks).toHaveBeenCalled();
    expect(mockExpensesService.loadAllExpenses).toHaveBeenCalled();
  });

  it('devrait avoir le bon titre de mois', () => {
    const title = component.monthTitle();
    expect(title).toBeTruthy();
    expect(typeof title).toBe('string');
  });

  it('devrait générer entre 28 et 42 jours dans la grille', () => {
    const days = component.calendarDays();
    expect(days.length).toBeGreaterThanOrEqual(28);
    expect(days.length).toBeLessThanOrEqual(42);
    expect(days.length % 7).toBe(0);
  });

  it('devrait avoir exactement un jour marqué comme aujourd\'hui', () => {
    const todayDays = component.calendarDays().filter(d => d.isToday);
    expect(todayDays.length).toBe(1);
  });

  it('devrait calculer le total des dépenses', () => {
    expect(component.totalExpenses()).toBe(808);
  });

  it('devrait compter les rendez-vous', () => {
    expect(component.nbAppts()).toBeGreaterThanOrEqual(2);
  });

  it('devrait compter les repas', () => {
    expect(component.nbMeals()).toBeGreaterThanOrEqual(2);
  })

  it('devrait compter les tâches', () => {
    expect(component.nbTasks()).toBe(2);
  });

  it('devrait sélectionner un jour du mois courant', () => {
    const currentMonthDay = component.calendarDays().find(d => d.isCurrentMonth && d.isToday);
    if (currentMonthDay) {
      component.selectDay(currentMonthDay);
      expect(component.selectedDay()).toBe(currentMonthDay.dateStr);
    }
  });

  it('devrait désélectionner un jour au second clic', () => {
    const currentMonthDay = component.calendarDays().find(d => d.isCurrentMonth && d.isToday);
    if (currentMonthDay) {
      component.selectDay(currentMonthDay);
      component.selectDay(currentMonthDay);
      expect(component.selectedDay()).toBeNull();
    }
  });

  it('ne devrait pas sélectionner un jour hors du mois courant', () => {
    const otherMonthDay = component.calendarDays().find(d => !d.isCurrentMonth);
    if (otherMonthDay) {
      component.selectDay(otherMonthDay);
      expect(component.selectedDay()).toBeNull();
    }
  });

  it('devrait retourner les événements du jour sélectionné', () => {
    component.selectedDay.set(today);
    const evs = component.selectedDayEvents();
    expect(evs.length).toBeGreaterThan(0);
  });

  it('devrait changer de mois avec nextMonth', () => {
    const initialMonth = component.currentMonth().month;
    component.nextMonth();
    const nextMonth = (initialMonth + 1) % 12;
    expect(component.currentMonth().month).toBe(nextMonth);
  });

  it('devrait changer de mois avec prevMonth', () => {
    const initialMonth = component.currentMonth().month;
    component.prevMonth();
    const prevMonth = (initialMonth - 1 + 12) % 12;
    expect(component.currentMonth().month).toBe(prevMonth);
  });

  it('devrait revenir au mois courant avec goToday', () => {
    component.nextMonth();
    component.nextMonth();
    component.goToday();
    expect(component.monthOffset()).toBe(0);
  });

  it('devrait réinitialiser le jour sélectionné au changement de mois', () => {
    const day = component.calendarDays().find(d => d.isCurrentMonth && d.isToday);
    if (day) component.selectDay(day);
    component.nextMonth();
    expect(component.selectedDay()).toBeNull();
  });

  it('devrait convertir une date en string correctement', () => {
    const d = new Date('2026-08-05T00:00:00');
    expect(component.toDateStr(d)).toBe('2026-08-05');
  });

  it('devrait retourner le bon label de type de rdv', () => {
    expect(component.getApptTypeLabel('MEDICAL')).toBe('Médical');
    expect(component.getApptTypeLabel('SPORT')).toBe('Sport');
    expect(component.getApptTypeLabel('TRAVAIL')).toBe('Travail');
  });

  it('devrait retourner le bon label de repas', () => {
    expect(component.getMealTypeLabel('DEJEUNER')).toBe('Déjeuner');
    expect(component.getMealTypeLabel('PETIT_DEJ')).toBe('Petit-déj');
    expect(component.getMealTypeLabel('DINER')).toBe('Dîner');
  });

  it('devrait retourner le bon label de priorité', () => {
    expect(component.getPriorityLabel('HIGH')).toBe('haute');
    expect(component.getPriorityLabel('MEDIUM')).toBe('moyenne');
    expect(component.getPriorityLabel('LOW')).toBe('basse');
  });

  it('devrait retourner le bon label de récurrence', () => {
    expect(component.getRecLabel('Monthly')).toBe('Mensuel');
    expect(component.getRecLabel('Yearly')).toBe('Annuel');
    expect(component.getRecLabel('Daily')).toBe('Quotidien');
  });
});