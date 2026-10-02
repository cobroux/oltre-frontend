import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { GarminService } from '../../core/services/garmin.service';
import { UserStatsDTO } from '../../core/models/user.dto';
import { SportRecord } from '../../core/models/garmin.dto';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private garminService = inject(GarminService);

  user = this.userService.currentUser;
  stats = signal<UserStatsDTO | null>(null);
  records = signal<SportRecord[]>([]);
  isLoading = signal(true);
  userLoadError = signal(false);

  ngOnInit(): void {
    this.userService.loadUser().subscribe({
      error: () => this.userLoadError.set(true)
    });

    this.userService.getStats().subscribe({
      next: s => this.stats.set(s),
      error: () => this.stats.set(null)
    });

    this.garminService.getRecords().subscribe({
      next: r => {
        this.records.set(r);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  logout() {
    this.authService.logout();
  }

  sportLabel(type: string): string {
    const labels: Record<string, string> = {
      running: 'Course à pied',
      cycling: 'Vélo',
      road_biking: 'Vélo',
      swimming: 'Natation',
      strength_training: 'Musculation',
      walking: 'Marche'
    };
    return labels[type] ?? type;
  }
}
