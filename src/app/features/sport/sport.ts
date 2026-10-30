import { Component, OnInit, OnDestroy, inject, signal, computed, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { GarminService } from '../../core/services/garmin.service';
import { GarminActivity, GarminActivityDetail } from '../../core/models/garmin.dto';

@Component({
  selector: 'app-sport',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sport.html',
  styleUrl: './sport.css'
})
export class SportComponent implements OnInit, OnDestroy {

  private garminService = inject(GarminService);

  activities   = this.garminService.activitiesSignal;
  weekStats    = this.garminService.weekStatsSignal;
  isLoading      = this.garminService.isLoading;
  isConnected    = this.garminService.isConnected;
  connectError   = this.garminService.connectError;
  disconnectError = this.garminService.disconnectError;
  connectLoading = this.garminService.connectLoading;

  // Onglet "Cette semaine" / "Semaine dernière" - la semaine dernière n'est
  // chargée que la première fois qu'on y va, pas au chargement de la page.
  selectedWeek = signal<'current' | 'last'>('current');
  lastWeekLoaded = false;
  loadError = signal<string | null>(null);
  lastWeekError = signal<string | null>(null);
  private detailSub?: Subscription;

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

  // Carte OpenStreetMap du tracé GPS - gratuit, sans clé API. Le conteneur
  // n'existe que pendant que le panneau détail est ouvert sur une activité
  // avec tracé, d'où le viewChild signal (se met à jour avec la vue) plutôt
  // qu'un ViewChild classique.
  private leafletMapEl = viewChild<ElementRef<HTMLDivElement>>('leafletMap');
  private mapInstance: L.Map | null = null;

  constructor() {
    effect(() => {
      const el = this.leafletMapEl()?.nativeElement;
      const detail = this.activityDetail();
      if (el && detail?.polyline && detail.polyline.length > 1) {
        this.renderMap(el, detail.polyline);
      } else {
        this.destroyMap();
      }
    });
  }

  ngOnInit() {
    this.garminService.checkStatus().subscribe(status => {
      if (status.connected) this.loadActivities();
    });
  }

  private loadActivities() {
    this.loadError.set(null);
    this.garminService.loadActivities().subscribe({
      error: () => this.loadError.set('Impossible de charger les activités.')
    });
  }

  onConnect() {
    if (this.connectForm.invalid) return;
    const { email, password } = this.connectForm.value;
    this.garminService.connect(email!, password!).subscribe(() => {
      if (this.isConnected()) {
        this.connectForm.reset();
        this.loadActivities();
      }
    });
  }

  onDisconnect() {
    this.garminService.disconnect().subscribe();
  }

  selectWeek(week: 'current' | 'last'): void {
    this.selectedWeek.set(week);
    if (week === 'last' && !this.lastWeekLoaded && !this.garminService.isLoadingLastWeek()) {
      this.lastWeekError.set(null);
      // Marquée chargée seulement en cas de succès, pour pouvoir réessayer
      this.garminService.loadLastWeek().subscribe({
        next: () => (this.lastWeekLoaded = true),
        error: () => this.lastWeekError.set('Impossible de charger la semaine dernière.')
      });
    }
  }

  openActivity(activity: GarminActivity): void {
    this.selectedActivity.set(activity);
    this.activityDetail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);
    // Annule le détail précédent : sinon celui de A pourrait s'afficher sous B
    this.detailSub?.unsubscribe();
    this.detailSub = this.garminService.getActivityDetails(activity.id).subscribe({
      next: detail => {
        this.activityDetail.set(detail);
        this.detailLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        // Le backend renvoie une 401 avec le vrai motif (session Garmin
        // expirée, compte non connecté...) plutôt qu'un message générique -
        // on l'affiche tel quel pour que l'utilisateur sache qu'il doit
        // reconnecter son compte, au lieu d'un échec silencieux sans cause.
        if (err.status === 401) {
          this.detailError.set(err.error?.error ?? 'Ta session Garmin a expiré, reconnecte ton compte.');
          this.garminService.isConnected.set(false);
        } else {
          this.detailError.set("Impossible de charger le détail de cette activité.");
        }
        this.detailLoading.set(false);
      }
    });
  }

  closeActivity(): void {
    this.detailSub?.unsubscribe();
    this.selectedActivity.set(null);
    this.activityDetail.set(null);
    this.detailError.set(null);
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private renderMap(el: HTMLDivElement, polyline: { lat: number; lon: number }[]): void {
    this.destroyMap();
    const latLngs = polyline.map(p => [p.lat, p.lon] as L.LatLngTuple);
    this.mapInstance = L.map(el, { zoomControl: false, attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.mapInstance);
    const line = L.polyline(latLngs, { color: '#4f46e5', weight: 4 }).addTo(this.mapInstance);
    this.mapInstance.fitBounds(line.getBounds(), { padding: [16, 16] });
  }

  private destroyMap(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }

  isStrength(activity: GarminActivity | null): boolean {
    return !!activity && this.matchType(activity.sportType, 'strength');
  }

  formatPace(averageSpeedMs: number | undefined | null): string {
    if (!averageSpeedMs) return '—';
    const secPerKm = 1000 / averageSpeedMs;
    const min = Math.floor(secPerKm / 60);
    const sec = Math.round(secPerKm % 60);
    return `${min}:${String(sec).padStart(2, '0')}/km`;
  }

  // ── Helpers affichage ────────────────────────────────
  // Distance parcourue à la fin du split : chaque split Garmin fait ~1 km.
  cumulativeDistance(splits: { distance: number }[], index: number): number {
    return splits.slice(0, index + 1).reduce((sum, s) => sum + (s.distance ?? 0), 0);
  }

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
