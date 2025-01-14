import { ToastController } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { Transaction, TransactionType } from '../interfaces/transaction.interface';
import { TransactionModel } from '../models/transaction.model';
import { BehaviorSubject } from 'rxjs';

interface SQLiteQueryResult {
  values?: Array<{
    id: number;
    type: TransactionType;
    amount: number;
    description: string;
    date: number;
    category?: string;
  }>;
}
interface TransactionData {
  id: number;
  type: TransactionType;
  amount: number;
  description: string;
  date: number;
  category?: string;
}

// src/app/core/services/transaction.service.ts
@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transactionsSubject = new BehaviorSubject<TransactionModel[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  constructor(private sqliteService: SqliteService, private toastController: ToastController) {}

  async loadTransactions(): Promise<TransactionModel[]> {
    try {
      const result = await this.sqliteService.executeQuery(
        'SELECT * FROM transactions ORDER BY date DESC'
      );
      const transactions = (result.values ?? []).map((t: { 
        id: number;
        type: TransactionType;
        amount: number;
        description: string;
        date: number;
        category?: string;}) => new TransactionModel({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date,
        category: t.category
      }));
      this.transactionsSubject.next(transactions);
      return transactions;
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
      return [];
    }
  }

  async getTransaction(id: number): Promise<TransactionModel | null> {
    try {
      const result = await this.sqliteService.executeQuery(
        'SELECT * FROM transactions WHERE id = ?',
        [id]
      );
      if (result.values?.length) {
        const t = result.values[0];
        return new TransactionModel({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          date: t.date,
          category: t.category
        });
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération transaction:', error);
      return null;
    }
  }

  /*async addTransaction(transaction: Transaction): Promise<void> {
    try {
      await this.sqliteService.executeQuery(
        'INSERT INTO transactions (type, amount, description, date, category) VALUES (?, ?, ?, ?, ?)',
        [transaction.type, transaction.amount, transaction.description, transaction.date, transaction.category]
      );
      await this.loadTransactions();
    } catch (error) {
      console.error('Erreur ajout transaction:', error);
      throw error;
    }
  }*/

  async updateTransaction(transaction: Transaction): Promise<void> {
    try {
      await this.sqliteService.executeQuery(
        'UPDATE transactions SET type = ?, amount = ?, description = ?, category = ? WHERE id = ?',
        [transaction.type, transaction.amount, transaction.description, transaction.category, transaction.id]
      );
      await this.loadTransactions();
    } catch (error) {
      console.error('Erreur mise à jour transaction:', error);
      throw error;
    }
  }

  async removeTransaction(id: number): Promise<void> {
    try {
      await this.sqliteService.executeQuery(
        'DELETE FROM transactions WHERE id = ?',
        [id]
      );
      await this.loadTransactions();
    } catch (error) {
      console.error('Erreur suppression transaction:', error);
      throw error;
    }
  }

  async getTransactionsByType(type: TransactionType): Promise<TransactionModel[]> {
    try {
      const result = await this.sqliteService.executeQuery(
        'SELECT * FROM transactions WHERE type = ? ORDER BY date DESC',
        [type]
      );
      
      return (result.values ?? []).map((t: { 
        id: number;
        type: TransactionType;
        amount: number;
        description: string;
        date: number;
        category?: string;}) => new TransactionModel({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date,
        category: t.category
      }));
    } catch (error) {
      console.error('Erreur récupération transactions par type:', error);
      return [];
    }
  }
  async handleSavingsTransaction(transaction: Transaction, direction: 'TO_SAVINGS' | 'FROM_SAVINGS'): Promise<void> {
    try {
      if (direction === 'FROM_SAVINGS') {
        // Vérifier si l'épargne disponible est suffisante
        const savings = await this.getTransactionsByType('SAVINGS');
        const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
        
        if (totalSavings < transaction.amount) {
          throw new Error('Solde d\'épargne insuffisant');
        }
  
        // Pour un retrait, créer une seule transaction négative
        await this.addTransaction({
          type: 'SAVINGS',
          amount: -transaction.amount, // Montant négatif pour diminuer l'épargne
          description: `Retrait: ${transaction.description}`,
          date: transaction.date,
          category: 'Retrait d\'épargne'
        });
      } else {
        // Pour un ajout à l'épargne, ajouter directement la transaction
        await this.addTransaction(transaction);
      }
    } catch (error) {
      console.error('Erreur transaction épargne:', error);
      throw error;
    }
  }

 

async searchTransactions(searchTerm: string): Promise<TransactionModel[]> {
  try {
    if (!searchTerm.trim()) {
      return this.loadTransactions();
    }

    console.log(`Searching transactions with term: ${searchTerm}`);
    const result = await this.sqliteService.executeQuery(
      `SELECT * FROM transactions 
       WHERE amount LIKE ? 
       OR description LIKE ? 
       OR category LIKE ? 
       OR date LIKE ?
       ORDER BY date DESC`,
      [
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`
      ]
    );

    const transactions = result.values?.map((t: any) => new TransactionModel({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.date,
      category: t.category
    })) || [];

    return transactions;
  } catch (error) {
    console.error('Erreur lors de la recherche des transactions:', error);
    await this.presentToast('Erreur lors de la recherche des transactions', 'danger');
    return [];
  }
}
    /*private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
      const toast = await this.toastController.create({
        message,
        color,
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    }*/

    private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
      const toast = await this.toastController.create({
        message,
        color,
        duration: 3000,
        position: 'bottom'
      });
      await toast.present();
    }
  
    async getBalance(): Promise<number> {
      try {
        const transactions = await this.loadTransactions();
        return transactions.reduce((balance, transaction) => {
          switch (transaction.type) {
            case 'INCOME':
              return balance + transaction.amount;
            case 'EXPENSE':
            case 'LOAN':
            case 'SAVINGS':
              return balance - transaction.amount;
            case 'BORROW':
              return balance + transaction.amount;
            default:
              return balance;
          }
        }, 0);
      } catch (error) {
        console.error('Erreur lors du calcul du solde:', error);
        return 0;
      }
    }
  
    /*async getSavingsBalance(): Promise<number> {
      try {
        const transactions = await this.getTransactionsByType('SAVINGS');
        return transactions.reduce((total, transaction) => total + transaction.amount, 0);
      } catch (error) {
        console.error('Erreur lors du calcul de l\'épargne:', error);
        return 0;
      }
    }*/
  
    async canMakeWithdrawal(amount: number, type: 'SAVINGS' | 'LOAN'): Promise<boolean> {
      try {
        if (type === 'SAVINGS') {
          const savingsBalance = await this.getSavingsBalance();
          if (amount > savingsBalance) {
            await this.presentToast('Solde d\'épargne insuffisant pour ce retrait', 'danger');
            return false;
          }
        } else {
          const currentBalance = await this.getBalance();
          if (amount > currentBalance) {
            await this.presentToast('Solde insuffisant pour ce prêt', 'danger');
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error('Erreur lors de la vérification du solde:', error);
        await this.presentToast('Erreur lors de la vérification du solde', 'danger');
        return false;
      }
    }
  
    /*async handleSavingsTransaction(transaction: Transaction, direction: 'TO_SAVINGS' | 'FROM_SAVINGS'): Promise<void> {
      try {
        if (direction === 'FROM_SAVINGS') {
          const canWithdraw = await this.canMakeWithdrawal(transaction.amount, 'SAVINGS');
          if (!canWithdraw) {
            throw new Error('Solde d\'épargne insuffisant');
          }
          transaction.amount = -transaction.amount; // Rendre le montant négatif pour un retrait
        }
  
        await this.addTransaction(transaction);
        await this.presentToast(
          direction === 'TO_SAVINGS' ? 'Épargne ajoutée avec succès' : 'Retrait d\'épargne effectué avec succès'
        );
      } catch (error) {
        console.error('Erreur lors de l\'opération d\'épargne:', error);
        await this.presentToast(
          `Erreur: ${'Erreur lors de l\'opération d\'épargne'}`,
          'danger'
        );
        throw error;
      }
    }*/
  
    /*async addTransaction(transaction: Transaction): Promise<void> {
      try {
        if ((transaction.type === 'SAVINGS' && transaction.amount < 0) || 
            transaction.type === 'LOAN') {
          const canWithdraw = await this.canMakeWithdrawal(
            Math.abs(transaction.amount),
            transaction.type === 'SAVINGS' ? 'SAVINGS' : 'LOAN'
          );
  
          if (!canWithdraw) {
            throw new Error('Solde insuffisant pour cette opération');
          }
        }
  
        await this.sqliteService.executeQuery(
          `INSERT INTO transactions (
            type, amount, description, date, category
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            transaction.type,
            transaction.amount,
            transaction.description,
            transaction.date,
            transaction.category
          ]
        );
        await this.loadTransactions();
        await this.presentToast('Transaction ajoutée avec succès');
      } catch (error) {
        console.error('Erreur ajout transaction:', error);
        await this.presentToast('Erreur lors de l\'ajout de la transaction', 'danger');
        throw error;
      }
    }*/

    private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
      const toast = await this.toastController.create({
        message,
        duration: 3000,
        position: 'bottom',
        color: color
      });
      await toast.present();
    }
  
    // Calculer le solde disponible
    async getCurrentBalance(): Promise<number> {
      const transactions = await this.loadTransactions();
      return transactions.reduce((balance, transaction) => {
        switch (transaction.type) {
          case 'INCOME':
            return balance + transaction.amount;
          case 'EXPENSE':
          case 'SAVINGS':
            return balance - transaction.amount;
          default:
            return balance;
        }
      }, 0);
    }
  
    // Calculer le solde d'épargne
    async getSavingsBalance(): Promise<number> {
      const transactions = await this.loadTransactions();
      const savingsTransactions = transactions.filter(t => t.type === 'SAVINGS');
      return savingsTransactions.reduce((total, transaction) => total + transaction.amount, 0);
    }
  
    async addTransaction(transaction: Transaction): Promise<boolean> {
      try {
        const currentBalance = await this.getCurrentBalance();
        const savingsBalance = await this.getSavingsBalance();
  
        // Vérifications selon le type de transaction
        if (transaction.type === 'SAVINGS') {
          if (transaction.amount > currentBalance) {
            await this.showToast(
              'Solde insuffisant pour cette épargne. Solde actuel: ' + 
              currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' }),
              'danger'
            );
            return false;
          }
        } 
        else if (transaction.type === 'EXPENSE') {
          if (transaction.amount > currentBalance) {
            await this.showToast(
              'Solde insuffisant pour cette dépense. Solde actuel: ' + 
              currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' }),
              'danger'
            );
            return false;
          }
        }
  
        // Pour les retraits d'épargne
        if (transaction.category === 'Retrait d\'épargne' && transaction.amount > savingsBalance) {
          await this.showToast(
            'Solde d\'épargne insuffisant. Solde d\'épargne actuel: ' + 
            savingsBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' }),
            'danger'
          );
          return false;
        }
  
        await this.sqliteService.executeQuery(
          'INSERT INTO transactions (type, amount, description, date, category) VALUES (?, ?, ?, ?, ?)',
          [transaction.type, transaction.amount, transaction.description, transaction.date, transaction.category]
        );
  
        await this.loadTransactions();
        await this.showToast('Transaction enregistrée avec succès');
        return true;
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la transaction:', error);
        await this.showToast('Erreur lors de l\'enregistrement de la transaction', 'danger');
        return false;
      }
    }
  }
