import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { TodayComponent } from './today';

describe('Today', () => {
  let component: TodayComponent;
  let fixture: ComponentFixture<TodayComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodayComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TodayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const flush = (part: string, body: object | null, status = 200) =>
    http.expectOne(r => r.url.includes(part)).flush(body, { status, statusText: 'x' });

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('affiche les cinq cartes avec leurs données', () => {
    const d = component.todayStr;
    flush('/appointments/week', [{ id: 1, title: 'Dentiste', apptDate: d, apptTime: '09:30:00', location: 'Paris' }]);
    flush('/meals/week', [{ id: 1, mealName: 'Pâtes', mealDate: d, calories: 500 }]);
    flush('/tasks/all', [{ id: 7, tasksName: 'Payer loyer', tasksDate: d, tasksStatus: 'PENDING' }]);
    flush('/coach/plan', { generatedAt: d, analysis: '', days: Array.from({ length: 7 }, () => ({ day: 'x', type: 'Run', label: 'Footing', done: false })) });
    flush('/monthlyTrend', { year: 2026, currentMonth: 2, amounts: [100, 150] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('section.today-card').length).toBe(5);
    ['Dentiste', 'Paris', 'Pâtes', 'Payer loyer', 'Footing', 'Mois précédent'].forEach(t => expect(text()).toContain(t));
  });

  it('une carte en erreur n\'empêche pas les autres', () => {
    flush('/appointments/week', null, 500);
    flush('/meals/week', []);
    flush('/tasks/all', []);
    flush('/coach/plan', null);
    flush('/monthlyTrend', { year: 2026, currentMonth: 1, amounts: [10] });
    fixture.detectChanges();

    expect(text()).toContain('Impossible de charger les rendez-vous');
    expect(text()).toContain('Rien de prévu aujourd\'hui');
    expect(text()).toContain('Aucun repas');
    expect(text()).not.toContain('Impossible de charger les tâches');
  });

  it('cocher une tâche appelle le service', () => {
    flush('/appointments/week', []);
    flush('/meals/week', []);
    flush('/tasks/all', [{ id: 7, tasksName: 'Payer loyer', tasksDate: '2000-01-01', tasksStatus: 'PENDING' }]);
    flush('/coach/plan', null);
    flush('/monthlyTrend', { year: 2026, currentMonth: 1, amounts: [10] });
    fixture.detectChanges();
    expect(text()).toContain('En retard');

    fixture.nativeElement.querySelector('input[type=checkbox]').click();
    const req = http.expectOne(r => r.url.endsWith('/tasks/update'));
    expect(req.request.body).toEqual({ id: 7, status: 'DONE' });
  });
});
