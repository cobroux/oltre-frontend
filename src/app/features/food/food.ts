import { Component, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meal } from '../../core/models/meal.dto';



interface MealGroup {
  type: string;
  meals: Meal[];
  totalCalories: number;
}

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './food.html',
  styleUrl: './food.css'
})
export class FoodComponent {

  // Objectifs journaliers
  readonly CALORIE_GOAL = 2000;
  readonly PROTEIN_GOAL = 150;
  readonly CARB_GOAL    = 250;
  readonly FAT_GOAL     = 65;

  // Ordre d'affichage des repas
  readonly MEAL_ORDER = ['PETIT_DEJ', 'DEJEUNER', 'COLLATION', 'DINER'];

  meals = signal<Meal[]>([]);


  // Groupes par type de repas dans l'ordre
  mealGroups = computed((): MealGroup[] => {
    const groups: MealGroup[] = [];
    for (const type of this.MEAL_ORDER) {
      const meals = this.meals().filter(m => m.mealType === type);
      if (meals.length > 0) {
        groups.push({
          type,
          meals,
          totalCalories: 0
        });
      }
    }
    return groups;
  });

  addForm = new FormGroup({
    mealName: new FormControl('',   [Validators.required, Validators.minLength(2)]),
    mealType: new FormControl<string | null>(null, [Validators.required]),
    mealDate: new FormControl<string | null>(null)
  });

  onSubmit() {
    if (this.addForm.invalid) return;
    const v = this.addForm.getRawValue();
    this.meals.update(list => [...list, {
      id: Date.now(),
      mealName: v.mealName!,
      mealType: v.mealType as Meal['mealType'],
      mealDate: v.mealDate
        ? new Date(v.mealDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0
    }]);
    this.addForm.reset();
  }

  deleteMeal(id: number) {
    this.meals.update(list => list.filter(m => m.id !== id));
  }

  getMealLabel(type: string): string {
    const labels: Record<string, string> = {
      PETIT_DEJ: 'Petit-déjeuner',
      DEJEUNER:  'Déjeuner',
      DINER:     'Dîner',
      COLLATION: 'Collation'
    };
    return labels[type] ?? type;
  }

  getMealIcon(type: string): string {
    const icons: Record<string, string> = {
      PETIT_DEJ: 'ti-coffee',
      DEJEUNER:  'ti-soup',
      DINER:     'ti-moon',
      COLLATION: 'ti-apple'
    };
    return icons[type] ?? 'ti-salad';
  }
}