import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ResetPasswordComponent } from './reset-password';

describe('ResetPassword', () => {
  function setup(token: string | null) {
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => token } } } }
      ]
    });
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    return { fixture, c: fixture.componentInstance, http: TestBed.inject(HttpTestingController) };
  }
  const url = (r: { url: string }) => r.url.endsWith('/auth/password/reset');

  it('sans token : message "Lien incomplet" et lien vers /forgot-password', () => {
    const { fixture } = setup(null);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Lien incomplet');
    expect(el.querySelector('a[href="/forgot-password"]')).toBeTruthy();
  });

  it('mots de passe différents : aucun appel', () => {
    const { c, http } = setup('tok');
    c.form.setValue({ password: 'motdepasse1', confirmPassword: 'motdepasse2' });
    c.onSubmit();
    http.expectNone(url);
    expect(c.errorMsg()).toBe('Les mots de passe ne correspondent pas');
  });

  it('succès : POST token + password puis message', async () => {
    const { fixture, c, http } = setup('tok');
    c.form.setValue({ password: 'motdepasse1', confirmPassword: 'motdepasse1' });
    c.onSubmit();
    const req = http.expectOne(url);
    expect(req.request.body).toEqual({ token: 'tok', password: 'motdepasse1' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mot de passe modifié');
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).toBeTruthy();
  });

  it('400 : affiche le message du serveur et propose un nouveau lien', () => {
    const { fixture, c, http } = setup('tok');
    c.form.setValue({ password: 'motdepasse1', confirmPassword: 'motdepasse1' });
    c.onSubmit();
    http.expectOne(url).flush({ message: 'Ce lien n\'est plus valable. Demande un nouveau lien.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ce lien n\'est plus valable.');
    expect(el.querySelector('a[href="/forgot-password"]')).toBeTruthy();
  });
});
