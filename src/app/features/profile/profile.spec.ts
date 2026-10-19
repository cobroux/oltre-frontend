import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ProfileComponent } from './profile';

describe('ProfileComponent.bucketWeeklyDistance', () => {
  afterEach(() => vi.useRealTimers());

  it('range une activité au format "date espace heure" (Safari) dans sa semaine', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 12, 0));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    const c = TestBed.createComponent(ProfileComponent).componentInstance as unknown as {
      bucketWeeklyDistance(a: unknown[]): { km: number }[];
    };

    const weeks = c.bucketWeeklyDistance([{ distance: 5000, startLocal: '2026-10-18 09:00:00' }]);

    // Dimanche 18 oct. : semaine du 12 oct., juste avant la semaine courante (dernier bucket).
    expect(weeks[weeks.length - 2].km).toBe(5);
  });
});
