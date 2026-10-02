import { Component, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { BannerComponent } from './shared/banner/banner';
import { SidebarComponent } from './shared/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [BannerComponent, RouterOutlet, SidebarComponent, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('oltre-frontend');
  private router = inject(Router);

  private static readonly AUTH_ROUTES = ['/login', '/register'];

  // Vrai quand on est sur une page d'authentification (login/register),
  // qui s'affiche en pleine page sans sidebar ni banner.
  isAuthPage = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => App.AUTH_ROUTES.includes((e as NavigationEnd).url))
    ),
    { initialValue: App.AUTH_ROUTES.includes(this.router.url) }
  );
}