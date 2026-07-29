import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { BannerComponent } from './banner';
import { UserService } from '../../core/services/user.service';
import { of } from 'rxjs';

describe('BannerComponent', () => {
  let component: BannerComponent;
  let fixture: ComponentFixture<BannerComponent>;

  const mockUserService = {
    currentUser: signal({ username: 'Admin', age: 30, birthDate: '1996-05-12' }),
    loadUser: vi.fn(() => of(null))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerComponent],
      providers: [
        { provide: UserService, useValue: mockUserService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait afficher le bon utilisateur', () => {
    expect(component.user()?.username).toBe('Admin');
    expect(component.user()?.age).toBe(30);
  });

  it('devrait appeler loadUser au démarrage', () => {
    expect(mockUserService.loadUser).toHaveBeenCalled();
  });
});