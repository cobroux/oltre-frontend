import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { CoachComponent } from './coach';
import { CoachService } from '../../core/services/coach.service';

describe('CoachComponent - suppression d\'objectif', () => {
  const service = {
    goalsSignal: signal([]),
    planSignal: signal(null),
    loadGoals: vi.fn(() => of([])),
    loadPlan: vi.fn(() => of(null)),
    deleteGoal: vi.fn((_id: number) => of(undefined))
  };
  let c: CoachComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [CoachComponent],
      providers: [{ provide: CoachService, useValue: service }, provideRouter([])]
    });
    c = TestBed.createComponent(CoachComponent).componentInstance;
  });

  it('demande confirmation au premier clic, supprime au second', () => {
    c.requestDelete(5);
    expect(service.deleteGoal).not.toHaveBeenCalled();
    expect(c.confirmDeleteId()).toBe(5);

    c.requestDelete(5);
    expect(service.deleteGoal).toHaveBeenCalledWith(5);
    expect(c.confirmDeleteId()).toBeNull();
  });

  it('annule la demande', () => {
    c.requestDelete(5);
    c.cancelDelete();
    expect(c.confirmDeleteId()).toBeNull();
  });
});
