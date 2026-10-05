import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ExpensesSevice } from '../../core/services/expenses.service';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpensesDTO } from '../../core/models/expenses.dto';
import { DatePipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-expenses',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule, 
    ReactiveFormsModule, JsonPipe, DatePipe],
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

    this.expensesService.addExpense(expense).subscribe({
      next: () => {
        this.expensesService.loadAllExpenses().subscribe();
        this.addForm.reset();
      },
      error: err => console.error(err)
    });

  }

  confirmDeleteId = signal<number | null>(null);

  requestDelete(id: number) {
    if (this.confirmDeleteId() === id) {
      this.expensesService.deleteExpenses(id).subscribe({
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

  allExpenses = this.expensesService.expensesListSignal;
  amountPerMonth = this.expensesService.intSignal;
   ngOnInit(): void {
      this.expensesService.loadAllExpenses().subscribe();
      this.expensesService.getAmountPerMonth().subscribe();

  }


  getRecLabel(recType: string): string {
  const labels: Record<string, string> = {
    Monthly: 'Mensuel',
    Yearly:  'Annuel',
    Daily:   'Quotidien'
  };
  return labels[recType] ?? recType;
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

  recTypeBreakdown = computed(() => {
    const totals = new Map<string, number>();
    for (const e of this.allExpenses()) {
      const key = e.recType ?? 'Other';
      totals.set(key, (totals.get(key) ?? 0) + (e.amount ?? 0));
    }
    const grandTotal = [...totals.values()].reduce((s, v) => s + v, 0) || 1;

    const slices = [...totals.entries()]
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

}
