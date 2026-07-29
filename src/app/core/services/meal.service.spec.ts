import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MealService } from './meal.service';
import { MealDTO } from '../models/meal.dto';

describe('MealService', () => {
  let service: MealService;
  let httpMock: HttpTestingController;

  const mockMeals: MealDTO[] = [
    { id: 1, mealName: 'Poulet', mealType: 'DEJEUNER', mealDate: '2026-07-29' },
    { id: 2, mealName: 'Yaourt', mealType: 'COLLATION', mealDate: '2026-07-29' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MealService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MealService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait charger la semaine et mettre à jour mealsSignal', () => {
    service.loadWeek('2026-07-28').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/meals/week?monday=2026-07-28');
    expect(req.request.method).toBe('GET');
    req.flush(mockMeals);

    expect(service.mealsSignal()).toEqual(mockMeals);
  });

  it('devrait sauvegarder et ajouter au signal', () => {
    const newMeal: Partial<MealDTO> = { mealName: 'Salade', mealType: 'DEJEUNER', mealDate: '2026-07-29' };
    const saved: MealDTO = { ...newMeal, id: 3 } as MealDTO;

    service.save(newMeal).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/meals/save');
    expect(req.request.method).toBe('POST');
    req.flush(saved);

    expect(service.mealsSignal()).toContain(saved);
  });

  it('devrait supprimer et retirer du signal', () => {
    service.mealsSignal.set(mockMeals);
    service.delete(1).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/meals/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.mealsSignal().find(m => m.id === 1)).toBeUndefined();
    expect(service.mealsSignal().length).toBe(1);
  });
});