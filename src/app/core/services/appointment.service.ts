import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { AppointmentDTO } from '../models/appointment.dto';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly API = 'http://localhost:8080/api/appointments';
  appointmentsSignal = signal<AppointmentDTO[]>([]);
  constructor(private http: HttpClient) {}

  loadWeek(monday: string) {
    return this.http.get<AppointmentDTO[]>(`${this.API}/week?monday=${monday}`).pipe(
      tap(appts => this.appointmentsSignal.set(appts))
    );
  }

  save(appt: Partial<AppointmentDTO>) {
    return this.http.post<AppointmentDTO>(`${this.API}/save`, appt).pipe(
      tap(saved => this.appointmentsSignal.update(list => [...list, saved]))
    );
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.API}/${id}`).pipe(
      tap(() => this.appointmentsSignal.update(list => list.filter(a => a.id !== id)))
    );
  }
}