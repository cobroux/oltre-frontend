import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DEMO_EMAIL, DEMO_PASSWORD, isDemoMode } from '../../core/config/runtime-config';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  demo = isDemoMode();
  demoPassword = DEMO_PASSWORD;
  isLoading = signal(false);
  errorMsg  = signal<string | null>(null);
  showPassword = signal(false);

  loginForm = new FormGroup({
    email:    new FormControl(isDemoMode() ? DEMO_EMAIL : '', [Validators.required, Validators.email]),
    password: new FormControl(isDemoMode() ? DEMO_PASSWORD : '', [Validators.required])
  });

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/calendar']);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMsg.set(err.error?.message ?? 'Email ou mot de passe incorrect');
      }
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }
}