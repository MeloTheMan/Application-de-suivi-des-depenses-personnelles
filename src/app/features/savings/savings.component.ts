import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionModel } from '../../core/models/transaction.model';
import { addIcons } from 'ionicons';
import { add, arrowDown, arrowUp, cashOutline, close } from 'ionicons/icons';
import { SavingsDetailComponent } from './saving-detail/saving-detail.component';
import { Subscription } from 'rxjs';
import { NewTransactionComponent } from '../transactions/new-transaction/new-transaction.component';

@Component({
  selector: 'app-savings',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Épargne</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onAddSavings()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Total épargné</ion-card-subtitle>
          <ion-card-title>{{ totalSavings | currency:'XAF':'symbol':'1.0-0' }}</ion-card-title>
        </ion-card-header>
      </ion-card>

      <ion-list>
        <ion-list-header>
          <ion-label>Historique des épargnes</ion-label>
        </ion-list-header>

        <ion-item *ngFor="let saving of savings" (click)="viewSavingDetails(saving)">
          <ion-label>
            <h2>{{ saving.description }}</h2>
            <p>{{ saving.date | date:'shortDate' }}</p>
          </ion-label>
          <ion-note slot="end" color="primary">
            {{ saving.amount | currency:'XAF':'symbol':'1.0-0' }}
          </ion-note>
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="onAddSavings1()">
          <ion-icon name="cash-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SavingsComponent implements OnInit {
  savings: TransactionModel[] = [];
  totalSavings: number = 0;
  private subscription!: Subscription;

  constructor(private transactionService: TransactionService, private modalController: ModalController) {
    addIcons({add, cashOutline, arrowUp, arrowDown, close});
  }

  ngOnInit() {
    this.loadSavings();
    this.subscription = this.transactionService.transactions$.subscribe(() => {
      this.loadSavings();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async loadSavings() {
    const savings = await this.transactionService.getTransactionsByType('SAVINGS');
    this.savings = savings;
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalSavings = this.savings.reduce((sum, saving) => sum + saving.amount, 0);
  }

  async loadSavings1() {
    const savings = await this.transactionService.getTransactionsByType('SAVINGS');
    this.savings = savings;
    this.calculateTotal1();
  }

  calculateTotal1() {
    this.totalSavings = this.savings.reduce((sum, saving) => sum + saving.amount, 0);
  }

  async onAddSavings() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Nouvelle Épargne';
    alert.inputs = [
      {
        name: 'amount',
        type: 'number',
        placeholder: 'Montant',
        min: 1
      },
      {
        name: 'description',
        type: 'text',
        placeholder: 'Description'
      }
    ];
    alert.buttons = [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Sauvegarder',
        handler: (data) => {
          if (data.amount && data.description) {
            this.saveSaving(data);
          }
        }
      }
    ];

    document.body.appendChild(alert);
    await alert.present();
  }

  private async saveSaving(data: {amount: number, description: string}) {
    const saving = {
      type: 'SAVINGS' as const,
      amount: data.amount,
      description: data.description,
      date: Date.now(),
      category: 'Épargne générale'
    };

    await this.transactionService.addTransaction(saving);
    await this.loadSavings();
  }

  async viewSavingDetails(saving: TransactionModel) {
    const modal = await this.modalController.create({
      component: SavingsDetailComponent,
      componentProps: {
        saving: saving
      }
    });
  
    modal.onDidDismiss().then(async (result) => {
      if (result.data?.refresh) {
        await this.loadSavings();
      }
    });
  
    return await modal.present();
  }

  
  
  async openNewTransactionModal(direction: 'TO_SAVINGS' | 'FROM_SAVINGS') {
    const modal = await this.modalController.create({
      component: NewTransactionComponent,
      componentProps: {
        savingsDirection: direction
      }
    });
  
    modal.onDidDismiss().then(async (result) => {
      if (result.data?.refresh) {
        await this.loadSavings();
      }
    });
  
    return await modal.present();
  }
  // src/app/features/savings/savings.component.ts
  async onAddSavings1() {
    const actionSheet = await document.createElement('ion-action-sheet');
    actionSheet.header = 'Opération d\'épargne';
    actionSheet.buttons = [
      /*{
        text: 'Ajouter à l\'épargne',
        icon: 'arrow-up',
        handler: () => this.showSavingsPrompt('TO_SAVINGS', 'Nouvelle Épargne')
      },*/
      {
        text: 'Retirer de l\'épargne',
        icon: 'arrow-down',
        handler: () => this.showSavingsPrompt('FROM_SAVINGS', 'Retrait d\'épargne')
      },
      {
        text: 'Annuler',
        icon: 'close',
        role: 'cancel'
      }
    ];
  
    document.body.appendChild(actionSheet);
    await actionSheet.present();
  }
  
  private async showSavingsPrompt(type: 'TO_SAVINGS' | 'FROM_SAVINGS', title: string) {
    const alert = document.createElement('ion-alert');
    alert.header = title;
    alert.inputs = [
      {
        name: 'amount',
        type: 'number',
        placeholder: 'Montant',
        min: 1
      },
      {
        name: 'description',
        type: 'text',
        placeholder: 'Description'
      }
    ];
    alert.buttons = [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Sauvegarder',
        handler: (data) => {
          if (data.amount && data.description) {
            const saving = {
              type: 'SAVINGS' as const,
              amount: data.amount,
              description: data.description,
              date: Date.now(),
              category: type === 'TO_SAVINGS' ? 'Épargne générale' : 'Retrait d\'épargne'
            };
  
            this.transactionService.handleSavingsTransaction(saving, type)
              .then(() => {
                this.loadSavings();
              })
              .catch((error) => {
                console.error('Erreur:', error);
              });
          }
        }
      }
    ];
  
    document.body.appendChild(alert);
    await alert.present();
  }
}