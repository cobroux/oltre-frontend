import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment.service';
import { MealService } from '../../core/services/meal.service';
import { TasksService } from '../../core/services/tasks.service';
import { ExpensesSevice } from '../../core/services/expenses.service';
import { AppointmentDTO } from '../../core/models/appointment.dto';
import { MealDTO } from '../../core/models/meal.dto';
import { TasksDTO } from '../../core/models/tasks.dto';
import { ExpensesDTO } from '../../core/models/expenses.dto';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface CalendarEvent {
  type: 'appt' | 'meal' | 'task' | 'expense';
  label: string;
  sub: string;
  icon: string;
  cls: string;
  badge: string;
  amount?: number;
}

interface DayData {
  date: Date;
  dateStr: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class CalendarComponent implements OnInit {

  private apptService    = inject(AppointmentService);
  private mealService    = inject(MealService);
  private tasksService   = inject(TasksService);
  private expensesService = inject(ExpensesSevice);

  readonly DAYS_FR  = DAYS_FR;
  readonly MONTHS   = MONTHS;
  readonly MONTHS_FR = MONTHS_FR;
  readonly today    = new Date();

  monthOffset  = signal(0);
  selectedDay  = signal<string | null>(null);
  isLoading    = signal(false);

  // Données brutes
  appointments = signal<AppointmentDTO[]>([]);
  meals = signal<MealDTO[]>([]);
  tasks  = signal<TasksDTO[]>([]);
  expenses = signal<ExpensesDTO[]>([]);

  // Mois courant
  currentMonth = computed(() => {
    const d = new Date(this.today.getFullYear(), this.today.getMonth() + this.monthOffset(), 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  monthTitle = computed(() => {
    const { year, month } = this.currentMonth();
    return `${MONTHS[month]} ${year}`;
  });

  // Stats du mois
  totalExpenses = computed(() =>
    this.expenses().reduce((s, e) => s + (e.amount ?? 0), 0)
  );

  nbAppts = computed(() => this.appointments().length);
  nbTasks = computed(() => this.tasks().length);
  nbMeals = computed(() => this.meals().length);

  // Grille du mois
  calendarDays = computed((): DayData[] => {
    const { year, month } = this.currentMonth();
    const todayStr = this.toDateStr(this.today);
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const days: DayData[] = [];

    // Jours du mois précédent
    const startDow = (firstDay.getDay() || 7) - 1;
    const prevMonth = new Date(year, month, 0);
    for (let i = startDow - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({ date, dateStr: this.toDateStr(date), isToday: false, isCurrentMonth: false, events: [] });
    }

    // Jours du mois courant
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = this.toDateStr(date);
      days.push({
        date, dateStr,
        isToday: dateStr === todayStr,
        isCurrentMonth: true,
        events: this.getEventsForDate(dateStr)
      });
    }

    // Jours du mois suivant
    const remaining = (7 - (lastDay.getDay() || 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push({ date, dateStr: this.toDateStr(date), isToday: false, isCurrentMonth: false, events: [] });
    }

    return days;
  });

  // Événements du jour sélectionné
  selectedDayEvents = computed((): CalendarEvent[] => {
    const day = this.selectedDay();
    if (!day) return [];
    return this.getEventsForDate(day);
  });

  selectedDayLabel = computed(() => {
    const day = this.selectedDay();
    if (!day) return '';
    const d = new Date(day + 'T00:00:00');
    return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
  });

  ngOnInit() { this.loadMonth(); }

  prevMonth() { this.monthOffset.update(v => v - 1); this.selectedDay.set(null); this.loadMonth(); }
  nextMonth() { this.monthOffset.update(v => v + 1); this.selectedDay.set(null); this.loadMonth(); }
  goToday()   { this.monthOffset.set(0); this.selectedDay.set(null); this.loadMonth(); }

  selectDay(day: DayData) {
    if (!day.isCurrentMonth) return;
    this.selectedDay.update(v => v === day.dateStr ? null : day.dateStr);
  }

  isSelected(day: DayData): boolean {
    return day.dateStr === this.selectedDay();
  }

  loadMonth() {
    const { year, month } = this.currentMonth();
    this.isLoading.set(true);

    // Calcule les lundis des 4-5 semaines du mois
    const mondays = this.getMondaysOfMonth(year, month);

    // Charge les repas et rdv par semaine, tâches et dépenses en une fois
    const mealRequests  = mondays.map(m => this.mealService.loadWeek(m).pipe(catchError(() => of([]))));
    const apptRequests  = mondays.map(m => this.apptService.loadWeek(m).pipe(catchError(() => of([]))));

    forkJoin([
      forkJoin(mealRequests),
      forkJoin(apptRequests),
      this.tasksService.loadAllTasks().pipe(catchError(() => of([]))),
      this.expensesService.loadAllExpenses().pipe(catchError(() => of([])))
    ]).subscribe({
      next: ([mealWeeks, apptWeeks, tasks, expenses]) => {
        this.meals.set((mealWeeks as MealDTO[][]).flat());
        this.appointments.set((apptWeeks as AppointmentDTO[][]).flat());
        this.tasks.set(tasks as TasksDTO[]);
        this.expenses.set(expenses as ExpensesDTO[]);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private getEventsForDate(dateStr: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const date = new Date(dateStr + 'T00:00:00');

    // Rendez-vous
    this.appointments()
      .filter(a => a.apptDate === dateStr)
      .forEach(a => events.push({
        type: 'appt',
        label: a.title,
        sub: a.apptTime ? `${a.apptTime}${a.location ? ' — ' + a.location : ''}` : (a.location ?? ''),
        icon: 'ti-calendar-event',
        cls: 'c-appt',
        badge: this.getApptTypeLabel(a.apptType)
      }));

    // Repas
    this.meals()
      .filter(m => m.mealDate === dateStr)
      .forEach(m => events.push({
        type: 'meal',
        label: m.mealName,
        sub: this.getMealTypeLabel(m.mealType),
        icon: 'ti-salad',
        cls: 'c-meal',
        badge: 'Repas'
      }));

    // Tâches
    this.tasks()
      .filter(t => t.tasksDate === dateStr && !t.tasksStatus)
      .forEach(t => events.push({
        type: 'task',
        label: t.tasksName,
        sub: `Priorité ${this.getPriorityLabel(t.tasksPriority)}`,
        icon: 'ti-checkbox',
        cls: 'c-task',
        badge: t.tasksType
      }));

    // Dépenses — sur leur startDate
    this.expenses()
      .filter(e => e.startDate === dateStr)
      .forEach(e => events.push({
        type: 'expense',
        label: e.expensesName,
        sub: `${e.amount} € — ${this.getRecLabel(e.recType ?? '')}`,
        icon: 'ti-wallet',
        cls: 'c-expense',
        badge: 'Dépense',
        amount: e.amount
      }));

      this.expenses().forEach(e => {
    if (!e.startDate) return;
    const start = new Date(e.startDate + 'T00:00:00');
    if (date < start) return; // pas encore commencé

    let matches = false;

    if (e.recType === 'Daily') {
      matches = true; // tous les jours
    } else if (e.recType === 'Monthly') {
      matches = date.getDate() === start.getDate(); // même jour du mois
    } else if (e.recType === 'Yearly') {
      matches = date.getDate() === start.getDate()
             && date.getMonth() === start.getMonth(); // même jour et mois
    } else {
      matches = dateStr === e.startDate; // one-shot
    }

    if (matches) {
      events.push({
        type: 'expense',
        label: e.expensesName,
        sub: `${e.amount} € — ${this.getRecLabel(e.recType ?? '')}`,
        icon: 'ti-wallet',
        cls: 'c-expense',
        badge: 'Dépense',
        amount: e.amount
      });
    }
  });

    return events;
  }

  private getMondaysOfMonth(year: number, month: number): string[] {
    const mondays: string[] = [];
    const seen = new Set<string>();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay() || 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - dow + 1);
      const key = this.toDateStr(monday);
      if (!seen.has(key)) { seen.add(key); mondays.push(key); }
    }
    return mondays;
  }

  getApptTypeLabel(type: string): string {
    const m: Record<string, string> = { MEDICAL:'Médical', SPORT:'Sport', PERSO:'Perso', TRAVAIL:'Travail', AUTRE:'Autre' };
    return m[type] ?? type;
  }

  getMealTypeLabel(type: string): string {
    const m: Record<string, string> = { PETIT_DEJ:'Petit-déj', DEJEUNER:'Déjeuner', DINER:'Dîner', COLLATION:'Collation' };
    return m[type] ?? type;
  }

  getPriorityLabel(p: string): string {
    const m: Record<string, string> = { HIGH:'haute', MEDIUM:'moyenne', LOW:'basse' };
    return m[p] ?? p;
  }

  getRecLabel(r: string): string {
    const m: Record<string, string> = { Monthly:'Mensuel', Yearly:'Annuel', Daily:'Quotidien' };
    return m[r] ?? r;
  }

  toDateStr(date: Date): string { return date.toISOString().split('T')[0]; }
}