import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DatePickerComponent } from '../../shared/date-picker/date-picker';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePickerComponent],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMsg  = signal<string | null>(null);
  showPassword = signal(false);

  registerForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    email:    new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
    age: new FormControl<number | null>(null),
    birthDate: new FormControl('')
  });

  onSubmit() {
    if (this.registerForm.invalid) return;

    const { username, email, password, confirmPassword, age, birthDate } = this.registerForm.getRawValue();
    if (password !== confirmPassword) {
      this.errorMsg.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.authService.register(username!, email!, password!, age ?? null, birthDate || null).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/calendar']);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMsg.set(err.error?.message ?? 'Inscription impossible.');
      }
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }
}
