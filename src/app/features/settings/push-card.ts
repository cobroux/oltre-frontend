import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { PushPreferences, PushService } from '../../core/services/push.service';

const MINUTES = [
  { v: 15, l: '15 minutes' }, { v: 30, l: '30 minutes' }, { v: 60, l: '1 heure' },
  { v: 120, l: '2 heures' }, { v: 1440, l: '1 jour' }
];

@Component({
  selector: 'app-push-card',
  standalone: true,
  templateUrl: './push-card.html',
  styleUrl: './settings.css'
})
export class PushCardComponent {
  private push = inject(PushService);
  private sw = this.push.swPush;

  readonly minutesOptions = MINUTES;
  subscription = toSignal(this.sw?.isEnabled ? this.sw.subscription : of(null), { initialValue: null });
  subscribed = computed(() => !!this.subscription());

  denied = signal(typeof Notification !== 'undefined' && Notification.permission === 'denied');
  serverOff = signal(false);
  busy = signal(false);
  message = signal<string | null>(null); // confirmation
  error = signal<string | null>(null);

  prefs = signal<PushPreferences>({
    apptEnabled: false, apptMinutesBefore: 60, tasksEnabled: false, tasksTime: '08:00', coachEnabled: false
  });
  subscriptionCount = signal(0);
  prefsSaving = signal(false);
  prefsMessage = signal<string | null>(null);
  prefsError = signal<string | null>(null);

  // Ordre = priorité du message affiché.
  status = computed<'unavailable' | 'ios' | 'denied' | 'ready'>(() => {
    if (!this.sw?.isEnabled) return 'unavailable';
    if (this.isIos() && !window.matchMedia?.('(display-mode: standalone)').matches) return 'ios';
    if (this.denied()) return 'denied';
    return 'ready';
  });

  constructor() {
    if (this.sw?.isEnabled) {
      this.push.getPreferences().subscribe({
        next: r => this.applyPrefs(r),
        error: () => this.prefsError.set('Impossible de charger tes préférences.')
      });
    }
  }

  private isIos(): boolean {
    const n = navigator;
    return /iPhone|iPad|iPod/.test(n.userAgent) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
  }

  private applyPrefs({ subscriptionCount, ...p }: PushPreferences & { subscriptionCount: number }) {
    this.prefs.set(p);
    this.subscriptionCount.set(subscriptionCount);
  }

  private refreshCount() {
    this.push.getPreferences().subscribe({ next: r => this.subscriptionCount.set(r.subscriptionCount) });
  }

  enable(): void {
    this.begin();
    this.push.subscribe().subscribe({
      next: () => { this.busy.set(false); this.refreshCount(); },
      error: (e: unknown) => {
        this.busy.set(false);
        if (e instanceof HttpErrorResponse && e.status === 503) this.serverOff.set(true);
        else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') this.denied.set(true);
        else this.error.set('Impossible d\'activer les notifications. Réessaie plus tard.');
      }
    });
  }

  disable(): void {
    this.begin();
    this.push.unsubscribe().subscribe({
      complete: () => { this.busy.set(false); this.refreshCount(); },
      error: () => { this.busy.set(false); this.error.set('Impossible de désactiver les notifications.'); }
    });
  }

  test(): void {
    this.begin();
    this.push.sendTest().subscribe({
      next: () => { this.busy.set(false); this.message.set('Notification de test envoyée.'); },
      error: () => { this.busy.set(false); this.error.set('Impossible d\'envoyer la notification de test.'); }
    });
  }

  patch(p: Partial<PushPreferences>): void {
    this.prefs.update(v => ({ ...v, ...p }));
    this.prefsMessage.set(null);
  }

  savePrefs(): void {
    this.prefsSaving.set(true);
    this.prefsMessage.set(null);
    this.prefsError.set(null);
    this.push.savePreferences(this.prefs()).subscribe({
      next: r => { this.applyPrefs(r); this.prefsSaving.set(false); this.prefsMessage.set('Préférences enregistrées.'); },
      error: () => { this.prefsSaving.set(false); this.prefsError.set('Impossible d\'enregistrer les préférences.'); }
    });
  }

  private begin() {
    this.busy.set(true);
    this.message.set(null);
    this.error.set(null);
  }
}
