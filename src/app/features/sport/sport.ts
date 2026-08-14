import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StravaService } from '../../core/services/strava.service';
import { StravaActivity } from '../../core/models/strava.dto';

@Component({
  selector: 'app-sport',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sport.html',
  styleUrl: './sport.css'
})
export class SportComponent implements OnInit {

  private stravaService = inject(StravaService);

  activities = this.stravaService.activitiesSignal;
  weekStats  = this.stravaService.weekStatsSignal;
  isLoading  = this.stravaService.isLoading;

  ngOnInit() {
    this.stravaService.loadActivities().subscribe({
      error: err => console.error('Erreur Strava :', err)
    });
  }

  // ── Helpers affichage ────────────────────────────────
  formatDistance(meters: number): string {
    if (!meters) return '—';
    return meters >= 1000
      ? `${(meters / 1000).toFixed(1)} km`
      : `${Math.round(meters)} m`;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return `Auj. ${d.getHours()}h${String(d.getMinutes()).padStart(2,'0')}`;
    if (d.toDateString() === yesterday.toDateString()) return `Hier ${d.getHours()}h${String(d.getMinutes()).padStart(2,'0')}`;
    return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}h${String(d.getMinutes()).padStart(2,'0')}`;
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      Run: 'ti-run', Ride: 'ti-bike',
      WeightTraining: 'ti-barbell', Swim: 'ti-swimming',
      Walk: 'ti-walk'
    };
    return icons[type] ?? 'ti-activity';
  }

  getIconClass(type: string): string {
    const classes: Record<string, string> = {
      Run: 'icon-run', Ride: 'icon-ride',
      WeightTraining: 'icon-weight', Swim: 'icon-swim',
      Walk: 'icon-walk'
    };
    return classes[type] ?? 'icon-other';
  }

  
  getBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      Run: 'badge-run', Ride: 'badge-ride',
      WeightTraining: 'badge-weight'
    };
    return classes[type] ?? 'badge-other';
  }

  getBadgeLabel(type: string): string {
    const labels: Record<string, string> = {
      Run: 'Course', Ride: 'Vélo',
      WeightTraining: 'Musculation', Swim: 'Natation', Walk: 'Marche'
    };
    return labels[type] ?? type;
  }

  hasDistance(a: StravaActivity): boolean { return a.distance > 0; }
  hasElevation(a: StravaActivity): boolean { return a.elevationGain > 0; }
}