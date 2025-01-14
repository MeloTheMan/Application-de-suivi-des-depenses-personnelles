import { ToastController } from '@ionic/angular';
// src/app/core/services/loan.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SqliteService } from './sqlite.service';
import { LoanModel } from '../models/loan.model';
import { Loan, LoanType, LoanStatus } from '../interfaces/loan.interface';
import { TransactionService } from './transaction.service';
import { ContactService } from './contact.service';

interface LoanData {
  id: number;
  contact_id: number;
  amount: number;
  remaining_amount: number;
  type: LoanType;
  date: number;
  status: LoanStatus;
  interest_rate: number;
  interest_amount: number;
  total_amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private loansSubject = new BehaviorSubject<LoanModel[]>([]);
  loans$ = this.loansSubject.asObservable();

  constructor(private sqliteService: SqliteService, private transactionService: TransactionService, private contactService: ContactService, private toastController: ToastController) {}

  async loadLoans(): Promise<LoanModel[]> {
    try {
      const result = await this.sqliteService.executeQuery(
        'SELECT * FROM loans ORDER BY date DESC'
      );
      const loans = (result.values ?? []).map((l: LoanData) => new LoanModel({
        id: l.id,
        contactId: l.contact_id,
        amount: l.amount,
        remainingAmount: l.remaining_amount,
        type: l.type,
        date: l.date,
        status: l.status,
        interestRate: l.interest_rate,
        interestAmount: l.interest_amount,
        totalAmount: l.total_amount
      }));
      this.loansSubject.next(loans);
      return loans;
    } catch (error) {
      console.error('Erreur chargement prêts:', error);
      return [];
    }
  }

