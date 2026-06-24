import { Component, OnInit, inject } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { UserDTO } from '../../core/models/user.dto';


@Component({
  selector: 'app-banner',
  standalone: true,
  templateUrl: './banner.html',
  styleUrls: ['./banner.css'],
})
export class BannerComponent implements OnInit {

  user: UserDTO | null = null;
  loading = true;
  error = false;

  private userService = inject(UserService);
  
  ngOnInit(): void {
  
    this.userService.loadUser().subscribe({
      next: (u) => {
        this.user = u;
        this.loading = false;
        console.log("user -> " + u.username)
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }
}