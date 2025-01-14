import { Transaction, TransactionType } from "../interfaces/transaction.interface";

export class TransactionModel implements Transaction {
  id?: number;
  type: TransactionType;
  amount: number;
  description: string;
  date: number;
  category?: string;

  constructor(data: Transaction) {
    this.id = data.id;
    this.type = data.type;
    this.amount = data.amount;
    this.description = data.description;
    this.date = data.date;
    this.category = data.category;
  }

  isExpense(): boolean {
    return this.type === 'EXPENSE';
  }

  isIncome(): boolean {
    return this.type === 'INCOME';
  }

  isSavings(): boolean {
    return this.type === 'SAVINGS';
  }

  isLoanRelated(): boolean {
    return this.type === 'LOAN' || this.type === 'BORROW';
  }
}