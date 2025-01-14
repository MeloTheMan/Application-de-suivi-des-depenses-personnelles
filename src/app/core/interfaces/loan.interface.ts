export type LoanType = 'GIVEN' | 'TAKEN';
export type LoanStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED';

export interface Loan {
  id?: number;
  contactId: number;
  amount: number;
  type: LoanType;
  date: number; // timestamp
  status: LoanStatus;
  remainingAmount?: number;
  interestRate: number;  // Taux d'intérêt en pourcentage
  interestAmount: number; // montant des intérêts calculé
  totalAmount: number;  
}