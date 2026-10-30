import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ForgotPasswordComponent } from './forgot-password';

describe('ForgotPassword', () => {
  const NEUTRAL = 'Si un compte existe avec cet email';

  function setup() {
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.fr' });
    fixture.componentInstance.onSubmit();
    return { fixture, http: TestBed.inject(HttpTestingController) };
  }

  it('envoie l\'email puis affiche le message neutre sur 204', async () => {
    const { fixture, http } = setup();
    const req = http.expectOne(r => r.url.endsWith('/auth/password/forgot'));
    expect(req.request.body).toEqual({ email: 'a@b.fr' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(NEUTRAL);
  });

  it('affiche une erreur distincte (pas le message neutre) sur 500', async () => {
    const { fixture, http } = setup();
    http.expectOne(r => r.url.endsWith('/auth/password/forgot')).flush({}, { status: 500, statusText: 'err' });
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Impossible d\'envoyer la demande, réessaie');
    expect(text).not.toContain(NEUTRAL);
  });
});
