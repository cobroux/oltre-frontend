import { ComponentFixture, TestBed } from '@angular/core/testing';

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
