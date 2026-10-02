import { Component, OnInit, inject } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { initialsOf } from '../../core/utils/user.utils';


@Component({
  selector: 'app-banner',
  standalone: true,
  templateUrl: './banner.html',
    imports: [CommonModule, RouterLink],
  styleUrls: ['./banner.css'],
})
export class BannerComponent implements OnInit {



  private userService = inject(UserService);

    user = this.userService.currentUser;

    ngOnInit(): void {
      this.userService.loadUser().subscribe();

  }

  initials(): string {
    return initialsOf(this.user()?.username);
  }
}