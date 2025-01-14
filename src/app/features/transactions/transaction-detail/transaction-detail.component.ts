// src/app/features/transactions/transaction-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TransactionModel } from 'src/app/core/models/transaction.model';
import { TransactionService } from 'src/app/core/services/transaction.service';
import { TRANSACTION_CATEGORIES } from 'src/app/core/constants/transaction.constant';
import { TransactionType } from 'src/app/core/interfaces/transaction.interface';
import { addIcons } from 'ionicons';
import { create, trash, close} from 'ionicons/icons';

@Component({
  selector: 'app-transaction-detail',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ isEditing ? 'Modifier' : 'Détails' }} Transaction</ion-title>
        <ion-buttons slot="end">
          <ion-button *ngIf="!isEditing" (click)="toggleEdit()">
            <ion-icon name="create"></ion-icon>
          </ion-button>
          <ion-button *ngIf="!isEditing" color="danger" (click)="confirmDelete()">
            <ion-icon name="trash"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ng-container *ngIf="!isEditing">
        <ion-list>
          <ion-item>
            <ion-label>
              <h2>Montant</h2>
              <p>{{ transaction.amount | currency:'XAF':'symbol':'1.0-0' }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Type</h2>
              <p>{{ transaction.type }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Description</h2>
              <p>{{ transaction.description }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Catégorie</h2>
              <p>{{ transaction.category }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h2>Date</h2>
              <p>{{ transaction.date | date:'medium' }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </ng-container>

      <form *ngIf="isEditing" [formGroup]="editForm" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="stacked">Type</ion-label>
          <ion-select formControlName="type" (ionChange)="onTypeChange()">
            <ion-select-option value="INCOME">Entrée</ion-select-option>
            <ion-select-option value="EXPENSE">Sortie</ion-select-option>
            <ion-select-option value="SAVINGS">Épargne</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Montant</ion-label>
          <ion-input type="number" formControlName="amount"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Description</ion-label>
          <ion-input type="text" formControlName="description"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Catégorie</ion-label>
          <ion-select formControlName="category">
            <ion-select-option *ngFor="let cat of categories" [value]="cat">
              {{ cat }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-button expand="block" type="submit" [disabled]="!editForm.valid" class="ion-margin-top">
          Enregistrer
        </ion-button>
        
        <ion-button expand="block" type="button" (click)="toggleEdit()" color="medium" class="ion-margin-top">
          Annuler
        </ion-button>
      </form>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class TransactionDetailComponent implements OnInit {
  transaction!: TransactionModel;
  isEditing = false;
  editForm: FormGroup;
  categories: string[] = [];
  

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private transactionService: TransactionService,
    private fb: FormBuilder
  ) {
    addIcons({trash, create, close});
    
    this.editForm = this.fb.group({
      type: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      category: ['']
    });
  }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.editForm.patchValue({
      type: this.transaction.type,
      amount: this.transaction.amount,
      description: this.transaction.description,
      category: this.transaction.category
    });
    this.onTypeChange();
  }

  onTypeChange() {
    const type = this.editForm.get('type')?.value as Extract<TransactionType, 'INCOME' | 'EXPENSE' | 'SAVINGS'>;
    if (type && type in TRANSACTION_CATEGORIES) {
      this.categories = TRANSACTION_CATEGORIES[type];
    } else {
      this.categories = [];
    }
  }


  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.initializeForm();
    }
  }

  async onSubmit() {
    if (this.editForm.valid) {
      try {
        await this.transactionService.updateTransaction({
          ...this.editForm.value,
          id: this.transaction.id,
          date: this.transaction.date
        });
        this.dismiss(true);
      } catch (error) {
        console.error('Erreur mise à jour:', error);
      }
    }
  }

  async confirmDelete() {
    const alert = await this.alertController.create({
      header: 'Confirmation',
      message: 'Voulez-vous supprimer cette transaction ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          handler: () => this.deleteTransaction()
        }
      ]
    });
    await alert.present();
  }

  private async deleteTransaction() {
    try {
      await this.transactionService.removeTransaction(this.transaction.id!);
      this.dismiss(true);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  }

  dismiss(refresh = false) {
    this.modalController.dismiss({
      refresh: refresh
    });
  }
}