import { Injectable } from '@angular/core';
import { TransactionService } from './transaction.service';
import { TransactionModel } from '../models/transaction.model';
import { TransactionType } from '../interfaces/transaction.interface';

interface StatsPeriod {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  constructor(private transactionService: TransactionService) {}

  async getStatsByType(type: TransactionType): Promise<StatsPeriod> {
    const transactions = await this.transactionService.getTransactionsByType(type);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    const oneYear = 365 * oneDay;

    return {
      daily: this.sumTransactionsInPeriod(transactions, now - oneDay, now),
      weekly: this.sumTransactionsInPeriod(transactions, now - oneWeek, now),
      monthly: this.sumTransactionsInPeriod(transactions, now - oneMonth, now),
      yearly: this.sumTransactionsInPeriod(transactions, now - oneYear, now)
    };
  }

  private sumTransactionsInPeriod(transactions: TransactionModel[], start: number, end: number): number {
    return transactions
      .filter(t => t.date >= start && t.date <= end)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  async getSavingsProgress(): Promise<number> {
    const savings = await this.transactionService.getTransactionsByType('SAVINGS');
    return savings.reduce((total, saving) => total + saving.amount, 0);
  }

  async getExpensesByCategory(): Promise<Map<string, number>> {
    const expenses = await this.transactionService.getTransactionsByType('EXPENSE');
    const categoryMap = new Map<string, number>();

    expenses.forEach(expense => {
      const category = expense.category || 'Autres';
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + expense.amount);
    });

    return categoryMap;
  }
}