  async getLoan(id: number): Promise<LoanModel | null> {
    try {
      const result = await this.sqliteService.executeQuery(
        'SELECT * FROM loans WHERE id = ?',
        [id]
      );
      if (result.values?.length) {
        const l: LoanData = result.values[0];
        return new LoanModel({
          id: l.id,
          contactId: l.contact_id,
          amount: l.amount,
          remainingAmount: l.remaining_amount,
          type: l.type,
          date: l.date,
          status: l.status,
          interestRate: l.interest_rate,
          interestAmount: l.interest_amount,
          totalAmount: l.total_amount
        });
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération prêt:', error);
      return null;
    }
  }

  // src/app/core/services/loan.service.ts
async addLoan(loan: Loan): Promise<void> {
  try {
    // Calculer les montants
    const interestAmount = (loan.amount * loan.interestRate) / 100;
    const totalAmount = loan.amount + interestAmount;

    await this.sqliteService.executeQuery(
      `INSERT INTO loans (
        contact_id, 
        amount, 
        remaining_amount, 
        type, 
        date, 
        status, 
        interest_rate, 
        interest_amount,
        total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loan.contactId,
        loan.amount,
        totalAmount, // Le montant restant initial est le montant total
        loan.type,
        loan.date,
        loan.status,
        loan.interestRate,
        interestAmount,
        totalAmount
      ]
    );
    await this.loadLoans();
  } catch (error) {
    console.error('Erreur ajout prêt:', error);
    throw error;
  }
}

  /*async updateLoan(loan: Loan): Promise<void> {
    try {
      const interestAmount = (loan.amount * loan.interestRate) / 100;
      await this.sqliteService.executeQuery(
        `UPDATE loans 
         SET contact_id = ?, amount = ?, remaining_amount = ?, type = ?, 
             status = ?, interest_rate = ?, interest_amount = ?
         WHERE id = ?`,
        [
          loan.contactId,
          loan.amount,
          loan.remainingAmount,
          loan.type,
          loan.status,
          loan.interestRate,
          interestAmount,
          loan.id
        ]
      );
      await this.loadLoans();
    } catch (error) {
      console.error('Erreur mise à jour prêt:', error);
      throw error;
    }
  }*/

  async removeLoan(id: number): Promise<void> {
    try {
      await this.sqliteService.executeQuery('DELETE FROM loans WHERE id = ?', [id]);
      await this.loadLoans();
    } catch (error) {
      console.error('Erreur suppression prêt:', error);
      throw error;
    }
  }

  

  async getLoansNeedingAlert(): Promise<LoanModel[]> {
    try {
      const allLoans = await this.loadLoans();
      return allLoans.filter(loan => loan.needsAlert());
    } catch (error) {
      console.error('Erreur récupération des alertes de prêts:', error);
      return [];
    }
  }
 
    private async showToast(message: string, color: 'success' | 'danger' = 'success') {
      const toast = await this.toastController.create({
        message,
        duration: 3000,
        position: 'bottom',
        color
      });
      await toast.present();
    }
  
  

      /*async handleLoanTransaction(loan: Loan, payment?: number): Promise<boolean> {
        try {
          const contact = await this.contactService.getContact(loan.contactId);
          if (!contact) {
            await this.showToast('Contact non trouvé', 'danger');
            return false;
          }
    
          // Nouveau prêt/emprunt
          if (!payment) {
            return await this.createNewLoan(loan, contact.name);
          }
    
          // Remboursement
          return await this.handleRepayment(loan, contact.name, payment);
    
        } catch (error: unknown) {
          console.error('Erreur lors de l\'opération:', error);
          await this.showToast('Une erreur est survenue lors de l\'opération', 'danger');
          return false;
        }
      }*/
    
      private calculateLoanStatus(remainingAmount: number, totalAmount: number): string {
        if (remainingAmount <= 0) {
          return 'COMPLETED';
        } else if (remainingAmount < totalAmount) {
          return 'PARTIAL';
        }
        return 'PENDING';
      }
      
      /*private async createNewLoan(loan: Loan, contactName: string): Promise<boolean> {
        try {
          // Vérification du solde pour les prêts donnés
          if (loan.type === 'GIVEN') {
            const currentBalance = await this.transactionService.getCurrentBalance();
            if (loan.amount > currentBalance) {
              await this.showToast(
                `Solde insuffisant pour accorder ce prêt. Solde actuel: ${currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}`,
                'danger'
              );
              return false;
            }
          }
      
          const transactionType = loan.type === 'GIVEN' ? 'EXPENSE' : 'INCOME';
          const description = loan.type === 'GIVEN' 
            ? `Prêt accordé à ${contactName}`
            : `Emprunt reçu de ${contactName}`;
          const category = loan.type === 'GIVEN' ? 'Prêts' : 'Emprunts';
      
          // Calcul des montants
          const interestAmount = (loan.amount * loan.interestRate) / 100;
          const totalAmount = loan.amount + interestAmount;
      
          await this.sqliteService.executeTransaction([
            {
              query: `INSERT INTO loans (
                contact_id, amount, remaining_amount, type, date, status,
                interest_rate, interest_amount, total_amount
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              params: [
                loan.contactId,
                loan.amount,
                totalAmount, // Le montant restant initial est le montant total (principal + intérêts)
                loan.type,
                loan.date,
                'PENDING',
                loan.interestRate,
                interestAmount,
                totalAmount
              ]
            },
            {
              query: `INSERT INTO transactions (type, amount, description, date, category)
                     VALUES (?, ?, ?, ?, ?)`,
              params: [
                transactionType,
                loan.amount,
                description,
                loan.date,
                category
              ]
            }
          ]);
      
          await this.loadLoans();
          await this.showToast('Opération effectuée avec succès');
          return true;
        } catch (error) {
          console.error('Erreur lors de la création du prêt:', error);
          await this.showToast('Erreur lors de la création du prêt/emprunt', 'danger');
          return false;
        }
      }*/
      
