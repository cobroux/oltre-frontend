import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BannerComponent } from './shared/banner/banner';
import { SidebarComponent } from './shared/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [BannerComponent, RouterOutlet, SidebarComponent, RouterOutlet, RouterLink, RouterLinkActive,],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('oltre-frontend');
}