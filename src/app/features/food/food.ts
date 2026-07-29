import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MealService } from '../../core/services/meal.service';
import { MealDTO } from '../../core/models/meal.dto';

const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

interface MealGroup {
  type: string;
  meals: MealDTO[];
}

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './food.html',
  styleUrl: './food.css'
})
export class FoodComponent implements OnInit {

  private mealService = inject(MealService);

  readonly MEAL_ORDER = ['PETIT_DEJ', 'DEJEUNER', 'COLLATION', 'DINER'];
  readonly today = new Date();

  // Navigation semaine
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

  // Signal branché sur le service
  meals = this.mealService.mealsSignal;

  // Groupes du jour sélectionné
  mealGroups = computed((): MealGroup[] => {
    const day = this.selectedDay();
    if (!day) return [];
    const dayMeals = this.meals().filter(m => m.mealDate === day);
    return this.MEAL_ORDER
      .map(type => ({ type, meals: dayMeals.filter(m => m.mealType === type) }))
      .filter(g => g.meals.length > 0);
  });

  // Formulaire
  addForm = new FormGroup({
    mealName:     new FormControl('', [Validators.required, Validators.minLength(2)]),
    mealType:     new FormControl<string | null>(null, [Validators.required]),
    mealDescript: new FormControl('')
  });

  ngOnInit() { this.loadWeek(); }

  // ── Navigation ───────────────────────────────────────
  prevWeek() {
    this.weekOffset.update(v => v - 1);
    this.selectedDay.set(null);
    this.loadWeek();
  }

  nextWeek() {
    this.weekOffset.update(v => v + 1);
    this.selectedDay.set(null);
    this.loadWeek();
  }

  goToday() {
    this.weekOffset.set(0);
    this.selectedDay.set(null);
    this.loadWeek();
  }

  loadWeek() {
    this.mealService.loadWeek(this.toDateStr(this.monday())).subscribe({
      error: err => console.error('Erreur chargement semaine :', err)
    });
  }

  selectDay(date: Date) {
    const key = this.toDateStr(date);
    this.selectedDay.update(v => v === key ? null : key);
  }

  // ── CRUD ─────────────────────────────────────────────
  onSubmit() {
    if (this.addForm.invalid || !this.selectedDay()) return;
    const v = this.addForm.getRawValue();
    this.mealService.save({
      mealName:     v.mealName!,
      mealDescript: v.mealDescript || undefined,
      mealType:     v.mealType as MealDTO['mealType'],
      mealDate:     this.selectedDay()!
    }).subscribe({
      next: () => this.addForm.reset(),
      error: err => console.error('Erreur ajout :', err)
    });
  }

  deleteMeal(id: number) {
    this.mealService.delete(id).subscribe({
      error: err => console.error('Erreur suppression :', err)
    });
  }

  // ── Helpers ──────────────────────────────────────────
  getMealsForDay(date: Date): MealDTO[] {
    return this.meals().filter(m => m.mealDate === this.toDateStr(date));
  }

  getDotClass(type: string): string {
    const map: Record<string, string> = {
      PETIT_DEJ: 'dot-pj', DEJEUNER: 'dot-dj',
      DINER: 'dot-dn', COLLATION: 'dot-co'
    };
    return map[type] ?? '';
  }

  isToday(date: Date): boolean { return this.toDateStr(date) === this.toDateStr(this.today); }
  isSelected(date: Date): boolean { return this.toDateStr(date) === this.selectedDay(); }

  getDayName(date: Date): string { return DAYS[(date.getDay() || 7) - 1]; }

  getDayLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return DAYS[(d.getDay() || 7) - 1] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  }

  getMealLabel(type: string): string {
    const labels: Record<string, string> = {
      PETIT_DEJ: 'Petit-déjeuner', DEJEUNER: 'Déjeuner',
      DINER: 'Dîner', COLLATION: 'Collation'
    };
    return labels[type] ?? type;
  }

  getMealIcon(type: string): string {
    const icons: Record<string, string> = {
      PETIT_DEJ: 'ti-coffee', DEJEUNER: 'ti-soup',
      DINER: 'ti-moon', COLLATION: 'ti-apple'
    };
    return icons[type] ?? 'ti-salad';
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