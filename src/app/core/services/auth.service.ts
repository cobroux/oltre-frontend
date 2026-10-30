import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { getApiUrl } from '../config/runtime-config';
import { MealService } from './meal.service';
import { TasksService } from './tasks.service';
import { ExpensesSevice } from './expenses.service';
import { GarminService } from './garmin.service';
import { UserService } from './user.service';
import { CoachService } from './coach.service';
import { AppointmentService } from './appointment.service';

export interface AuthUser {
  token: string;
  userId: number;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${getApiUrl()}/auth`;
  private readonly TOKEN_KEY = 'oltre_token';

  // Services à vider à la déconnexion (ils vivent tant que l'onglet reste ouvert)
  private readonly resettables = [
    inject(MealService), inject(TasksService), inject(ExpensesSevice), inject(GarminService),
    inject(UserService), inject(CoachService), inject(AppointmentService)
  ];

  currentUser = signal<AuthUser | null>(this.loadFromStorage());

  constructor(private http: HttpClient, private router: Router) {
    if (this.currentUser() && this.isTokenExpired(this.currentUser()!.token)) {
      this.clearSession();
    }
  }

  login(email: string, password: string) {
    return this.http.post<AuthUser>(`${this.API}/login`, { email, password }).pipe(
      tap(user => {
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  registrationEnabled() {
    return this.http.get<{ enabled: boolean }>(`${this.API}/registration`);
  }

  register(username: string, email: string, password: string, age: number | null, birthDate: string | null) {
    return this.http.post<AuthUser>(`${this.API}/register`, { username, email, password, age, birthDate, acceptTerms: true }).pipe(
      tap(user => {
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  forgotPassword(email: string) {
    return this.http.post<void>(`${this.API}/password/forgot`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<void>(`${this.API}/password/reset`, { token, password });
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  isLoggedIn(): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (this.isTokenExpired(user.token)) {
      this.clearSession();
      return false;
    }
    return true;
  }

  private clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.resettables.forEach(s => s.reset());
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }

  private decodeTokenPayload(token: string): { exp?: number } | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  private loadFromStorage(): AuthUser | null {
    try {
      const stored = localStorage.getItem(this.TOKEN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
