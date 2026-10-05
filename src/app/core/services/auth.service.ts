import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { getApiUrl } from '../config/runtime-config';

export interface AuthUser {
  token: string;
  userId: number;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${getApiUrl()}/auth`;
  private readonly TOKEN_KEY = 'oltre_token';

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

  register(username: string, email: string, password: string) {
    return this.http.post<AuthUser>(`${this.API}/register`, { username, email, password }).pipe(
      tap(user => {
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
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
