import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {
  private userService = inject(UserService);
  user = this.userService.currentUser;

  initials(): string {
    const name = this.user()?.username ?? '';
    return name.slice(0, 2).toUpperCase();
  }
}