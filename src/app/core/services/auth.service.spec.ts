import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { MealService } from './meal.service';
import { TasksService } from './tasks.service';
import { ExpensesSevice } from './expenses.service';
import { GarminService } from './garmin.service';
import { UserService } from './user.service';
import { CoachService } from './coach.service';
import { AppointmentService } from './appointment.service';

describe('AuthService.logout', () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined, removeItem: () => undefined });
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'login', children: [] }])]
    });
  });

  it('vide les données des services pour que le compte suivant ne les voie pas', () => {
    const meal = TestBed.inject(MealService);
    const tasks = TestBed.inject(TasksService);
    const expenses = TestBed.inject(ExpensesSevice);
    const garmin = TestBed.inject(GarminService);
    const user = TestBed.inject(UserService);
    const coach = TestBed.inject(CoachService);
    const appt = TestBed.inject(AppointmentService);

    meal.mealsSignal.set([{ id: 1 } as never]);
    tasks.tasksListSignal.set([{ id: 1 } as never]);
    expenses.expensesListSignal.set([{ id: 1 } as never]);
    expenses.intSignal.set(3);
    garmin.activitiesSignal.set([{ id: 'a' } as never]);
    garmin.isConnected.set(true);
    garmin.lastWeekActivitiesSignal.set([{ id: 'b' } as never]);
    user.currentUser.set({ id: 1 } as never);
    coach.goalsSignal.set([{ name: 'x' } as never]);
    appt.appointmentsSignal.set([{ id: 1 } as never]);

    TestBed.inject(AuthService).logout();

    expect(meal.mealsSignal()).toEqual([]);
    expect(tasks.tasksListSignal()).toEqual([]);
    expect(expenses.expensesListSignal()).toEqual([]);
    expect(expenses.intSignal()).toBeNull();
    expect(garmin.activitiesSignal()).toEqual([]);
    expect(garmin.isConnected()).toBe(false);
    expect(garmin.lastWeekActivitiesSignal()).toEqual([]);
    expect(user.currentUser()).toBeNull();
    expect(coach.goalsSignal()).toEqual([]);
    expect(appt.appointmentsSignal()).toEqual([]);
  });
});