      private async handleRepayment(loan: Loan, contactName: string, payment: number): Promise<boolean> {
        try {
          const existingLoan = await this.getLoan(loan.id!);
          if (!existingLoan) {
            await this.showToast('Prêt non trouvé', 'danger');
            return false;
          }
      
          // Vérification du solde pour le remboursement d'un emprunt
          if (existingLoan.type === 'TAKEN') {
            const currentBalance = await this.transactionService.getCurrentBalance();
            if (payment > currentBalance) {
              await this.showToast(
                `Solde insuffisant pour effectuer ce remboursement. Solde actuel: ${currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}`,
                'danger'
              );
              return false;
            }
          }
      
          // Vérification du montant du remboursement
          if (payment > existingLoan.remainingAmount) {
            await this.showToast(
              `Le montant du remboursement ne peut pas dépasser le montant restant dû (${existingLoan.remainingAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })})`,
              'danger'
            );
            return false;
          }
      
          const transactionType = existingLoan.type === 'GIVEN' ? 'INCOME' : 'EXPENSE';
          const description = existingLoan.type === 'GIVEN'
            ? `Remboursement reçu de ${contactName}`
            : `Remboursement effectué à ${contactName}`;
          const category = existingLoan.type === 'GIVEN'
            ? 'Remboursements reçus'
            : 'Remboursements effectués';
      
          const newRemainingAmount = existingLoan.remainingAmount - payment;
          const newStatus = this.calculateLoanStatus(newRemainingAmount, existingLoan.totalAmount);
      
          await this.sqliteService.executeTransaction([
            {
              query: 'UPDATE loans SET remaining_amount = ?, status = ? WHERE id = ?',
              params: [newRemainingAmount, newStatus, loan.id]
            },
            {
              query: 'INSERT INTO transactions (type, amount, description, date, category) VALUES (?, ?, ?, ?, ?)',
              params: [transactionType, payment, description, Date.now(), category]
            }
          ]);
      
          await this.loadLoans();
          await this.showToast('Remboursement enregistré avec succès');
          return true;
        } catch (error) {
          console.error('Erreur lors du remboursement:', error);
          await this.showToast('Erreur lors du remboursement', 'danger');
          return false;
        }
      }
  
    
  
