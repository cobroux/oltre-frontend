import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { UserDTO, UserStatsDTO } from '../models/user.dto';
import { getApiUrl } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = `${getApiUrl()}/api/users/me`;

  currentUser = signal<UserDTO | null>(null);

  constructor(private http: HttpClient) {}

  loadUser() {
    return this.http.get<UserDTO>(this.API).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  getStats() {
    return this.http.get<UserStatsDTO>(`${this.API}/stats`);
  }
}