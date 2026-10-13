import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GarminService } from '../../core/services/garmin.service';
import { GarminActivity, GarminActivityDetail } from '../../core/models/garmin.dto';

@Component({
  selector: 'app-sport',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sport.html',
  styleUrl: './sport.css'
})
export class SportComponent implements OnInit {

  private garminService = inject(GarminService);

  activities   = this.garminService.activitiesSignal;
  weekStats    = this.garminService.weekStatsSignal;
  isLoading    = this.garminService.isLoading;
  isConnected  = this.garminService.isConnected;
  connectError = this.garminService.connectError;

  // Onglet "Cette semaine" / "Semaine dernière" - la semaine dernière n'est
  // chargée que la première fois qu'on y va, pas au chargement de la page.
  selectedWeek = signal<'current' | 'last'>('current');
  lastWeekLoaded = false;

  activeActivities = computed(() =>
    this.selectedWeek() === 'current' ? this.activities() : this.garminService.lastWeekActivitiesSignal());
  activeStats = computed(() =>
    this.selectedWeek() === 'current' ? this.weekStats() : this.garminService.lastWeekStatsSignal());
  activeLoading = computed(() =>
    this.selectedWeek() === 'current' ? this.isLoading() : this.garminService.isLoadingLastWeek());

  // Détail d'une activité (carte GPS / splits / séries de muscu selon le type)
  selectedActivity = signal<GarminActivity | null>(null);
  activityDetail    = signal<GarminActivityDetail | null>(null);
  detailLoading     = signal(false);
  detailError       = signal<string | null>(null);

  connectForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  ngOnInit() {
    this.garminService.checkStatus().subscribe(status => {
      if (status.connected) {
        this.garminService.loadActivities().subscribe();
      }
    });
  }

  onConnect() {
    if (this.connectForm.invalid) return;
    const { email, password } = this.connectForm.value;
    this.garminService.connect(email!, password!).subscribe(() => {
      if (this.isConnected()) {
        this.connectForm.reset();
        this.garminService.loadActivities().subscribe();
      }
    });
  }

  onDisconnect() {
    this.garminService.disconnect().subscribe();
  }

  selectWeek(week: 'current' | 'last'): void {
    this.selectedWeek.set(week);
    if (week === 'last' && !this.lastWeekLoaded) {
      this.lastWeekLoaded = true;
      this.garminService.loadLastWeek().subscribe();
    }
  }

  openActivity(activity: GarminActivity): void {
    this.selectedActivity.set(activity);
    this.activityDetail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);
    this.garminService.getActivityDetails(activity.id).subscribe({
      next: detail => {
        this.activityDetail.set(detail);
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailError.set("Impossible de charger le détail de cette activité.");
        this.detailLoading.set(false);
      }
    });
  }

  closeActivity(): void {
    this.selectedActivity.set(null);
    this.activityDetail.set(null);
    this.detailError.set(null);
  }

  isStrength(activity: GarminActivity | null): boolean {
    return !!activity && this.matchType(activity.sportType, 'strength');
  }

  // Projette le tracé GPS (lat/lon) dans un repère SVG 300x180, nord en haut,
  // sans déformer le ratio - pas besoin d'une vraie lib de carte pour juste
  // montrer la forme du parcours.
  buildMapPath(polyline: { lat: number; lon: number }[] | null): string {
    if (!polyline || polyline.length < 2) return '';

    const lats = polyline.map(p => p.lat);
    const lons = polyline.map(p => p.lon);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);

    const w = 300, h = 180, pad = 12;
    const spanLat = (maxLat - minLat) || 1;
    const spanLon = (maxLon - minLon) || 1;
    const scale = Math.min((w - 2 * pad) / spanLon, (h - 2 * pad) / spanLat);
    const offsetX = (w - spanLon * scale) / 2;
    const offsetY = (h - spanLat * scale) / 2;

    return polyline.map((p, i) => {
      const x = offsetX + (p.lon - minLon) * scale;
      const y = h - (offsetY + (p.lat - minLat) * scale);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  formatPace(averageSpeedMs: number | undefined | null): string {
    if (!averageSpeedMs) return '—';
    const secPerKm = 1000 / averageSpeedMs;
    const min = Math.floor(secPerKm / 60);
    const sec = Math.round(secPerKm % 60);
    return `${min}:${String(sec).padStart(2, '0')}/km`;
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

  private matchType(type: string, ...needles: string[]): boolean {
    return needles.some(n => type?.includes(n));
  }

  getIcon(type: string): string {
    if (this.matchType(type, 'running')) return 'ti-run';
    if (this.matchType(type, 'cycling', 'biking')) return 'ti-bike';
    if (this.matchType(type, 'strength')) return 'ti-barbell';
    if (this.matchType(type, 'swim')) return 'ti-swimming';
    if (this.matchType(type, 'walking', 'hiking')) return 'ti-walk';
    return 'ti-activity';
  }

  getIconClass(type: string): string {
    if (this.matchType(type, 'running')) return 'icon-run';
    if (this.matchType(type, 'cycling', 'biking')) return 'icon-ride';
    if (this.matchType(type, 'strength')) return 'icon-weight';
    if (this.matchType(type, 'swim')) return 'icon-swim';
    if (this.matchType(type, 'walking', 'hiking')) return 'icon-walk';
    return 'icon-other';
  }

  getBadgeClass(type: string): string {
    if (this.matchType(type, 'running')) return 'badge-run';
    if (this.matchType(type, 'cycling', 'biking')) return 'badge-ride';
    if (this.matchType(type, 'strength')) return 'badge-weight';
    return 'badge-other';
  }

  getBadgeLabel(type: string): string {
    if (this.matchType(type, 'running')) return 'Course';
    if (this.matchType(type, 'cycling', 'biking')) return 'Vélo';
    if (this.matchType(type, 'strength')) return 'Musculation';
    if (this.matchType(type, 'swim')) return 'Natation';
    if (this.matchType(type, 'walking', 'hiking')) return 'Marche';
    return type;
  }

  hasDistance(a: GarminActivity): boolean { return a.distance > 0; }
  hasElevation(a: GarminActivity): boolean { return a.elevationGain > 0; }
}
