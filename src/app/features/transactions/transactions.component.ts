import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionModel } from '../../core/models/transaction.model';
import { TransactionType } from '../../core/interfaces/transaction.interface';
import { ModalController } from '@ionic/angular';
import { NewTransactionComponent } from './new-transaction/new-transaction.component';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { TransactionDetailComponent } from './transaction-detail/transaction-detail.component';

@Component({
  selector: 'app-transactions',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mes Transactions</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openNewTransactionModal()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [(ngModel)]="searchTerm"
          (ionInput)="handleSearch($event)"
          placeholder="Rechercher une transaction..."
          debounce="300"
        ></ion-searchbar>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="selectedType" (ionChange)="filterTransactions()">
          <ion-segment-button value="INCOME">
            <ion-label>Entrées</ion-label>
          </ion-segment-button>
          <ion-segment-button value="EXPENSE">
            <ion-label>Sorties</ion-label>
          </ion-segment-button>
          <ion-segment-button value="SAVINGS">
            <ion-label>Épargne</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item *ngIf="filteredTransactions.length === 0">
          <ion-label>
            Aucune transaction trouvée
          </ion-label>
        </ion-item>
        <ion-item *ngFor="let transaction of filteredTransactions" (click)="viewTransactionDetails(transaction)">
          <ion-label>
            <h2>{{ transaction.description }}</h2>
            <p>{{ transaction.date | date:'dd/MM/yyyy' }}</p>
            <p *ngIf="transaction.category">{{ transaction.category }}</p>
          </ion-label>
          <ion-note slot="end" [color]="getTransactionColor(transaction)">
            {{ transaction.amount | currency:'XAF':'symbol':'1.0-0' }}
          </ion-note>
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="openNewTransactionModal()">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TransactionsComponent {
  selectedType: TransactionType = 'INCOME';
  filteredTransactions: TransactionModel[] = [];
  searchTerm: string = '';
  
  constructor(
    private transactionService: TransactionService,
    private modalController: ModalController
  ) {
    addIcons({add});
    this.loadTransactions();
  }

  async loadTransactions() {
    if (this.searchTerm) {
      const searchResults = await this.transactionService.searchTransactions(this.searchTerm);
      this.filteredTransactions = searchResults.filter(t => t.type === this.selectedType);
    } else {
      this.filteredTransactions = await this.transactionService.getTransactionsByType(this.selectedType);
    }
  }

  async handleSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    await this.loadTransactions();
  }

  async filterTransactions() {
    await this.loadTransactions();
  }

  getTransactionColor(transaction: TransactionModel): string {
    switch(transaction.type) {
      case 'INCOME': return 'success';
      case 'EXPENSE': return 'danger';
      default: return 'primary';
    }
  }

  async openNewTransactionModal() {
    const modal = await this.modalController.create({
      component: NewTransactionComponent
    });
  
    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.loadTransactions();
      }
    });
  
    return await modal.present();
  }

  async viewTransactionDetails(transaction: TransactionModel) {
    const modal = await this.modalController.create({
      component: TransactionDetailComponent,
      componentProps: {
        transaction: transaction
      }
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data?.refresh) {
        await this.loadTransactions();
      }
    });

    return await modal.present();
  }
}