import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AppointmentService } from '../../core/services/appointment.service';
import { CoachService } from '../../core/services/coach.service';
import { ExpensesSevice } from '../../core/services/expenses.service';
import { MealService } from '../../core/services/meal.service';
import { TasksService } from '../../core/services/tasks.service';
import { AppointmentDTO } from '../../core/models/appointment.dto';
import { MealDTO } from '../../core/models/meal.dto';
import { ExpensesMonthlyTrendDTO } from '../../core/models/expenses.dto';

type CardState = { loading: boolean; error: boolean };
const LOADING: CardState = { loading: true, error: false };

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './today.html',
  styleUrl: './today.css',
})
export class TodayComponent implements OnInit {
  private apptService = inject(AppointmentService);
  private tasksService = inject(TasksService);
  private mealService = inject(MealService);
  private expensesService = inject(ExpensesSevice);
  private coachService = inject(CoachService);

  today = new Date();
  todayStr = this.toDateStr(this.today);

  // Un état par carte : une API en erreur ne bloque pas les autres.
  apptState = signal<CardState>(LOADING);
  tasksState = signal<CardState>(LOADING);
  planState = signal<CardState>(LOADING);
  mealsState = signal<CardState>(LOADING);
  expensesState = signal<CardState>(LOADING);
  actionError = signal(false);

  appts = signal<AppointmentDTO[]>([]);
  meals = signal<MealDTO[]>([]);
  trend = signal<ExpensesMonthlyTrendDTO | null>(null);

  // Tâches du jour (faites ou non) + tâches en retard non terminées.
  tasks = computed(() =>
    this.tasksService.tasksListSignal()
      .filter(t => t.tasksDate === this.todayStr || (t.tasksDate < this.todayStr && t.tasksStatus !== 'DONE'))
      .sort((a, b) => a.tasksDate.localeCompare(b.tasksDate)));

  // shortcut: le plan couvre Lundi-Dimanche sans date, on suppose qu'il est celui de la semaine courante.
  planIndex = (this.today.getDay() + 6) % 7;
  planDay = computed(() => this.coachService.planSignal()?.days[this.planIndex] ?? null);

  // Mois courant et précédent depuis /monthlyTrend (année en cours : janvier n'a pas de précédent).
  monthAmount = computed(() => this.trend()?.amounts[this.trend()!.currentMonth - 1] ?? 0);
  prevMonthAmount = computed(() => {
    const t = this.trend();
    return t && t.currentMonth > 1 ? t.amounts[t.currentMonth - 2] : null;
  });

  ngOnInit(): void {
    const monday = new Date(this.today);
    monday.setDate(this.today.getDate() - ((this.today.getDay() + 6) % 7));
    const mondayStr = this.toDateStr(monday);

    this.load(this.apptService.loadWeek(mondayStr), this.apptState,
      a => this.appts.set(a.filter(x => x.apptDate === this.todayStr)
        .sort((x, y) => (x.apptTime ?? '').localeCompare(y.apptTime ?? ''))));
    this.load(this.mealService.loadWeek(mondayStr), this.mealsState,
      m => this.meals.set(m.filter(x => x.mealDate === this.todayStr)));
    this.load(this.tasksService.loadAllTasks(), this.tasksState);
    this.load(this.coachService.loadPlan(), this.planState);
    this.load(this.expensesService.getMonthlyTrend(), this.expensesState, t => this.trend.set(t));
  }

  toggleTask(id: number, status?: string): void {
    this.actionError.set(false);
    this.tasksService.updateTasksStatus(id, status === 'DONE' ? 'PENDING' : 'DONE')
      .subscribe({ error: () => this.actionError.set(true) });
  }

  togglePlanDay(): void {
    this.actionError.set(false);
    this.coachService.toggleDay(this.planIndex).subscribe({ error: () => this.actionError.set(true) });
  }

  private load<T>(obs: Observable<T>, state: ReturnType<typeof signal<CardState>>, onData?: (d: T) => void): void {
    obs.subscribe({
      next: d => { onData?.(d); state.set({ loading: false, error: false }); },
      error: () => state.set({ loading: false, error: true }),
    });
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
