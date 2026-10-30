import { Component, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: '../login/login.css'
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  isLoading = signal(false);
  sent = signal(false);
  errorMsg = signal<string | null>(null);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.authService.forgotPassword(this.form.getRawValue().email!).subscribe({
      next: () => { this.isLoading.set(false); this.sent.set(true); },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('Impossible d\'envoyer la demande, réessaie');
      }
    });
  }
}
