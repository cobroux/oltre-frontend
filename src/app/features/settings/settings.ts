import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { GarminService } from '../../core/services/garmin.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { getApiUrl } from '../../core/config/runtime-config';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { DatePickerComponent } from '../../shared/date-picker/date-picker';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePickerComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private garminService = inject(GarminService);
  private themeService = inject(ThemeService);
  private appointmentService = inject(AppointmentService);

  user = this.userService.currentUser;
  isGarminConnected = this.garminService.isConnected;
  garminDisconnectError = this.garminService.disconnectError;
  themeMode = this.themeService.mode;

  profileSaving = signal(false);
  profileSaved = signal(false);
  profileError = signal<string | null>(null);

  passwordSaving = signal(false);
  passwordSaved = signal(false);
  passwordError = signal<string | null>(null);

  garminDisconnecting = signal(false);

  feedToken = signal<string | null>(null);
  feedBusy = signal(false);
  feedCopied = signal(false);
  feedError = signal<string | null>(null);
  // URL absolue même si apiUrl est relative : Google/Apple la récupèrent depuis leurs serveurs.
  feedUrl = computed(() => {
    const t = this.feedToken();
    return t ? new URL(`${getApiUrl()}/api/calendar/feed/${t}.ics`, window.location.origin).href : null;
  });
  feedWebcal = computed(() => this.feedUrl()?.replace(/^https?:/, 'webcal:') ?? null);
  feedGoogle = computed(() => {
    const w = this.feedWebcal();
    return w ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(w)}` : null;
  });

  exporting = signal(false);
  exportError = signal<string | null>(null);

  deleteConfirming = signal(false);
  deleteConfirmText = signal('');
  deleting = signal(false);
  deleteError = signal<string | null>(null);

  profileForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    age: new FormControl<number | null>(null),
    birthDate: new FormControl('')
  });

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmNewPassword: new FormControl('', [Validators.required])
  });

  constructor() {
    // Remplit le formulaire profil dès que le user charge (ou recharge
    // après une sauvegarde) - pas besoin de dupliquer la logique dans
    // ngOnInit et dans le callback de updateProfile().
    effect(() => {
      const u = this.user();
      if (u) {
        this.profileForm.patchValue({
          username: u.username,
          age: u.age,
          birthDate: u.birthDate ? u.birthDate.slice(0, 10) : ''
        }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.userService.loadUser().subscribe({
      error: () => this.profileError.set('Impossible de charger ton profil. Réessaie plus tard.')
    });
    this.garminService.checkStatus().subscribe();
    this.appointmentService.getFeedToken().subscribe({
      next: r => this.feedToken.set(r.token),
      error: () => this.feedError.set('Impossible de charger le lien d’abonnement.')
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    const { username, age, birthDate } = this.profileForm.getRawValue();

    this.profileSaving.set(true);
    this.profileSaved.set(false);
    this.profileError.set(null);

    this.userService.updateProfile({
      username: username!,
      age: age ?? null,
      birthDate: birthDate || null
    }).subscribe({
      next: () => {
        this.profileSaving.set(false);
        this.profileSaved.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.profileSaving.set(false);
        this.profileError.set(err.error?.message ?? 'Impossible de sauvegarder le profil.');
      }
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword, confirmNewPassword } = this.passwordForm.getRawValue();

    if (newPassword !== confirmNewPassword) {
      this.passwordError.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.passwordSaving.set(true);
    this.passwordSaved.set(false);
    this.passwordError.set(null);

    this.userService.changePassword({
      currentPassword: currentPassword!,
      newPassword: newPassword!
    }).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordSaved.set(true);
        this.passwordForm.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.passwordSaving.set(false);
        this.passwordError.set(err.error?.message ?? 'Impossible de changer le mot de passe.');
      }
    });
  }

  setTheme(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }

  disconnectGarmin(): void {
    this.garminDisconnecting.set(true);
    this.garminService.disconnect().subscribe({
      complete: () => this.garminDisconnecting.set(false)
    });
  }

  regenerateFeed(): void {
    this.feedBusy.set(true);
    this.feedError.set(null);
    this.feedCopied.set(false);
    this.appointmentService.regenerateFeedToken().subscribe({
      next: r => { this.feedToken.set(r.token); this.feedBusy.set(false); },
      error: () => { this.feedBusy.set(false); this.feedError.set('Impossible de créer le lien.'); }
    });
  }

  disableFeed(): void {
    this.feedBusy.set(true);
    this.feedError.set(null);
    this.appointmentService.disableFeed().subscribe({
      next: () => { this.feedToken.set(null); this.feedBusy.set(false); },
      error: () => { this.feedBusy.set(false); this.feedError.set('Impossible de désactiver le lien.'); }
    });
  }

  copyFeed(): void {
    const url = this.feedUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => this.feedCopied.set(true),
      () => this.feedError.set('Copie impossible : sélectionne le lien et copie-le à la main.')
    );
  }

  exportData(): void {
    this.exporting.set(true);
    this.exportError.set(null);
    this.userService.exportData().subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'oltre-export.json';
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
        this.exportError.set('Impossible de télécharger tes données. Réessaie plus tard.');
      }
    });
  }

  startDeleteConfirm(): void {
    this.deleteConfirming.set(true);
    this.deleteConfirmText.set('');
    this.deleteError.set(null);
  }

  cancelDeleteConfirm(): void {
    this.deleteConfirming.set(false);
    this.deleteConfirmText.set('');
  }

  canConfirmDelete(): boolean {
    return this.deleteConfirmText().trim() === (this.user()?.username ?? '');
  }

  confirmDelete(): void {
    if (!this.canConfirmDelete()) return;
    this.deleting.set(true);
    this.deleteError.set(null);

    this.userService.deleteAccount().subscribe({
      next: () => this.authService.logout(),
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        this.deleteError.set(err.error?.message ?? 'Impossible de supprimer le compte.');
      }
    });
  }
}
