import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MealService } from '../../core/services/meal.service';
import { FoodSearchService } from '../../core/services/food-search.service';
import { MealDTO, OpenFoodFactsProductDTO } from '../../core/models/meal.dto';

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
  private foodSearchService = inject(FoodSearchService);

  readonly MEAL_ORDER = ['PETIT_DEJ', 'DEJEUNER', 'COLLATION', 'DINER'];
  readonly today = new Date();

  // Navigation semaine
  weekOffset  = signal(0);
  selectedDay = signal<string | null>(null);
  confirmDeleteId = signal<number | null>(null);

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
    mealDescript: new FormControl(''),
    quantityG:    new FormControl(100, [Validators.min(1)])
  });

  // Recherche OpenFoodFacts
  productResults  = signal<OpenFoodFactsProductDTO[]>([]);
  selectedProduct = signal<OpenFoodFactsProductDTO | null>(null);
  searching       = signal(false);

  // Aperçu nutrition calculé pour la quantité saisie
  nutritionPreview = computed(() => {
    const p = this.selectedProduct();
    const qty = Number(this.addForm.controls.quantityG.value) || 0;
    if (!p || qty <= 0) return null;
    const ratio = qty / 100;
    return {
      calories: Math.round(p.caloriesPer100g * ratio),
      proteinG: p.proteinPer100g != null ? Math.round(p.proteinPer100g * ratio * 10) / 10 : undefined,
      carbsG:   p.carbsPer100g   != null ? Math.round(p.carbsPer100g   * ratio * 10) / 10 : undefined,
      fatG:     p.fatPer100g     != null ? Math.round(p.fatPer100g     * ratio * 10) / 10 : undefined
    };
  });

  // Totaux macros du jour sélectionné (uniquement les repas rattachés à un produit)
  dayTotals = computed(() => {
    const meals = this.mealGroups().flatMap(g => g.meals);
    return meals.reduce((acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      proteinG: acc.proteinG + (m.proteinG ?? 0),
      carbsG:   acc.carbsG   + (m.carbsG   ?? 0),
      fatG:     acc.fatG     + (m.fatG     ?? 0)
    }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  ngOnInit() {
    this.loadWeek();

    this.addForm.controls.mealName.valueChanges.pipe(
      debounceTime(120),
      distinctUntilChanged(),
      switchMap(query => {
        // Le texte tapé correspond déjà au produit sélectionné : pas de
        // nouvelle recherche, sinon le choix se referme dès qu'on tape.
        if (this.selectedProduct()?.productName === query) return [];
        this.selectedProduct.set(null);
        if (!query || query.trim().length < 2) return [[]];
        this.searching.set(true);
        return this.foodSearchService.search(query).pipe(
          // Une recherche en échec (réseau, API down) ne doit pas tuer
          // l'abonnement - sinon plus aucune frappe ne redéclenche de
          // recherche tant que la page n'est pas rechargée.
          catchError(err => {
            console.error('Erreur recherche produit :', err);
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      this.searching.set(false);
      this.productResults.set(results);
    });
  }

  groupCalories(group: MealGroup): number {
    return group.meals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
  }

  pickProduct(product: OpenFoodFactsProductDTO) {
    this.selectedProduct.set(product);
    this.addForm.controls.mealName.setValue(product.productName, { emitEvent: false });
    this.productResults.set([]);
  }

  clearProduct() {
    this.selectedProduct.set(null);
  }

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
    const nutrition = this.nutritionPreview();
    const product = this.selectedProduct();

    this.mealService.save({
      mealName:     v.mealName!,
      mealDescript: v.mealDescript || undefined,
      mealType:     v.mealType as MealDTO['mealType'],
      mealDate:     this.selectedDay()!,
      ...(product && nutrition ? {
        calories:   nutrition.calories,
        proteinG:   nutrition.proteinG,
        carbsG:     nutrition.carbsG,
        fatG:       nutrition.fatG,
        quantityG:  Number(v.quantityG) || undefined,
        offBarcode: product.barcode
      } : {})
    }).subscribe({
      next: () => {
        this.addForm.reset({ quantityG: 100 });
        this.selectedProduct.set(null);
        this.productResults.set([]);
      },
      error: err => console.error('Erreur ajout :', err)
    });
  }

  requestDelete(id: number) {
    if (this.confirmDeleteId() === id) {
      this.mealService.delete(id).subscribe({
        error: err => console.error('Erreur suppression :', err)
      });
      this.confirmDeleteId.set(null);
    } else {
      this.confirmDeleteId.set(id);
    }
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
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