import { TransactionType } from '../interfaces/transaction.interface';

type AllowedTransactionTypes = Extract<TransactionType, 'INCOME' | 'EXPENSE' | 'SAVINGS'>;

export const TRANSACTION_CATEGORIES: Record<AllowedTransactionTypes, string[]> = {
  INCOME: ['Salaire', 'Bonus', 'Freelance', 'Autres'],
  EXPENSE: ['Nourriture', 'Transport', 'Logement', 'Loisirs', 'Autres'],
  SAVINGS: ['Épargne générale', 'Projet spécifique', 'Retraite', 'Autres']
};