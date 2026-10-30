import { Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { DatePickerComponent } from '../date-picker/date-picker';
import { PushCardComponent } from '../../features/settings/push-card';

const TOTAL = 4;

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePickerComponent, PushCardComponent],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css'
})
export class OnboardingComponent {
  private userService = inject(UserService);
  private dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');

  readonly total = TOTAL;
  step = signal(1);
  open = computed(() => this.userService.currentUser()?.onboardingDone === false && !this.closed());
  private closed = signal(false);
  profileError = signal(false);

  profile = new FormGroup({ age: new FormControl<number | null>(null), birthDate: new FormControl('') });

  readonly modules = [
    { icon: 'ti-sun', cls: 'icon-today', name: "Aujourd'hui", desc: 'Ta journée en un coup d\'œil' },
    { icon: 'ti-calendar-week', cls: 'icon-calendar', name: 'Organisation', desc: 'Calendrier, tâches et rendez-vous' },
    { icon: 'ti-run', cls: 'icon-sport', name: 'Santé', desc: 'Sport, Coach IA et alimentation' },
    { icon: 'ti-wallet', cls: 'icon-expenses', name: 'Finances', desc: 'Suivi de tes dépenses' }
  ];

  constructor() {
    afterNextRender(() => this.focusFirst());
  }

  next() {
    if (this.step() === 2) this.saveProfile();
    if (this.step() === TOTAL) return this.finish();
    this.step.update(s => s + 1);
    queueMicrotask(() => this.focusFirst());
  }

  prev() {
    this.step.update(s => s - 1);
    queueMicrotask(() => this.focusFirst());
  }

  // Un lien du parcours mène hors de l'écran : on termine pour ne pas rester par-dessus la page.
  finish() {
    this.closed.set(true);
    this.userService.currentUser.update(u => u && { ...u, onboardingDone: true });
    this.userService.completeOnboarding().subscribe({
      error: err => console.error('Onboarding : drapeau non enregistré', err)
    });
  }

  private saveProfile() {
    const { age, birthDate } = this.profile.getRawValue();
    const user = this.userService.currentUser();
    if (!user || (age == null && !birthDate)) return;
    this.userService.updateProfile({ username: user.username, age: age ?? null, birthDate: birthDate || null }).subscribe({
      error: () => this.profileError.set(true)
    });
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') return this.finish();
    if (e.key !== 'Tab') return;
    const items = this.focusables();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  private focusables() {
    return Array.from(this.dialog().nativeElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'));
  }

  private focusFirst() {
    (this.dialog()?.nativeElement.querySelector<HTMLElement>('h2') ?? null)?.focus();
  }
}
