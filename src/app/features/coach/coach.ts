import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoachService } from '../../core/services/coach.service';
import { SportGoalDTO, SportGoalType } from '../../core/models/coach.dto';

interface StrengthExercise {
  name: string;
  purpose: string;
}

@Component({
  selector: 'app-coach',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './coach.html',
  styleUrl: './coach.css'
})
export class CoachComponent implements OnInit {

  private coachService = inject(CoachService);

  goals = this.coachService.goalsSignal;
  plan = this.coachService.planSignal;

  loadingPlan = signal(true);
  generating = signal(false);
  generateError = signal<string | null>(null);
  showGoalForm = signal(false);

  goalForm = new FormGroup({
    goalType: new FormControl<SportGoalType | null>(null, [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    eventDate: new FormControl<string | null>(null, [Validators.required]),
    targetTime: new FormControl('')
  });

  // Circuit de renforcement : suggestion statique (jamais générée par
  // l'IA), pensée course à pied/triathlon plutôt que le classique
  // pec-triceps-dos-biceps-épaules de salle de muscu.
  readonly strengthCircuit: StrengthExercise[] = [
    { name: 'Gainage planche', purpose: 'Gainage profond' },
    { name: 'Fentes avant alternées', purpose: 'Quadriceps, équilibre' },
    { name: 'Pont fessier unilatéral', purpose: 'Fessiers, propulsion' },
    { name: 'Squats bulgares', purpose: 'Unilatéral, stabilité' },
    { name: 'Gainage latéral', purpose: 'Hanches, anti-bascule' },
    { name: 'Mollets unipodal', purpose: 'Prévention tendinite' },
    { name: 'Superman', purpose: 'Chaîne postérieure' },
    { name: 'Montées de genoux lentes', purpose: 'Gainage dynamique' },
  ];

  ngOnInit(): void {
    this.coachService.loadGoals().subscribe();
    this.coachService.loadPlan().subscribe({
      next: () => this.loadingPlan.set(false),
      error: () => this.loadingPlan.set(false)
    });
  }

  // Le plan est considéré périmé après 7 jours plutôt que régénéré
  // automatiquement : chaque génération coûte un appel API, donc jamais
  // de rafraîchissement silencieux, juste une bannière suggérant d'y
  // retourner.
  isStale = computed(() => {
    const p = this.plan();
    if (!p) return false;
    const ageMs = Date.now() - new Date(p.generatedAt).getTime();
    return ageMs > 7 * 24 * 60 * 60 * 1000;
  });

  onGenerate(): void {
    this.generating.set(true);
    this.generateError.set(null);
    this.coachService.generatePlan().subscribe({
      next: () => this.generating.set(false),
      error: err => {
        this.generating.set(false);
        this.generateError.set(err?.error?.error ?? "Erreur lors de la génération du plan.");
      }
    });
  }

  onToggleDay(index: number): void {
    this.coachService.toggleDay(index).subscribe();
  }

  toggleGoalForm(): void {
    this.showGoalForm.update(v => !v);
  }

  onAddGoal(): void {
    if (this.goalForm.invalid) return;
    const v = this.goalForm.getRawValue();
    const goal: SportGoalDTO = {
      goalType: v.goalType!,
      name: v.name!,
      eventDate: v.eventDate!,
      targetTime: v.targetTime || null
    };
    this.coachService.addGoal(goal).subscribe(() => {
      this.goalForm.reset();
      this.showGoalForm.set(false);
    });
  }

  onDeleteGoal(id: number | undefined): void {
    if (id == null) return;
    this.coachService.deleteGoal(id).subscribe();
  }

  // Jours restants calculés à partir des composants locaux de la date
  // (jamais via toISOString, qui décale d'un jour pour les fuseaux
  // devant UTC comme la France).
  daysUntil(eventDate: string): number {
    const [y, m, d] = eventDate.split('-').map(Number);
    const event = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    event.setHours(0, 0, 0, 0);
    return Math.round((event.getTime() - today.getTime()) / 86400000);
  }

  getGoalTypeLabel(type: SportGoalType): string {
    const labels: Record<SportGoalType, string> = {
      Marathon: 'Marathon',
      SemiMarathon: 'Semi-marathon',
      TenK: '10 km',
      Triathlon: 'Triathlon',
      Other: 'Autre'
    };
    return labels[type] ?? type;
  }

  getDayIcon(type: string): string {
    const icons: Record<string, string> = {
      Rest: 'ti-moon',
      Run: 'ti-run',
      Ride: 'ti-bike',
      Swim: 'ti-swimming',
      Other: 'ti-activity'
    };
    return icons[type] ?? 'ti-activity';
  }

  getDayClass(type: string): string {
    const classes: Record<string, string> = {
      Rest: 'day-rest',
      Run: 'day-run',
      Ride: 'day-ride',
      Swim: 'day-swim',
      Other: 'day-other'
    };
    return classes[type] ?? 'day-other';
  }
}
