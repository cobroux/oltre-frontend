export interface ExpensesDTO {
        id: number;
        expensesName : string;
        amount : number;
        recType? : string ;
        startDate : string ;
        endDate?: string;
        nextPaymentDate?: string;
}

export interface ExpensesYearItemDTO {
  expensesName: string;
  recType: string;
  amountThisYear: number;
}

export interface ExpensesYearRecapDTO {
  total: number;
  monthlyTotal: number;
  dailyTotal: number;
  yearlyTotal: number;
  items: ExpensesYearItemDTO[];
}

