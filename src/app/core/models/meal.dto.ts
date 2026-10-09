export interface MealDTO {
  id: number;
  mealName: string;
  mealDescript?: string;
  mealType: 'PETIT_DEJ' | 'DEJEUNER' | 'DINER' | 'COLLATION';
  mealDate: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  quantityG?: number;
  offBarcode?: string;
}

export interface OpenFoodFactsProductDTO {
  barcode: string;
  productName: string;
  brand?: string;
  imageUrl?: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
}
