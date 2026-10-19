import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { SportComponent } from './sport';

describe('Sport', () => {
  let component: SportComponent;
  let fixture: ComponentFixture<SportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('requêtes', () => {
    let http: HttpTestingController;
    beforeEach(() => (http = TestBed.inject(HttpTestingController)));

    const act = (id: string) => ({ id, name: id, sportType: 'running', startLocal: '2026-10-12T07:00:00' }) as never;

    it('annule le détail de A quand on ouvre B', () => {
      component.openActivity(act('A'));
      const reqA = http.expectOne(r => r.url.endsWith('/activities/A/details'));
      component.openActivity(act('B'));

      expect(reqA.cancelled).toBe(true);
      http.expectOne(r => r.url.endsWith('/activities/B/details'));
    });

    it('affiche une erreur si la semaine dernière échoue et réessaie au clic suivant', () => {
      component.selectWeek('last');
      http.expectOne(r => r.url.includes('/activities')).flush(null, { status: 500, statusText: 'KO' });
      expect(component.lastWeekError()).toBe('Impossible de charger la semaine dernière.');

      component.selectWeek('current');
      component.selectWeek('last');
      expect(component.lastWeekError()).toBeNull();
      http.expectOne(r => r.url.includes('/activities')).flush([]);
      expect(component.lastWeekError()).toBeNull();
    });

    it('affiche une erreur si la semaine en cours échoue', () => {
      http.expectOne(r => r.url.endsWith('/status')).flush({ connected: true });
      http.expectOne(r => r.url.includes('/activities')).flush(null, { status: 500, statusText: 'KO' });
      expect(component.loadError()).toBe('Impossible de charger les activités.');
    });
  });
});
