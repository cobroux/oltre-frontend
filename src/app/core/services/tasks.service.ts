import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TasksDTO } from '../models/tasks.dto';
import { getApiUrl } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly API = `${getApiUrl()}/api/tasks`;

  tasksListSignal = signal<TasksDTO[]>([]);
  constructor(private http: HttpClient) {}

  // Vidé à la déconnexion pour qu'un autre compte ne voie pas ces données
  reset() {
    this.tasksListSignal.set([]);
  }

  loadAllTasks() {
    return this.http.get<TasksDTO[]>(this.API+"/all").pipe(
      tap(tasks => this.tasksListSignal.set(tasks))
    );
  }

  addTasks(tasks: TasksDTO) {
    return this.http.post<TasksDTO>(this.API+"/save", tasks);
  }


  deleteTasks(id: number) {
    return this.http.delete<void>(this.API + "/" + id).pipe(
      tap(() => this.refresh())
    );
  }

  updateTasksStatus(id: number, status: string) {
    return this.http.put<TasksDTO>(this.API + "/update", {
      id,
      status
    }).pipe(
      tap(() => this.refresh())
    );
  }

  // Rechargement après une écriture réussie : si la relecture échoue, on
  // garde la liste déjà affichée plutôt que de lever une erreur non gérée.
  refresh() {
    this.loadAllTasks().pipe(catchError(() => EMPTY)).subscribe();
  }
}
