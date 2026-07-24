import { Meal } from "./meal.dto";

export interface MealGroup {
  type: string;
  meals: Meal[];
  totalCalories: number;
}
 