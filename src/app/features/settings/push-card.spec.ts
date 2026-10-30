import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SwPush } from '@angular/service-worker';
import { of } from 'rxjs';
import { PushCardComponent } from './push-card';

const PREFS = { apptEnabled: true, apptMinutesBefore: 30, tasksEnabled: false, tasksTime: '07:30',
  coachEnabled: true, subscriptionCount: 2 };

function setup(subscription: unknown = null) {
  const sw = {
    isEnabled: true,
    subscription: of(subscription),
    requestSubscription: vi.fn().mockResolvedValue({ toJSON: () => ({ endpoint: 'https://p/x y' }) }),
    unsubscribe: vi.fn().mockResolvedValue(undefined)
  };
  TestBed.configureTestingModule({
    imports: [PushCardComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), { provide: SwPush, useValue: sw }]
  });
  const fixture = TestBed.createComponent(PushCardComponent);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  http.expectOne(r => r.url.endsWith('/api/push/preferences')).flush(PREFS);
  return { c: fixture.componentInstance, http, sw };
}
const tick = () => new Promise(r => setTimeout(r));

describe('PushCardComponent', () => {
  it('ne demande aucune permission au chargement et charge les préférences', () => {
    const { c, sw } = setup();
    expect(sw.requestSubscription).not.toHaveBeenCalled();
    expect(c.prefs().apptMinutesBefore).toBe(30);
    expect(c.subscriptionCount()).toBe(2);
  });

  it('activer : public-key puis requestSubscription puis POST', async () => {
    const { c, http, sw } = setup();
    c.enable();
    http.expectOne(r => r.url.endsWith('/api/push/public-key')).flush({ publicKey: 'KEY' });
    await tick();
    expect(sw.requestSubscription).toHaveBeenCalledWith({ serverPublicKey: 'KEY' });
    const post = http.expectOne(r => r.method === 'POST' && r.url.endsWith('/api/push/subscriptions'));
    expect(post.request.body).toEqual({ endpoint: 'https://p/x y' });
    post.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('503 sur public-key : message serveur non configuré', () => {
    const { c, http } = setup();
    c.enable();
    http.expectOne(r => r.url.endsWith('/api/push/public-key')).flush(null, { status: 503, statusText: 'x' });
    expect(c.serverOff()).toBe(true);
  });

  it('désactiver : DELETE avec endpoint encodé puis unsubscribe', async () => {
    const { c, http, sw } = setup({ endpoint: 'https://p/x y' });
    c.disable();
    const del = http.expectOne(r => r.method === 'DELETE');
    expect(del.request.urlWithParams).toContain('endpoint=' + encodeURIComponent('https://p/x y'));
    del.flush(null, { status: 204, statusText: 'No Content' });
    await tick();
    expect(sw.unsubscribe).toHaveBeenCalled();
  });

  it('enregistre les préférences avec les bonnes valeurs', () => {
    const { c, http } = setup();
    c.patch({ tasksEnabled: true, tasksTime: '09:15' });
    c.savePrefs();
    const put = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/api/push/preferences'));
    expect(put.request.body).toEqual({ apptEnabled: true, apptMinutesBefore: 30, tasksEnabled: true,
      tasksTime: '09:15', coachEnabled: true });
    put.flush({ ...PREFS, tasksEnabled: true, tasksTime: '09:15', subscriptionCount: 3 });
    expect(c.prefsMessage()).toContain('enregistrées');
    expect(c.subscriptionCount()).toBe(3);
  });
});
