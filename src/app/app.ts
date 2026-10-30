import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { BannerComponent } from './shared/banner/banner';
import { OnboardingComponent } from './shared/onboarding/onboarding';
import { SidebarComponent } from './shared/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [BannerComponent, RouterOutlet, SidebarComponent, OnboardingComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('oltre-frontend');
  private router = inject(Router);
  // Injecté uniquement pour forcer son instanciation au démarrage - sinon
  // le thème sauvegardé ne s'applique qu'à la première visite de /settings.
  private themeService = inject(ThemeService);

  private static readonly AUTH_ROUTES = ['/login', '/register', '/cgu', '/confidentialite'];

  // Vrai quand on est sur une page d'authentification (login/register/pages légales),
  // qui s'affiche en pleine page sans sidebar ni banner.
  isAuthPage = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => App.AUTH_ROUTES.includes((e as NavigationEnd).url))
    ),
    { initialValue: App.AUTH_ROUTES.includes(this.router.url) }
  );

  // Sans ça, le service worker garde l'ancienne version tant que tous les
  // onglets ne sont pas fermés. On recharge à la navigation suivante (pas tout
  // de suite) pour ne jamais perdre un formulaire en cours de saisie.
  private updateReady = false;

  constructor() {
    const swUpdate = inject(SwUpdate, { optional: true });
    if (swUpdate?.isEnabled) {
      swUpdate.versionUpdates.pipe(
        filter(e => e.type === 'VERSION_READY'),
        takeUntilDestroyed()
      ).subscribe(() => this.updateReady = true);
    }
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd && this.updateReady),
      takeUntilDestroyed()
    ).subscribe(() => this.reload());
  }

  protected reload(): void {
    document.location.reload();
  }
}