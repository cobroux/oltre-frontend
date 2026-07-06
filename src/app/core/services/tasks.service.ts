import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { TasksDTO } from '../models/tasks.dto';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly API = 'http://localhost:8080/api/tasks';

  tasksListSignal = signal<TasksDTO[]>([]);
  constructor(private http: HttpClient) {}

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
      tap(() => {
        this.loadAllTasks().subscribe();
        })
      );  
  }

  updateTasksStatus(id: number, status: string) {
    return this.http.put<TasksDTO>(this.API + "/update", {
      id,
      status
    }).pipe(
        tap(() => {
          this.loadAllTasks().subscribe();
          })
        );
}
}