export interface ExpensesDTO {
        id: number;
        expensesName : string;
        amount : number; 
        recType? : string ;
        startDate : string ;
       // endDate : string ;
       nextPaymentDate?: string;
}

