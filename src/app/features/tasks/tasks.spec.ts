import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { TasksComponent } from './tasks';
import { TasksService } from '../../core/services/tasks.service';
import { TasksDTO } from '../../core/models/tasks.dto';

const mockTasks: TasksDTO[] = [
  { id: 1, tasksName: 'Courses', tasksType: 'PERSO', tasksPriority: 'MEDIUM', tasksDate: '2026-07-29' },
  { id: 2, tasksName: 'Réunion', tasksType: 'TRAVAIL', tasksPriority: 'HIGH', tasksStatus: 'DONE', tasksDate: '2026-07-29' },
  { id: 3, tasksName: 'Sport', tasksType: 'SPORT', tasksPriority: 'LOW', tasksDate: '2026-07-29' }
];

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;

const mockService = {
  tasksListSignal: signal(mockTasks),
  loadAllTasks: vi.fn(() => of(mockTasks)),
  addTasks: vi.fn((_tasks: TasksDTO) => of({})),
  deleteTasks: vi.fn((_id: number) => of(undefined)),
  updateTasksStatus: vi.fn((_id: number, _status: string) => of({})) // ← typage explicite
};

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        { provide: TasksService, useValue: mockService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait calculer pendingCount — tâches sans statut', () => {
    expect(component.pendingCount()).toBe(2);
  });

  it('devrait calculer doneCount — tâches avec statut', () => {
    expect(component.doneCount()).toBe(1);
  });

  it('devrait filtrer PENDING', () => {
    component.filter.set('PENDING');
    expect(component.filteredTasks().length).toBe(2);
    expect(component.filteredTasks().every(t => !t.tasksStatus)).toBe(true);
  });

  it('devrait filtrer DONE', () => {
    component.filter.set('DONE');
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].tasksName).toBe('Réunion');
  });

  it('devrait filtrer par catégorie SPORT', () => {
    component.catFilter.set('SPORT');
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].tasksName).toBe('Sport');
  });

  it('devrait combiner filtres statut et catégorie', () => {
    component.filter.set('PENDING');
    component.catFilter.set('PERSO');
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].tasksName).toBe('Courses');
  });

  it('ne devrait pas soumettre si formulaire invalide', () => {
    component.addForm.reset();
    component.onSubmit();
    expect(mockService.addTasks).not.toHaveBeenCalled();
  });

  it('devrait appeler addTasks à la soumission', () => {
    component.addForm.setValue({
      tasksName: 'Nouvelle tâche',
      tasksPriority: 'HIGH',
      tasksType: 'PERSO',
      tasksDate: '2026-08-01'
    });
    component.onSubmit();
    expect(mockService.addTasks).toHaveBeenCalled();
  });

  it('devrait appeler deleteTasks avec le bon id', () => {
    component.deleteTasks(1);
    expect(mockService.deleteTasks).toHaveBeenCalledWith(1);
  });

  it('devrait appeler updateTasksStatus avec DONE si tâche PENDING', () => {
    component.toggleTask(1);
    expect(mockService.updateTasksStatus).toHaveBeenCalledWith(1, 'DONE');
  });

  it('devrait appeler updateTasksStatus avec PENDING si tâche DONE', () => {
    component.toggleTask(2);
    expect(mockService.updateTasksStatus).toHaveBeenCalledWith(2, 'PENDING');
  });

  it('devrait détecter une tâche urgente', () => {
    const today = new Date().toISOString().split('T')[0];
    const task: TasksDTO = { id: 99, tasksName: 'Urgent', tasksType: 'PERSO', tasksPriority: 'HIGH', tasksDate: today };
    expect(component.isUrgent(task)).toBe(true);
  });

  it('ne devrait pas détecter urgent si tâche terminée', () => {
    const today = new Date().toISOString().split('T')[0];
    const task: TasksDTO = { id: 99, tasksName: 'Fait', tasksType: 'PERSO', tasksPriority: 'HIGH', tasksStatus: 'DONE', tasksDate: today };
    expect(component.isUrgent(task)).toBe(false);
  });

  it('devrait retourner les bons labels de catégorie', () => {
    expect(component.getCatLabel('PERSO')).toBe('Perso');
    expect(component.getCatLabel('TRAVAIL')).toBe('Travail');
    expect(component.getCatLabel('SPORT')).toBe('Sport');
    expect(component.getCatLabel('AUTRE')).toBe('Autre');
  });

  it('devrait retourner les bons labels de priorité', () => {
    expect(component.getPriorityLabel('HIGH')).toBe('Haute');
    expect(component.getPriorityLabel('MEDIUM')).toBe('Moyenne');
    expect(component.getPriorityLabel('LOW')).toBe('Basse');
  });
});