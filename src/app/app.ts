import { Component, signal } from '@angular/core';
import { BannerComponent } from './shared/banner/banner';

@Component({
  selector: 'app-root',
  imports: [BannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('oltre-frontend');
}
