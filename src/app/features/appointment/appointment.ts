import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentDTO } from '../../core/models/appointment.dto';
import { AppointmentService } from '../../core/services/appointment.service';

const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css'
})
export class AppointmentComponent implements OnInit {

  private apptService = inject(AppointmentService);
  readonly today = new Date();

  weekOffset  = signal(0);
  selectedDay = signal<string | null>(null);

  monday = computed(() => this.getMonday(this.weekOffset()));

  weekDays = computed(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.monday());
      d.setDate(d.getDate() + i);
      return d;
    })
  );

  weekTitle = computed(() => {
    const mon = this.monday();
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return `Semaine du ${mon.getDate()} ${MONTHS[mon.getMonth()]} — ${sun.getDate()} ${MONTHS[sun.getMonth()]}`;
  });

  appointments = this.apptService.appointmentsSignal;

  selectedDayAppts = computed(() => {
    const day = this.selectedDay();
    if (!day) return [];
    return this.appointments()
      .filter(a => a.apptDate === day)
      .sort((a, b) => (a.apptTime ?? '').localeCompare(b.apptTime ?? ''));
  });

  addForm = new FormGroup({
    title:       new FormControl('', [Validators.required, Validators.minLength(2)]),
    apptTime:    new FormControl<string | null>(null),
    location:    new FormControl(''),
    description: new FormControl(''),
    apptType:    new FormControl<string | null>(null, [Validators.required]),
  });

  ngOnInit() { this.loadWeek(); }

  prevWeek() { this.weekOffset.update(v => v - 1); this.selectedDay.set(null); this.loadWeek(); }
  nextWeek() { this.weekOffset.update(v => v + 1); this.selectedDay.set(null); this.loadWeek(); }
  goToday()  { this.weekOffset.set(0); this.selectedDay.set(null); this.loadWeek(); }

  loadWeek() {
    this.apptService.loadWeek(this.toDateStr(this.monday())).subscribe({
      error: err => console.error('Erreur chargement rdv :', err)
    });
  }

  selectDay(date: Date) {
    const key = this.toDateStr(date);
    this.selectedDay.update(v => v === key ? null : key);
  }

  onSubmit() {
    if (this.addForm.invalid || !this.selectedDay()) return;
    const v = this.addForm.getRawValue();
    this.apptService.save({
      title:       v.title!,
      apptTime:    v.apptTime || undefined,
      location:    v.location || undefined,
      description: v.description || undefined,
      apptType:    v.apptType as AppointmentDTO['apptType'],
      apptDate:    this.selectedDay()!
    }).subscribe({
      next: () => this.addForm.reset(),
      error: err => console.error('Erreur ajout :', err)
    });
  }

  deleteAppt(id: number) {
    this.apptService.delete(id).subscribe({
      error: err => console.error('Erreur suppression :', err)
    });
  }

  getApptForDay(date: Date): AppointmentDTO[] {
    return this.appointments().filter(a => a.apptDate === this.toDateStr(date));
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = { MEDICAL:'Médical', SPORT:'Sport', PERSO:'Perso', TRAVAIL:'Travail', AUTRE:'Autre' };
    return labels[type] ?? type;
  }

  getTypeClass(type: string): string {
    const classes: Record<string, string> = { MEDICAL:'type-medical', SPORT:'type-sport', PERSO:'type-perso', TRAVAIL:'type-travail', AUTRE:'type-autre' };
    return classes[type] ?? 'type-autre';
  }

  getDotClass(type: string): string {
    const dots: Record<string, string> = { MEDICAL:'dot-medical', SPORT:'dot-sport', PERSO:'dot-perso', TRAVAIL:'dot-travail', AUTRE:'dot-autre' };
    return dots[type] ?? 'dot-autre';
  }

  isToday(date: Date): boolean { return this.toDateStr(date) === this.toDateStr(this.today); }
  isSelected(date: Date): boolean { return this.toDateStr(date) === this.selectedDay(); }
  getDayName(date: Date): string { return DAYS[(date.getDay() || 7) - 1]; }

  getDayLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return DAYS[(d.getDay() || 7) - 1] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  }

  toDateStr(date: Date): string { return date.toISOString().split('T')[0]; }

  private getMonday(offset: number): Date {
    const n = new Date(), day = n.getDay() || 7;
    const m = new Date(n);
    m.setDate(n.getDate() - day + 1 + offset * 7);
    m.setHours(0, 0, 0, 0);
    return m;
  }
}