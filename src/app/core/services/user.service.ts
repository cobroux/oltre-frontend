import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { UserDTO, UserStatsDTO, UpdateProfileRequest, ChangePasswordRequest } from '../models/user.dto';
import { getApiUrl } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = `${getApiUrl()}/api/users/me`;

  currentUser = signal<UserDTO | null>(null);

  constructor(private http: HttpClient) {}

  // Vidé à la déconnexion pour qu'un autre compte ne voie pas ces données
  reset() {
    this.currentUser.set(null);
  }

  loadUser() {
    return this.http.get<UserDTO>(this.API).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  getStats() {
    return this.http.get<UserStatsDTO>(`${this.API}/stats`);
  }

  updateProfile(request: UpdateProfileRequest) {
    return this.http.put<UserDTO>(this.API, request).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  completeOnboarding() {
    return this.http.post<void>(`${this.API}/onboarding`, null);
  }

  changePassword(request: ChangePasswordRequest) {
    return this.http.put<void>(`${this.API}/password`, request);
  }

  exportData() {
    return this.http.get(`${this.API}/export`, { responseType: 'blob' });
  }

  deleteAccount() {
    return this.http.delete<void>(this.API);
  }
}
