import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { AppointmentComponent } from './appointment';
import { AppointmentService } from '../../core/services/appointment.service';
import { AppointmentDTO } from '../../core/models/appointment.dto';

const today = new Date().toISOString().split('T')[0];

const mockAppts: AppointmentDTO[] = [
  { id: 1, title: 'Médecin', apptDate: today, apptTime: '09:30', apptType: 'MEDICAL', location: 'Cabinet Martin' },
  { id: 2, title: 'Yoga', apptDate: today, apptTime: '18:30', apptType: 'SPORT' },
  { id: 3, title: 'Réunion', apptDate: '2026-08-10', apptTime: '14:00', apptType: 'TRAVAIL' }
];

describe('AppointmentsComponent', () => {
  let component: AppointmentComponent;
  let fixture: ComponentFixture<AppointmentComponent>;

  const mockService = {
    appointmentsSignal: signal(mockAppts),
    loadWeek: vi.fn(() => of(mockAppts)),
    save: vi.fn((_appt: Partial<AppointmentDTO>) => of({ ...mockAppts[0], id: 99 })),
    delete: vi.fn((_id: number) => of(undefined))
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [AppointmentComponent],
      providers: [
        { provide: AppointmentService, useValue: mockService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler loadWeek au démarrage', () => {
    expect(mockService.loadWeek).toHaveBeenCalled();
  });

  it('devrait avoir 7 jours dans la semaine', () => {
    expect(component.weekDays().length).toBe(7);
  });

  it('devrait retourner les rdv du jour sélectionné triés par heure', () => {
    component.selectedDay.set(today);
    const appts = component.selectedDayAppts();
    expect(appts.length).toBe(2);
    expect(appts[0].apptTime).toBe('09:30');
    expect(appts[1].apptTime).toBe('18:30');
  });

  it('devrait retourner une liste vide si aucun rdv ce jour', () => {
    component.selectedDay.set('2099-01-01');
    expect(component.selectedDayAppts().length).toBe(0);
  });

  it('devrait sélectionner et désélectionner un jour', () => {
    const day = component.weekDays()[0];
    component.selectDay(day);
    expect(component.selectedDay()).toBe(component.toDateStr(day));
    component.selectDay(day);
    expect(component.selectedDay()).toBeNull();
  });

  it('ne devrait pas soumettre si formulaire invalide', () => {
    component.addForm.reset();
    component.onSubmit();
    expect(mockService.save).not.toHaveBeenCalled();
  });

  it('ne devrait pas soumettre si aucun jour sélectionné', () => {
    component.selectedDay.set(null);
    component.addForm.patchValue({ title: 'Test', apptType: 'AUTRE' });
    component.onSubmit();
    expect(mockService.save).not.toHaveBeenCalled();
  });

  it('devrait appeler save avec les bonnes données', () => {
    component.selectedDay.set(today);
    component.addForm.patchValue({
      title: 'Dentiste',
      apptTime: '10:00',
      location: 'Dr Dupont',
      description: 'Détartrage',
      apptType: 'MEDICAL'
    });
    component.onSubmit();
    expect(mockService.save).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Dentiste',
      apptType: 'MEDICAL',
      apptDate: today
    }));
  });

  it('devrait appeler delete avec le bon id', () => {
    component.deleteAppt(1);
    expect(mockService.delete).toHaveBeenCalledWith(1);
  });

  it('devrait détecter aujourd\'hui', () => {
    expect(component.isToday(new Date())).toBe(true);
  });

  it('devrait retourner les bons labels de type', () => {
    expect(component.getTypeLabel('MEDICAL')).toBe('Médical');
    expect(component.getTypeLabel('SPORT')).toBe('Sport');
    expect(component.getTypeLabel('PERSO')).toBe('Perso');
    expect(component.getTypeLabel('TRAVAIL')).toBe('Travail');
    expect(component.getTypeLabel('AUTRE')).toBe('Autre');
  });

  it('devrait retourner les bonnes classes de type', () => {
    expect(component.getTypeClass('MEDICAL')).toBe('type-medical');
    expect(component.getTypeClass('SPORT')).toBe('type-sport');
  });

  it('devrait retourner les bons dots de type', () => {
    expect(component.getDotClass('MEDICAL')).toBe('dot-medical');
    expect(component.getDotClass('TRAVAIL')).toBe('dot-travail');
  });

  it('devrait changer de semaine', () => {
    const initialMonday = component.monday();
    component.nextWeek();
    const nextMonday = component.monday();
    const diff = (nextMonday.getTime() - initialMonday.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(7);
  });

  it('devrait revenir à aujourd\'hui avec goToday', () => {
    component.nextWeek();
    component.nextWeek();
    component.goToday();
    expect(component.weekOffset()).toBe(0);
  });

  it('devrait construire le bon label de jour', () => {
    const label = component.getDayLabel(today);
    expect(label).toBeTruthy();
    expect(typeof label).toBe('string');
  });

  it('devrait convertir une date en string correctement', () => {
    const d = new Date('2026-08-04T00:00:00');
    expect(component.toDateStr(d)).toBe('2026-08-04');
  });
});