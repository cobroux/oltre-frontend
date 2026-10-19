import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GarminService } from './garmin.service';

describe('GarminService.disconnect', () => {
  let service: GarminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(GarminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('signale un échec au lieu de l\'ignorer', () => {
    service.isConnected.set(true);

    service.disconnect().subscribe();
    http.expectOne(req => req.method === 'DELETE').flush(null, { status: 502, statusText: 'Bad Gateway' });

    expect(service.disconnectError()).toBe('Impossible de déconnecter Garmin. Réessaie plus tard.');
    expect(service.isConnected()).toBe(true);
  });

  it('efface le message et déconnecte en cas de succès', () => {
    service.disconnectError.set('ancienne erreur');
    service.isConnected.set(true);

    service.disconnect().subscribe();
    http.expectOne(req => req.method === 'DELETE').flush(null);

    expect(service.disconnectError()).toBeNull();
    expect(service.isConnected()).toBe(false);
  });
});

describe('GarminService - activités du dimanche', () => {
  let service: GarminService;
  let http: HttpTestingController;

  const run = (id: string, startLocal: string) => ({
    id, name: 'Run', sportType: 'running', startLocal, distance: 5000, movingTime: 1500,
    elevationGain: 0, avgSpeed: 0, maxSpeed: 0, calories: 300
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T12:00:00Z')); // mercredi, semaine du 12 au 18
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(GarminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('compte le dimanche, que startLocal soit en "T" ou en espace', () => {
    service.loadActivities().subscribe();
    http.expectOne(req => req.url.includes('/activities')).flush([
      run('1', '2026-10-12T07:00:00'),
      run('2', '2026-10-18T09:00:00'),
      run('3', '2026-10-18 10:00:00'),
      run('4', '2026-10-19 08:00:00') // lundi suivant : hors semaine
    ]);

    expect(service.weekStatsSignal()?.runCount).toBe(3);
  });

  it('compte le dimanche dans la semaine dernière', () => {
    vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
    service.loadLastWeek().subscribe();
    http.expectOne(req => req.url.includes('/activities')).flush([
      run('1', '2026-10-18 10:00:00'),
      run('2', '2026-10-19 08:00:00')
    ]);

    expect(service.lastWeekActivitiesSignal().map(a => a.id)).toEqual(['1']);
  });
});
