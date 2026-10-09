import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TasksDTO } from '../../core/models/tasks.dto';
import { TasksService } from '../../core/services/tasks.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive,CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class TasksComponent {

  private tasksService = inject(TasksService);

  
  allTasks = this.tasksService.tasksListSignal;
   ngOnInit(): void {
      this.tasksService.loadAllTasks().subscribe();
  }

  // Signals
  filter    = signal<'ALL' | 'PENDING' | 'DONE'>('ALL');
  catFilter = signal<'ALL' | 'PERSO' | 'TRAVAIL' | 'SPORT' | 'AUTRE'>('ALL');
  confirmDeleteId = signal<number | null>(null);
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
    
    console.log('Payload envoyé :', tasks);

    this.tasksService.addTasks(tasks).subscribe({
          next: () => {
            this.tasksService.loadAllTasks().subscribe();
            this.addForm.reset();
          },
          error: err => console.error(err)
        });
  }


  toggleTask(id: number) {

    const task = this.allTasks().find(t => t.id === id);
    let status = task?.tasksStatus === 'DONE' ? 'PENDING' : 'DONE';
    this.tasksService.updateTasksStatus(id, status).subscribe({
      error: err => console.error(err)
    });
  }

  requestDelete(id: number) {
    if (this.confirmDeleteId() === id) {
      this.tasksService.deleteTasks(id).subscribe({
        error: err => console.error(err)
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
    const diff = Math.ceil((new Date(taskDto.tasksDate).getTime() - Date.now()) / 86400000);
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