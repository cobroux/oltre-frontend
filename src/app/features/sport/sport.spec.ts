import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportComponent } from './sport';

describe('Sport', () => {
  let component: SportComponent;
  let fixture: ComponentFixture<SportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
