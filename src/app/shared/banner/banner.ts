import { Component, OnInit, inject } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { EMPTY, catchError } from 'rxjs';


@Component({
  selector: 'app-banner',
  standalone: true,
  templateUrl: './banner.html',
    imports: [CommonModule],
  styleUrls: ['./banner.css'],
})
export class BannerComponent implements OnInit {



  private userService = inject(UserService);

    user = this.userService.currentUser;

  todayLabel = this.formatToday();

    ngOnInit(): void {
      // Si le profil ne se charge pas, la bannière affiche « Bonjour » sans nom.
      this.userService.loadUser().pipe(catchError(() => EMPTY)).subscribe();

  }

  private formatToday(): string {
    const label = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}