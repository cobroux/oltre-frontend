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
