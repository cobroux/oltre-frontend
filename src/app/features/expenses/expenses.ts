import { Component, inject, OnInit } from '@angular/core';
import { ExpensesSevice } from '../../core/services/expenses.service';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpensesDTO } from '../../core/models/expenses.dto';

@Component({
  selector: 'app-expenses',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule, 
    ReactiveFormsModule],
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

  startDate: new FormControl<Date | null>(null, [
    Validators.required
  ])
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

  onSubmit() {
  if (this.addForm.invalid) {
    return;
  }

  const expense: ExpensesDTO = this.addForm.getRawValue() as unknown as ExpensesDTO;

  this.expensesService.addExpense(expense).subscribe({
    next: () => {
      console.log("Dépense ajoutée");

      this.expensesService.loadAllExpenses().subscribe();

      this.addForm.reset();
    },
    error: err => console.error(err)
  });
}

  allExpenses = this.expensesService.expensesListSignal;

   ngOnInit(): void {
      this.expensesService.loadAllExpenses().subscribe();
  }


}
