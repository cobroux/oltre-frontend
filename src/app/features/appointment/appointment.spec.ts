import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Appointement } from './appointement';

describe('Appointement', () => {
  let component: Appointement;
  let fixture: ComponentFixture<Appointement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Appointement],
    }).compileComponents();

    fixture = TestBed.createComponent(Appointement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
