import { Component, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: '../login/login.css'
})
export class ResetPasswordComponent {
  private authService = inject(AuthService);
  private token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');

  hasToken = !!this.token;
  isLoading = signal(false);
  done = signal(false);
  errorMsg = signal<string | null>(null);
  showPassword = signal(false);

  form = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required])
  });

  onSubmit() {
    if (this.form.invalid || !this.token) return;
    const { password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.errorMsg.set('Les mots de passe ne correspondent pas');
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.authService.resetPassword(this.token, password!).subscribe({
      next: () => { this.isLoading.set(false); this.done.set(true); },
      error: err => {
        this.isLoading.set(false);
        this.errorMsg.set(err.error?.message ?? 'Impossible de modifier le mot de passe, réessaie');
      }
    });
  }
}
