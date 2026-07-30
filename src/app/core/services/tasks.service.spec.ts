import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TasksService } from './tasks.service';
import { TasksDTO } from '../models/tasks.dto';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  const mockTasks: TasksDTO[] = [
    { id: 1, tasksName: 'Courses', tasksType: 'PERSO', tasksPriority: 'MEDIUM', tasksDate: '2026-07-29' },
    { id: 2, tasksName: 'Réunion', tasksType: 'TRAVAIL', tasksPriority: 'HIGH', tasksStatus: 'DONE', tasksDate: '2026-07-29' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TasksService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait charger les tâches et mettre à jour tasksListSignal', () => {
    service.loadAllTasks().subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/tasks/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);

    expect(service.tasksListSignal()).toEqual(mockTasks);
  });

  it('devrait ajouter une tâche', () => {
    const newTask: TasksDTO = { id: 0, tasksName: 'Sport', tasksType: 'SPORT', tasksPriority: 'LOW', tasksDate: '2026-07-29' };

    service.addTasks(newTask).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/tasks/save');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newTask);
    req.flush({ ...newTask, id: 3 });
  });

  it('devrait recharger après suppression', () => {
    service.deleteTasks(1).subscribe();

    const deleteReq = httpMock.expectOne('http://localhost:8080/api/tasks/1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);

    httpMock.expectOne('http://localhost:8080/api/tasks/all').flush([mockTasks[1]]);
  });

  it('devrait mettre à jour le statut et recharger', () => {
    service.updateTasksStatus(1, 'DONE').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/tasks/update');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ id: 1, status: 'DONE' });
    req.flush(null);

    httpMock.expectOne('http://localhost:8080/api/tasks/all').flush(mockTasks);
  });
});