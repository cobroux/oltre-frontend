import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { GarminService } from '../../core/services/garmin.service';
import { UserStatsDTO } from '../../core/models/user.dto';
import { GarminActivity, GarminRecordsResponse } from '../../core/models/garmin.dto';
import { initialsOf } from '../../core/utils/user.utils';

type RecordsPeriod = 'allTime' | 'thisYear';

interface WeeklyDistance {
  label: string;
  km: number;
}

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
  isLoading = signal(true);
  userLoadError = signal(false);

  period = signal<RecordsPeriod>('allTime');
  private records = signal<GarminRecordsResponse>({
    allTime: { runningRecords: [], otherRecords: [] },
    thisYear: { runningRecords: [], otherRecords: [] }
  });

  runningRecords = computed(() => this.records()[this.period()].runningRecords);
  otherRecords = computed(() => this.records()[this.period()].otherRecords);

  weeklyDistance = signal<WeeklyDistance[]>([]);
  maxWeeklyKm = computed(() => Math.max(1, ...this.weeklyDistance().map(w => w.km)));

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

    const eightWeeksAgo = this.toDateStr(this.mondayOf(new Date(Date.now() - 7 * 7 * 86400000)));
    this.garminService.getActivitiesSince(eightWeeksAgo, 300).subscribe(activities => {
      this.weeklyDistance.set(this.bucketWeeklyDistance(activities));
    });
  }

  setPeriod(period: RecordsPeriod) {
    this.period.set(period);
  }

  logout() {
    this.authService.logout();
  }

  initials(): string {
    return initialsOf(this.user()?.username);
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}h${String(m).padStart(2, '0')}`
      : `${m}min${String(s).padStart(2, '0')}`;
  }

  private mondayOf(date: Date): Date {
    const day = date.getDay() || 7;
    const m = new Date(date);
    m.setDate(date.getDate() - day + 1);
    m.setHours(0, 0, 0, 0);
    return m;
  }

  // N'utilise jamais toISOString() ici : elle convertit en UTC, donc pour
  // tout fuseau en avance sur UTC (France...), minuit local tombe la veille
  // en UTC et décale la date d'un jour - des séances pouvaient se retrouver
  // rangées dans la mauvaise semaine. On reste en composants de date locaux.
  private toDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private bucketWeeklyDistance(activities: GarminActivity[]): WeeklyDistance[] {
    const thisMonday = this.mondayOf(new Date());
    const weeks: { start: Date; km: number }[] = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - (7 - i) * 7);
      return { start, km: 0 };
    });

    for (const a of activities) {
      if (!a.distance) continue;
      const weekStart = this.mondayOf(new Date(a.startLocal)).getTime();
      const bucket = weeks.find(w => w.start.getTime() === weekStart);
      if (bucket) bucket.km += a.distance / 1000;
    }

    return weeks.map(w => ({
      label: `${w.start.getDate()}/${w.start.getMonth() + 1}`,
      km: Math.round(w.km * 10) / 10
    }));
  }

  private matchType(type: string, ...needles: string[]): boolean {
    return needles.some(n => type?.includes(n));
  }

  sportLabel(type: string): string {
    if (this.matchType(type, 'cycling', 'biking')) return 'Vélo';
    if (this.matchType(type, 'swim')) return 'Natation';
    if (this.matchType(type, 'walking', 'hiking')) return 'Marche';
    return 'Autre';
  }

  sportIcon(type: string): string {
    if (this.matchType(type, 'cycling', 'biking')) return 'ti-bike';
    if (this.matchType(type, 'swim')) return 'ti-swimming';
    if (this.matchType(type, 'walking', 'hiking')) return 'ti-walk';
    return 'ti-activity';
  }

  sportIconClass(type: string): string {
    if (this.matchType(type, 'cycling', 'biking')) return 'icon-ride';
    if (this.matchType(type, 'swim')) return 'icon-swim';
    if (this.matchType(type, 'walking', 'hiking')) return 'icon-walk';
    return 'icon-other';
  }

  sportTileClass(type: string): string {
    if (this.matchType(type, 'cycling', 'biking')) return 'tile-ride';
    if (this.matchType(type, 'swim')) return 'tile-swim';
    if (this.matchType(type, 'walking', 'hiking')) return 'tile-walk';
    return 'tile-other';
  }
}
