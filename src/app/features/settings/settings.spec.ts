import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SettingsComponent } from './settings';

describe('SettingsComponent - abonnement agenda', () => {
  it('construit les liens .ics, webcal et Google à partir du jeton', () => {
    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    const fixture = TestBed.createComponent(SettingsComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne(r => r.url.endsWith('/api/calendar/token')).flush({ token: 'abc' });
    const c = fixture.componentInstance;

    expect(c.feedUrl()).toBe('http://localhost:8080/api/calendar/feed/abc.ics');
    expect(c.feedWebcal()).toBe('webcal://localhost:8080/api/calendar/feed/abc.ics');
    expect(c.feedGoogle()).toBe(
      'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent('webcal://localhost:8080/api/calendar/feed/abc.ics'));
  });
});

describe('SettingsComponent - export des données', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    const fixture = TestBed.createComponent(SettingsComponent);
    const http = TestBed.inject(HttpTestingController);
    return { c: fixture.componentInstance, http };
  }

  it('appelle /users/me/export en blob et déclenche le téléchargement', () => {
    const { c, http } = setup();
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    c.exportData();
    expect(c.exporting()).toBe(true);
    const req = http.expectOne(r => r.url.endsWith('/api/users/me/export'));
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['{}']));

    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith('blob:x');
    expect(c.exporting()).toBe(false);
    create.mockRestore(); revoke.mockRestore(); click.mockRestore();
  });

  it('affiche une erreur lisible si l\'export échoue', () => {
    const { c, http } = setup();
    c.exportData();
    http.expectOne(r => r.url.endsWith('/api/users/me/export')).error(new ProgressEvent('error'), { status: 500 });
    expect(c.exportError()).toContain('Impossible de télécharger');
    expect(c.exporting()).toBe(false);
  });
});
