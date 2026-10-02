import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { GarminService } from '../../core/services/garmin.service';
import { UserStatsDTO } from '../../core/models/user.dto';
import { RunningRecord, SportRecord } from '../../core/models/garmin.dto';

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
  runningRecords = signal<RunningRecord[]>([]);
  otherRecords = signal<SportRecord[]>([]);
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
        this.runningRecords.set(r.runningRecords);
        this.otherRecords.set(r.otherRecords);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  logout() {
    this.authService.logout();
  }

  initials(): string {
    const name = this.user()?.username ?? '';
    return name.slice(0, 2).toUpperCase();
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}h${String(m).padStart(2, '0')}`
      : `${m}min${String(s).padStart(2, '0')}`;
  }

  private matchType(type: string, ...needles: string[]): boolean {
    return needles.some(n => type?.includes(n));
  }

  sportLabel(type: string): string {
    if (this.matchType(type, 'cycling', 'biking')) return 'Vélo';
    if (this.matchType(type, 'strength')) return 'Musculation';
    if (this.matchType(type, 'swim')) return 'Natation';
    if (this.matchType(type, 'walking', 'hiking')) return 'Marche';
    return 'Autre';
  }

  sportIcon(type: string): string {
    if (this.matchType(type, 'cycling', 'biking')) return 'ti-bike';
    if (this.matchType(type, 'strength')) return 'ti-barbell';
    if (this.matchType(type, 'swim')) return 'ti-swimming';
    if (this.matchType(type, 'walking', 'hiking')) return 'ti-walk';
    return 'ti-activity';
  }

  sportIconClass(type: string): string {
    if (this.matchType(type, 'cycling', 'biking')) return 'icon-ride';
    if (this.matchType(type, 'strength')) return 'icon-weight';
    if (this.matchType(type, 'swim')) return 'icon-swim';
    if (this.matchType(type, 'walking', 'hiking')) return 'icon-walk';
    return 'icon-other';
  }
}
