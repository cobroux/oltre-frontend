import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GarminService } from '../../core/services/garmin.service';
import { GarminActivity } from '../../core/models/garmin.dto';

@Component({
  selector: 'app-sport',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
