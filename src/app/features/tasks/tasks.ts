import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TasksDTO } from '../../core/models/tasks.dto';
import { TasksService } from '../../core/services/tasks.service';
import { DatePickerComponent } from '../../shared/date-picker/date-picker';
import { EMPTY, catchError } from 'rxjs';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, DatePickerComponent],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class TasksComponent {

  private tasksService = inject(TasksService);

  
  allTasks = this.tasksService.tasksListSignal;
   ngOnInit(): void {
      // En cas d'échec de lecture, la liste reste simplement vide.
      this.tasksService.loadAllTasks().pipe(catchError(() => EMPTY)).subscribe();
  }

  // Signals
  filter    = signal<'ALL' | 'PENDING' | 'DONE'>('ALL');
  catFilter = signal<'ALL' | 'PERSO' | 'TRAVAIL' | 'SPORT' | 'AUTRE'>('ALL');
  confirmDeleteId = signal<number | null>(null);
  errorMessage = signal<string | null>(null);
/* */
  // Computed
  // tasksStatus est une chaîne ('DONE'/'PENDING'), pas un booléen - 'PENDING'
  // est "truthy" en JS, donc un simple !t.tasksStatus / t.tasksStatus
  // traitait toute tâche décochée (statut explicitement remis à 'PENDING')
  // comme si elle était encore "terminée". Toujours comparer à 'DONE'.
  pendingCount = computed(() => this.allTasks().filter(t => t.tasksStatus !== 'DONE').length);
  doneCount    = computed(() => this.allTasks().filter(t => t.tasksStatus === 'DONE').length);

  filteredTasks = computed(() => {
    let list = this.allTasks();
    const f  = this.filter();
    const cf = this.catFilter();
    if (f  === 'PENDING') list = list.filter(t => t.tasksStatus !== 'DONE');
    if (f  === 'DONE')    list = list.filter(t => t.tasksStatus === 'DONE');
    if (cf !== 'ALL')     list = list.filter(t => t.tasksType === cf);
    return list;
  });

  // Formulaire
  addForm = new FormGroup({
    tasksName:    new FormControl('', [Validators.required, Validators.minLength(2)]),
    tasksPriority: new FormControl<string | null>(null, [Validators.required]),
    tasksType: new FormControl<string | null>(null, [Validators.required]),
    tasksDate:  new FormControl<string | null>(null)
  });

  onSubmit() {
    if (this.addForm.invalid) return;
    const formValue = this.addForm.getRawValue();

    const tasks: TasksDTO = {
          id: 0,
          tasksName: formValue.tasksName!,
          tasksPriority: formValue.tasksPriority as 'LOW' | 'MEDIUM' | 'HIGH',
          tasksType: formValue.tasksType as 'PERSO' | 'TRAVAIL' | 'SPORT' | 'AUTRE',
          tasksDate: formValue.tasksDate
            ? new Date(formValue.tasksDate).toISOString().split('T')[0]
            : '', 
        };

    this.errorMessage.set(null);
    this.tasksService.addTasks(tasks).subscribe({
          next: () => {
            this.tasksService.refresh();
            this.addForm.reset();
          },
          error: () => this.errorMessage.set("Impossible d'ajouter la tâche. Réessaie plus tard.")
        });
  }


  toggleTask(id: number) {

    const task = this.allTasks().find(t => t.id === id);
    let status = task?.tasksStatus === 'DONE' ? 'PENDING' : 'DONE';
    this.errorMessage.set(null);
    this.tasksService.updateTasksStatus(id, status).subscribe({
      error: () => this.errorMessage.set("Impossible de modifier la tâche. Réessaie plus tard.")
    });
  }

  requestDelete(id: number) {
    if (this.confirmDeleteId() === id) {
      this.errorMessage.set(null);
      this.tasksService.deleteTasks(id).subscribe({
        error: () => this.errorMessage.set("Impossible de supprimer la tâche. Réessaie plus tard.")
      });
      this.confirmDeleteId.set(null);
    } else {
      this.confirmDeleteId.set(id);
    }
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
  }

  isUrgent(taskDto: TasksDTO): boolean {
    if (!taskDto.tasksDate || taskDto.tasksStatus === 'DONE') return false;
    // Minuit local : 'YYYY-MM-DD' seul serait lu en UTC
    const diff = Math.ceil((new Date(`${taskDto.tasksDate.slice(0, 10)}T00:00:00`).getTime() - Date.now()) / 86400000);
    return diff <= 1;
  }

  getCatLabel(cat: string): string {
    const labels: Record<string, string> = {
      PERSO: 'Perso', TRAVAIL: 'Travail', SPORT: 'Sport', AUTRE: 'Autre'
    };
    return labels[cat] ?? cat;
  }

  getPriorityLabel(p: string): string {
    const labels: Record<string, string> = {
      HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse'
    };
    return labels[p] ?? p;
  }
}