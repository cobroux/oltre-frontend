import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register';

describe('Register', () => {
  function setup(enabled: boolean) {
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RegisterComponent);
    http.expectOne(r => r.url.endsWith('/auth/registration')).flush({ enabled });
    fixture.detectChanges();
    return { http, fixture, cmp: fixture.componentInstance };
  }
  const fill = (cmp: RegisterComponent, acceptTerms: boolean) =>
    cmp.registerForm.setValue({ username: 'u', email: 'a@b.fr', password: 'secret123', confirmPassword: 'secret123', age: null, birthDate: '', acceptTerms });

  it('inscriptions fermées : message, pas de formulaire', () => {
    const { fixture } = setup(false);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Les inscriptions sont fermées pour le moment.');
    expect(el.querySelector('form')).toBeNull();
  });

  it('CGU non cochées : aucun appel', () => {
    const { http, cmp } = setup(true);
    fill(cmp, false);
    cmp.onSubmit();
    http.expectNone(r => r.url.endsWith('/auth/register'));
  });

  it('CGU cochées : envoie acceptTerms true', () => {
    const { http, cmp } = setup(true);
    fill(cmp, true);
    cmp.onSubmit();
    const req = http.expectOne(r => r.url.endsWith('/auth/register'));
    expect(req.request.body.acceptTerms).toBe(true);
  });

  it('403 au submit : affiche le message fermé', () => {
    const { http, fixture, cmp } = setup(true);
    fill(cmp, true);
    cmp.onSubmit();
    http.expectOne(r => r.url.endsWith('/auth/register')).flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Les inscriptions sont fermées');
  });
});
