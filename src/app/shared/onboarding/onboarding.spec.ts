import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { OnboardingComponent } from './onboarding';
import { UserService } from '../../core/services/user.service';

describe('Onboarding', () => {
  function setup(onboardingDone: boolean) {
    TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    TestBed.inject(UserService).currentUser.set({ username: 'u', age: null, birthDate: null, onboardingDone });
    const fixture = TestBed.createComponent(OnboardingComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const click = (label: string) => {
      Array.from(el.querySelectorAll('button')).find(b => b.textContent!.trim() === label)!.click();
      fixture.detectChanges();
    };
    return { fixture, el, click, http: TestBed.inject(HttpTestingController) };
  }

  it('affiché si onboardingDone=false, avec rôle dialog', () => {
    const { el } = setup(false);
    const d = el.querySelector('[role="dialog"]')!;
    expect(d.getAttribute('aria-modal')).toBe('true');
    expect(el.textContent).toContain('Étape 1 sur 4');
  });

  it('absent si onboardingDone=true', () => {
    const { el } = setup(true);
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('navigue entre les étapes', () => {
    const { el, click } = setup(false);
    click('Suivant');
    expect(el.textContent).toContain('Étape 2 sur 4');
    click('Précédent');
    expect(el.textContent).toContain('Étape 1 sur 4');
  });

  it('Passer : POST onboarding puis fermeture', () => {
    const { el, click, http } = setup(false);
    click('Passer');
    http.expectOne(r => r.method === 'POST' && r.url.endsWith('/users/me/onboarding')).flush(null, { status: 204, statusText: 'No Content' });
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('Échap équivaut à Passer', () => {
    const { el, fixture, http } = setup(false);
    el.querySelector('[role="dialog"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/users/me/onboarding'));
  });
});
