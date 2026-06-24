import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { UserDTO } from '../models/user.dto';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = 'http://localhost:8080/api/users/1';

  currentUser = signal<UserDTO | null>(null);

  constructor(private http: HttpClient) {}

  loadUser() {
    return this.http.get<UserDTO>(this.API).pipe(
      tap(user => this.currentUser.set(user))
    );
  }
}