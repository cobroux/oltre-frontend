import { FoodDTO } from "./food.dto";

export interface Meal {
  id: number;
  mealName: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  mealType: 'PETIT_DEJ' | 'DEJEUNER' | 'DINER' | 'COLLATION';
  mealDate: string;
}