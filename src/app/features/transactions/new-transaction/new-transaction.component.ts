import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TransactionType } from 'src/app/core/interfaces/transaction.interface';
import { TransactionService } from 'src/app/core/services/transaction.service';
import { TRANSACTION_CATEGORIES } from 'src/app/core/constants/transaction.constant';
import { ModalController } from '@ionic/angular';

type TransactionFormType = Extract<TransactionType, 'EXPENSE' | 'INCOME' | 'SAVINGS'>;

@Component({
  selector: 'app-new-transaction',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Nouvelle Transaction</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="floating">Type</ion-label>
          <ion-select formControlName="type" (ionChange)="onTypeChange()">
            <ion-select-option value="INCOME">Entrée</ion-select-option>
            <ion-select-option value="EXPENSE">Sortie</ion-select-option>
            <ion-select-option value="SAVINGS">Épargne</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Montant</ion-label>
          <ion-input type="number" formControlName="amount"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Description</ion-label>
          <ion-input type="text" formControlName="description"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Catégorie</ion-label>
          <ion-select formControlName="category">
            <ion-select-option *ngFor="let category of categories" [value]="category">
              {{ category }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-button expand="block" type="submit" [disabled]="!transactionForm.valid" class="ion-margin">
          Enregistrer
        </ion-button>
      </form>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class NewTransactionComponent implements OnInit {
  transactionForm: FormGroup;
  categories: string[] = [];
  @Input() savingsDirection?: 'TO_SAVINGS' | 'FROM_SAVINGS';

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private modalController: ModalController
  ) {
    this.transactionForm = this.fb.group({
      type: ['INCOME', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      category: ['', Validators.required]
    });
  }

  ngOnInit() {
    if (this.savingsDirection) {
      this.setupSavingsTransaction();
    }
    this.onTypeChange();
  }

  private setupSavingsTransaction() {
    // Si c'est un retrait d'épargne
    if (this.savingsDirection === 'FROM_SAVINGS') {
      this.transactionForm.patchValue({
        type: 'EXPENSE',
        category: 'Retrait d\'épargne'
      });
    } 
    // Si c'est un ajout à l'épargne
    else if (this.savingsDirection === 'TO_SAVINGS') {
      this.transactionForm.patchValue({
        type: 'SAVINGS',
        category: 'Épargne générale'
      });
    }
    // Désactiver le changement de type pour les opérations d'épargne
    this.transactionForm.get('type')?.disable();
    this.transactionForm.get('category')?.disable();
  }

  onTypeChange() {
    const type = this.transactionForm.get('type')?.value as TransactionFormType;
    if (type && type in TRANSACTION_CATEGORIES) {
      this.categories = TRANSACTION_CATEGORIES[type];
    } else {
      this.categories = [];
    }
  }

  /*async onSubmit() {
    if (this.transactionForm.valid) {
      const transaction = {
        ...this.transactionForm.value,
        date: Date.now()
      };
      
      try {
        await this.transactionService.addTransaction(transaction);
        await this.modalController.dismiss(true); // Ajout du await
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  }*/
    async onSubmit() {
      if (this.transactionForm.valid) {
        try {
          const transaction = {
            ...this.transactionForm.value,
            date: Date.now()
          };
    
          // Si c'est un retrait d'épargne, créer deux transactions
          if (this.savingsDirection === 'FROM_SAVINGS') {
            const success = await this.transactionService.addTransaction({
              type: 'INCOME',
              amount: transaction.amount,
              description: `Retrait d'épargne: ${transaction.description}`,
              date: transaction.date,
              category: 'Retrait d\'épargne'
            });
    
            if (success) {
              this.dismiss(true);
            }
          }
          // Pour un ajout à l'épargne ou une transaction normale
          else {
            const success = await this.transactionService.addTransaction(transaction);
            if (success) {
              this.dismiss(true);
            }
          }
        } catch (error) {
          console.error('Erreur:', error);
        }
      }
    }

  dismiss(refresh = false) {
    this.modalController.dismiss(refresh);
  }
}