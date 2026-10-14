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
