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

  // Vrai quand on est sur /login
  isLoginPage = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).url === '/login')
    ),
    { initialValue: this.router.url === '/login' }
  );
}