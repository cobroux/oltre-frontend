import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ExpensesSevice } from '../../core/services/expenses.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpensesDTO, ExpensesMonthlyTrendDTO, ExpensesYearRecapDTO } from '../../core/models/expenses.dto';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DatePickerComponent } from '../../shared/date-picker/date-picker';
import { EMPTY, catchError } from 'rxjs';

@Component({
  selector: 'app-expenses',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, DatePickerComponent],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css',
})
export class ExpensesComponent implements OnInit {
 
  private expensesService = inject(ExpensesSevice);

  addForm = new FormGroup({
  expensesName: new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(50)
  ]),

  amount: new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(0.01),
    Validators.max(100000)
  ]),

  startDate: new FormControl<string | null>(null, [
    Validators.required
  ]), 

  recType: new FormControl<string | null>(null, [Validators.required]),

});

  get expensesName(){
    return this.addForm.get("expensesName");
  }

   get amount(){
    return this.addForm.get("amount");
  }

  get startDate(){
    return this.addForm.get("startDate");
  }

  get recType(){
    return this.addForm.get("recType");
  }

  onSubmit() {
    if (this.addForm.invalid) return;

    const formValue = this.addForm.getRawValue();

    const expense: ExpensesDTO = {
      id: 0,
      expensesName: formValue.expensesName!,
      amount: formValue.amount!,
      startDate: formValue.startDate
        ? new Date(formValue.startDate).toISOString().split('T')[0]
        : '', 
      recType: (formValue.recType || 'Monthly') as 'Daily' | 'Monthly' | 'Yearly'
    };

    this.errorMessage.set(null);
    // La liste et le total du mois sont rechargés par le service.
    this.expensesService.addExpense(expense).subscribe({
      next: () => {
        this.refreshAnalysis();
        this.addForm.reset();
      },
      error: () => this.errorMessage.set("Impossible d'ajouter la dépense. Réessaie plus tard.")
    });

  }

  confirmDeleteId = signal<number | null>(null);
  errorMessage = signal<string | null>(null);

  requestDelete(id: number) {
    if (this.confirmDeleteId() === id) {
      this.errorMessage.set(null);
      this.expensesService.deleteExpenses(id).subscribe({
        next: () => this.refreshAnalysis(),
        error: () => this.errorMessage.set("Impossible de supprimer la dépense. Réessaie plus tard.")
      });
      this.confirmDeleteId.set(null);
    } else {
      this.confirmDeleteId.set(id);
    }
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
  }

  allExpenses = this.expensesService.expensesListSignal;
  amountPerMonth = this.expensesService.intSignal;
  yearRecap = signal<ExpensesYearRecapDTO | null>(null);
  monthlyTrend = signal<ExpensesMonthlyTrendDTO | null>(null);

   ngOnInit(): void {
      // En cas d'échec de lecture, la page reste sur ses valeurs vides.
      this.expensesService.loadAllExpenses().pipe(catchError(() => EMPTY)).subscribe();
      this.expensesService.getAmountPerMonth().pipe(catchError(() => EMPTY)).subscribe();
      this.expensesService.getYearRecap().subscribe({
        next: r => this.yearRecap.set(r),
        error: () => this.yearRecap.set(null)
      });
      this.expensesService.getMonthlyTrend().subscribe({
        next: t => {
          this.monthlyTrend.set(t);
          this.trendPage.set(t.currentMonth <= 6 ? 0 : 1);
        },
        error: () => this.monthlyTrend.set(null)
      });
  }


  // Graphiques recalculés après un ajout/une suppression ; un échec de
  // relecture garde simplement l'analyse précédente.
  private refreshAnalysis() {
    this.expensesService.getYearRecap().subscribe({
      next: r => this.yearRecap.set(r),
      error: () => {}
    });
    this.expensesService.getMonthlyTrend().subscribe({
      next: t => this.monthlyTrend.set(t),
      error: () => {}
    });
  }

  getRecLabel(recType: string): string {
  const labels: Record<string, string> = {
    Monthly: 'Mensuel',
    Yearly:  'Annuel',
    Daily:   'Quotidien'
  };
  return labels[recType] ?? recType;
}

  // Coût réel sur l'année pour cette dépense précise (annualisé pour
  // Mensuel/Quotidien) - null si pas de données ou si ça n'apporte rien
  // (Annuel : le montant brut EST déjà le montant annuel).
  getYearlyAmount(expense: ExpensesDTO): number | null {
    if (expense.recType === 'Yearly') return null;
    const item = this.yearRecap()?.items.find(i => i.expensesName === expense.expensesName);
    return item ? item.amountThisYear : null;
  }

  getIconClass(recType: string): string {
  const classes: Record<string, string> = {
    Monthly: 'icon-monthly',
    Yearly:  'icon-yearly',
    Daily:   'icon-daily'
  };
  return 'item-icon ' + (classes[recType] ?? 'icon-default');
  }

  getIcon(recType: string): string {
    const icons: Record<string, string> = {
      Monthly: 'ti-repeat',
      Yearly:  'ti-calendar-event',
      Daily:   'ti-sun'
    };
    return icons[recType] ?? 'ti-wallet';
  }

  private readonly RECTYPE_COLORS: Record<string, string> = {
    Monthly: '#6C63FF',
    Yearly:  '#059669',
    Daily:   '#D97706'
  };
  private readonly DONUT_CIRCUMFERENCE = 2 * Math.PI * 40;

  // Basé sur le vrai coût annuel de chaque type de récurrence (yearRecap),
  // pas sur la simple somme des montants bruts : un abonnement à 500€/mois
  // coûte 6000€/an, pas "500" comme une dépense annuelle à 1000€ - les
  // comparer tels quels n'aurait aucun sens.
  recTypeBreakdown = computed(() => {
    const recap = this.yearRecap();
    if (!recap) return [];

    const totals: Record<string, number> = {
      Monthly: recap.monthlyTotal,
      Daily: recap.dailyTotal,
      Yearly: recap.yearlyTotal
    };
    const grandTotal = recap.total || 1;

    const slices = Object.entries(totals)
      .filter(([, amount]) => amount > 0)
      .map(([recType, amount]) => ({
        recType,
        label: this.getRecLabel(recType),
        amount,
        percent: Math.round((amount / grandTotal) * 100),
        color: this.RECTYPE_COLORS[recType] ?? '#6b7280'
      }))
      .sort((a, b) => b.amount - a.amount);

    let cumulativePercent = 0;
    return slices.map(s => {
      const dashLength = (s.percent / 100) * this.DONUT_CIRCUMFERENCE;
      const dasharray = `${dashLength} ${this.DONUT_CIRCUMFERENCE - dashLength}`;
      const dashoffset = -((cumulativePercent / 100) * this.DONUT_CIRCUMFERENCE);
      cumulativePercent += s.percent;
      return { ...s, dasharray, dashoffset };
    });
  });

  private readonly MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Un bâton par mois, hauteur relative au mois le plus cher de l'année -
  // permet de voir d'un coup d'œil quels mois pèsent le plus (ex: un mois
  // où plusieurs dépenses annuelles tombent en même temps).
  trendChart = computed(() => {
    const trend = this.monthlyTrend();
    if (!trend) return [];
    const max = Math.max(...trend.amounts, 1);
    return trend.amounts.map((amount, i) => ({
      label: this.MONTH_LABELS[i],
      amount,
      isCurrent: i === trend.currentMonth - 1,
      heightPct: Math.round((amount / max) * 100)
    }));
  });

  // Les 12 mois d'un coup laissent trop de colonnes vides et tassent les
  // barres - on affiche un semestre à la fois (6 colonnes), avec le
  // semestre contenant le mois en cours sélectionné par défaut.
  trendPage = signal<0 | 1>(0);

  trendChartPage = computed(() => {
    const page = this.trendPage();
    return this.trendChart().slice(page * 6, page * 6 + 6);
  });

  semesterLabel = computed(() => this.trendPage() === 0 ? 'Janvier – Juin' : 'Juillet – Décembre');

  prevSemester(): void {
    if (this.trendPage() === 1) this.trendPage.set(0);
  }

  nextSemester(): void {
    if (this.trendPage() === 0) this.trendPage.set(1);
  }

  avgPerDay = computed(() => {
    const recap = this.yearRecap();
    if (!recap) return 0;
    const year = this.monthlyTrend()?.year ?? new Date().getFullYear();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return recap.total / (isLeapYear ? 366 : 365);
  });

  // Explique le pic du mois le plus cher quand il vient d'une dépense
  // Annuelle facturée en bloc ce mois-là - sinon le pic du graphique est
  // intriguant sans contexte.
  peakMonthNote = computed(() => {
    const trend = this.monthlyTrend();
    if (!trend) return null;

    const max = Math.max(...trend.amounts);
    if (max <= 0) return null;
    const peakIndex = trend.amounts.indexOf(max);

    const yearlyAtPeak = this.allExpenses().filter(e =>
      e.recType === 'Yearly' && !!e.startDate && (Number(e.startDate.split('-')[1]) - 1) === peakIndex
    );
    if (yearlyAtPeak.length === 0) return null;

    const names = yearlyAtPeak.map(e => `"${e.expensesName}"`).join(', ');
    const plural = yearlyAtPeak.length > 1;
    return `Le pic de ${this.MONTH_LABELS[peakIndex]} vient de ${names} (dépense${plural ? 's' : ''} annuelle${plural ? 's' : ''} facturée${plural ? 's' : ''} ce mois-ci).`;
  });

}