    async updateLoanStatus(id: number, paymentAmount: number): Promise<void> {
      try {
        const loan = await this.getLoan(id);
        if (!loan) throw new Error('Prêt non trouvé');
  
        const newRemainingAmount = loan.calculateNewRemainingAmount(paymentAmount);
        const newStatus = loan.getStatus(newRemainingAmount);
  
        await this.sqliteService.executeQuery(
          'UPDATE loans SET remaining_amount = ?, status = ? WHERE id = ?',
          [newRemainingAmount, newStatus, id]
        );
  
        await this.loadLoans();
      } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        throw error;
      }
    }

    async searchLoans(searchTerm: string): Promise<LoanModel[]> {
      try {
        if (!searchTerm.trim()) {
          return this.loadLoans();
        }
  
        console.log(`Recherche de prêts avec le terme: ${searchTerm}`);
        
        // Rechercher d'abord les contacts correspondants
        const contacts = await this.contactService.searchContacts(searchTerm);
        const contactIds = contacts.map(contact => contact.id);
        
        let query = `
          SELECT l.* 
          FROM loans l
          LEFT JOIN contacts c ON l.contact_id = c.id
          WHERE l.amount LIKE ? 
          OR l.remaining_amount LIKE ? 
          OR l.total_amount LIKE ?
          OR l.date LIKE ?
          OR l.status LIKE ?
        `;
  
        // Ajouter la condition pour les IDs de contacts si nous en avons trouvé
        if (contactIds.length > 0) {
          query += ` OR l.contact_id IN (${contactIds.join(',')})`;
        }
  
        query += ' ORDER BY l.date DESC';
  
        const result = await this.sqliteService.executeQuery(
          query,
          [
            `%${searchTerm}%`,
            `%${searchTerm}%`,
            `%${searchTerm}%`,
            `%${searchTerm}%`,
            `%${searchTerm}%`
          ]
        );
  
        const loans = result.values?.map((l: LoanData) => new LoanModel({
          id: l.id,
          contactId: l.contact_id,
          amount: l.amount,
          remainingAmount: l.remaining_amount,
          type: l.type,
          date: l.date,
          status: l.status,
          interestRate: l.interest_rate,
          interestAmount: l.interest_amount,
          totalAmount: l.total_amount
        })) || [];
  
        return loans;
      } catch (error) {
        console.error('Erreur lors de la recherche des prêts:', error);
        throw error;
      }
    }
  
    async searchLoansByContact(contactId: number): Promise<LoanModel[]> {
      try {
        const result = await this.sqliteService.executeQuery(
          'SELECT * FROM loans WHERE contact_id = ? ORDER BY date DESC',
          [contactId]
        );
  
        const loans = result.values?.map((l: LoanData) => new LoanModel({
          id: l.id,
          contactId: l.contact_id,
          amount: l.amount,
          remainingAmount: l.remaining_amount,
          type: l.type,
          date: l.date,
          status: l.status,
          interestRate: l.interest_rate,
          interestAmount: l.interest_amount,
          totalAmount: l.total_amount
        })) || [];
  
        return loans;
      } catch (error) {
        console.error('Erreur lors de la recherche des prêts par contact:', error);
        throw error;
      }
    }
  
    async searchLoansByDateRange(startDate: number, endDate: number): Promise<LoanModel[]> {
      try {
        const result = await this.sqliteService.executeQuery(
          'SELECT * FROM loans WHERE date BETWEEN ? AND ? ORDER BY date DESC',
          [startDate, endDate]
        );
  
        const loans = result.values?.map((l: LoanData) => new LoanModel({
          id: l.id,
          contactId: l.contact_id,
          amount: l.amount,
          remainingAmount: l.remaining_amount,
          type: l.type,
          date: l.date,
          status: l.status,
          interestRate: l.interest_rate,
          interestAmount: l.interest_amount,
          totalAmount: l.total_amount
        })) || [];
  
        return loans;
      } catch (error) {
        console.error('Erreur lors de la recherche des prêts par période:', error);
        throw error;
      }
    }
  
    async searchLoansByStatus(status: LoanStatus): Promise<LoanModel[]> {
      try {
        const result = await this.sqliteService.executeQuery(
          'SELECT * FROM loans WHERE status = ? ORDER BY date DESC',
          [status]
        );
  
        const loans = result.values?.map((l: LoanData) => new LoanModel({
          id: l.id,
          contactId: l.contact_id,
          amount: l.amount,
          remainingAmount: l.remaining_amount,
          type: l.type,
          date: l.date,
          status: l.status,
          interestRate: l.interest_rate,
          interestAmount: l.interest_amount,
          totalAmount: l.total_amount
        })) || [];
  
        return loans;
      } catch (error) {
        console.error('Erreur lors de la recherche des prêts par statut:', error);
        throw error;
      }
    }
    async updateLoan(loan: Loan): Promise<void> {
      try {
        // Récupérer l'ancien prêt pour comparer
        const oldLoan = await this.getLoan(loan.id!);
        if (!oldLoan) throw new Error('Prêt non trouvé');
    
        const contact = await this.contactService.getContact(loan.contactId);
        if (!contact) throw new Error('Contact non trouvé');
    
        // Calculer les nouveaux montants
        const interestAmount = (loan.amount * loan.interestRate) / 100;
        const totalAmount = loan.amount + interestAmount;
        const remainingAmount = totalAmount * (oldLoan.remainingAmount / oldLoan.totalAmount);
    
        // Préparer les mises à jour
        const queries: { query: string; params: any[] }[] = [];
    
        // 1. Mise à jour du prêt
        queries.push({
          query: `UPDATE loans 
                  SET contact_id = ?, amount = ?, remaining_amount = ?, 
                      interest_rate = ?, interest_amount = ?, total_amount = ?
                  WHERE id = ?`,
          params: [
            loan.contactId,
            loan.amount,
            remainingAmount,
            loan.interestRate,
            interestAmount,
            totalAmount,
            loan.id
          ]
        });
    
        // 2. Rechercher et mettre à jour la transaction associée
        const transactionResult = await this.sqliteService.executeQuery(
          'SELECT id, amount FROM transactions WHERE description LIKE ? AND date = ?',
          [`%${loan.type === 'GIVEN' ? 'Prêt accordé à' : 'Emprunt reçu de'}%${contact.name}%`, oldLoan.date]
        );
    
        if (transactionResult.values?.length) {
          const transactionId = transactionResult.values[0].id;
          queries.push({
            query: 'UPDATE transactions SET amount = ? WHERE id = ?',
            params: [loan.amount, transactionId]
          });
        }
    
        // Exécuter toutes les mises à jour dans une transaction
        await this.sqliteService.executeTransaction(queries);
        
        // Recharger les données
        await this.loadLoans();
    
        await this.showToast('Prêt mis à jour avec succès');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du prêt:', error);
        await this.showToast('Erreur lors de la mise à jour', 'danger');
        throw error;
      }
    }
    
    async handleLoanTransaction(loan: Loan, payment?: number): Promise<boolean> {
      try {
        const contact = await this.contactService.getContact(loan.contactId);
        if (!contact) {
          await this.showToast('Contact non trouvé', 'danger');
          return false;
        }
    
        // Nouveau prêt/emprunt
        if (!payment) {
          return await this.createNewLoan(loan, contact.name);
        }
    
        // Remboursement
        return await this.handleRepayment(loan, contact.name, payment);
      } catch (error) {
        console.error('Erreur lors de l\'opération:', error);
        await this.showToast('Une erreur est survenue lors de l\'opération', 'danger');
        return false;
      }
    }
    
    private async createNewLoan(loan: Loan, contactName: string): Promise<boolean> {
      try {
        // Vérification du solde pour les prêts donnés
        if (loan.type === 'GIVEN') {
          const currentBalance = await this.transactionService.getCurrentBalance();
          if (loan.amount > currentBalance) {
            await this.showToast(
              `Solde insuffisant pour accorder ce prêt. Solde actuel: ${currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}`,
              'danger'
            );
            return false;
          }
        }
    
        const transactionType = loan.type === 'GIVEN' ? 'EXPENSE' : 'INCOME';
        const description = loan.type === 'GIVEN' 
          ? `Prêt accordé à ${contactName}`
          : `Emprunt reçu de ${contactName}`;
        const category = loan.type === 'GIVEN' ? 'Prêts' : 'Emprunts';
    
        // Calcul des montants
        const interestAmount = (loan.amount * loan.interestRate) / 100;
        const totalAmount = loan.amount + interestAmount;
    
        const queries = [
          {
            query: `INSERT INTO loans (
              contact_id, amount, remaining_amount, type, date, status,
              interest_rate, interest_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
              loan.contactId,
              loan.amount,
              totalAmount,
              loan.type,
              loan.date,
              'PENDING',
              loan.interestRate,
              interestAmount,
              totalAmount
            ]
          },
          {
            query: `INSERT INTO transactions (type, amount, description, date, category)
                   VALUES (?, ?, ?, ?, ?)`,
            params: [transactionType, loan.amount, description, loan.date, category]
          }
        ];
    
        await this.sqliteService.executeTransaction(queries);
        await this.loadLoans();
        await this.showToast('Opération effectuée avec succès');
        return true;
      } catch (error) {
        console.error('Erreur lors de la création du prêt:', error);
        await this.showToast('Erreur lors de la création du prêt/emprunt', 'danger');
        return false;
      }
    }
}