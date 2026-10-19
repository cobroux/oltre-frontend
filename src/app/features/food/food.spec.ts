import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';
import { MealService } from '../../core/services/meal.service';

import { FoodComponent } from './food';

describe('Food', () => {
  let component: FoodComponent;
  let fixture: ComponentFixture<FoodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Food - course de requêtes', () => {
  it('annule le chargement de la semaine précédente quand on en relance un', async () => {
    const first = new Subject<unknown[]>();
    const second = new Subject<unknown[]>();
    const loadWeek = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second).mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [FoodComponent],
      providers: [{ provide: MealService, useValue: { mealsSignal: signal([]), loadWeek } }]
    }).compileComponents();
    const c = TestBed.createComponent(FoodComponent).componentInstance;

    c.loadWeek();
    expect(first.observed).toBe(true);
    c.loadWeek();
    expect(first.observed).toBe(false);
    expect(second.observed).toBe(true);
  });
});
