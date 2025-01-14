// src/app/core/models/loan.model.ts
import { Loan, LoanType, LoanStatus } from '../interfaces/loan.interface';

export class LoanModel implements Loan {
  id?: number;
  contactId: number;
  amount: number;
  type: LoanType;
  date: number;
  status: LoanStatus;
  remainingAmount: number;
  interestRate: number;
  interestAmount: number;
  totalAmount: number;

  constructor(data: Loan) {
    this.id = data.id;
    this.contactId = data.contactId;
    this.amount = data.amount;
    this.type = data.type;
    this.date = data.date;
    this.status = data.status;
    this.interestRate = data.interestRate;
    this.interestAmount = (data.amount * data.interestRate) / 100;
    this.totalAmount = data.amount + this.interestAmount;
    this.remainingAmount = data.remainingAmount ?? this.totalAmount;
  }

  isGiven(): boolean {
    return this.type === 'GIVEN';
  }

  isTaken(): boolean {
    return this.type === 'TAKEN';
  }

  isPending(): boolean {
    return this.status === 'PENDING';
  }

  isPartiallyPaid(): boolean {
    return this.status === 'PARTIAL';
  }

  isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  getTotalAmount(): number {
    return this.totalAmount;
  }

  getRemainingAmount(): number {
    return this.remainingAmount;
  }

  getRepaymentPercentage(): number {
    if (this.totalAmount === 0) return 0;
    return ((this.totalAmount - this.remainingAmount) / this.totalAmount) * 100;
  }

  isPaidInFull(paymentAmount: number): boolean {
    return paymentAmount >= this.remainingAmount;
  }

  calculateNewRemainingAmount(paymentAmount: number): number {
    return Math.max(0, this.remainingAmount - paymentAmount);
  }

  getStatus(remainingAmount: number): LoanStatus {
    if (remainingAmount <= 0) return 'COMPLETED';
    if (remainingAmount < this.totalAmount) return 'PARTIAL';
    return 'PENDING';
  }

  needsAlert(): boolean {
    const percentage = this.getRepaymentPercentage();
    return percentage < 10 || percentage === 50;
  }
}

