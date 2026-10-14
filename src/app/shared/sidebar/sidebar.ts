import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { initialsOf } from '../../core/utils/user.utils';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  host: { '(document:keydown.escape)': 'close()' }
})
export class SidebarComponent {
  private userService = inject(UserService);
  user = this.userService.currentUser;

  private authService = inject(AuthService);
  logout() { this.authService.logout(); }

  // Tiroir mobile (< 900px) : sans effet sur desktop où la sidebar reste fixe.
  open = signal(false);
  toggle() { this.open.update(v => !v); }
  close() { this.open.set(false); }

  initials(): string {
    return initialsOf(this.user()?.username);
  }
}
