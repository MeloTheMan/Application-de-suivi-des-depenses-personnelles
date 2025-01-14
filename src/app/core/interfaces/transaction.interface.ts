export type TransactionType = 'INCOME' | 'EXPENSE' | 'LOAN' | 'BORROW' | 'SAVINGS';

export interface Transaction {
  id?: number;
  type: TransactionType;
  amount: number;
  description: string;
  date: number; // timestamp
  category?: string;
}