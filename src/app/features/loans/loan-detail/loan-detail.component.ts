// src/app/features/loans/loan-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoanModel } from 'src/app/core/models/loan.model';
import { ContactModel } from 'src/app/core/models/contact.model';
import { LoanService } from 'src/app/core/services/loan.service';
import { ContactService } from 'src/app/core/services/contact.service';
import { addIcons } from 'ionicons';
import { close, create, trash } from 'ionicons/icons';
import { ContactDetailComponent } from '../../contacts/contact-detail/contact-detail.component';
@Component({
  selector: 'app-loan-detail',
  template: `<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-button (click)="dismiss()">
        <ion-icon name="close"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title>{{ isEditing ? 'Modifier' : 'Détails' }} Prêt</ion-title>
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
          <h2>Contact</h2>
          <ion-button (click)="viewContactDetails(loan.contactId)">{{ getContactName(loan.contactId) }}</ion-button>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-label>
          <h2>Type</h2>
          <p>{{ loan.type === 'GIVEN' ? 'Prêt accordé' : 'Emprunt reçu' }}</p>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-label>
          <h2>Montant initial</h2>
          <p>{{ loan.amount | currency:'XAF':'symbol':'1.0-0' }}</p>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-label>
          <h2>Taux d'intérêt</h2>
          <p>{{ loan.interestRate }}%</p>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-label>
          <h2>Montant des intérêts</h2>
          <p>{{ loan.interestAmount | currency:'XAF':'symbol':'1.0-0' }}</p>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-label>
          <h2>Montant total (avec intérêts)</h2>
          <p>{{ loan.totalAmount | currency:'XAF':'symbol':'1.0-0' }}</p>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-label>
          <h2>Montant restant</h2>
          <p>{{ loan.remainingAmount | currency:'XAF':'symbol':'1.0-0' }}</p>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-label>
          <h2>Statut</h2>
          <p [ngClass]="{
            'text-success': loan.status === 'COMPLETED',
            'text-warning': loan.status === 'PARTIAL',
            'text-danger': loan.status === 'PENDING'
          }">
            {{ loan.status === 'COMPLETED' ? 'Terminé' : 
               loan.status === 'PARTIAL' ? 'Partiellement remboursé' : 'En attente' }}
          </p>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-label>
          <h2>Date</h2>
          <p>{{ loan.date | date:'medium' }}</p>
        </ion-label>
      </ion-item>
    </ion-list>

    <ion-button 
      expand="block" 
      class="ion-margin-top" 
      (click)="openPaymentModal()"
      [disabled]="loan.status === 'COMPLETED'">
      Enregistrer un paiement
    </ion-button>
  </ng-container>

  <form *ngIf="isEditing" [formGroup]="editForm" (ngSubmit)="onSubmit()">
    <ion-item>
      <ion-label position="stacked">Contact</ion-label>
      <ion-select formControlName="contactId">
        <ion-select-option *ngFor="let contact of contacts" [value]="contact.id">
          {{ contact.name }}
        </ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Type</ion-label>
      <ion-select formControlName="type">
        <ion-select-option value="GIVEN">Prêt accordé</ion-select-option>
        <ion-select-option value="TAKEN">Emprunt reçu</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Montant</ion-label>
      <ion-input type="number" formControlName="amount"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Taux d'intérêt (%)</ion-label>
      <ion-input type="number" formControlName="interestRate"></ion-input>
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
styles: [`
.text-success { color: var(--ion-color-success); }
.text-warning { color: var(--ion-color-warning); }
.text-danger { color: var(--ion-color-danger); }
`],
standalone: true,
imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class LoanDetailComponent implements OnInit {
  loan!: LoanModel;
  contacts: ContactModel[] = [];
  isEditing = false;
  editForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private loanService: LoanService,
    private contactService: ContactService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      contactId: ['', Validators.required],
      type: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      interestRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    addIcons({trash, create, close});
  }

  ngOnInit() {
    this.loadContacts();
    this.initializeForm();
  }

  async loadContacts() {
    this.contacts = await this.contactService.loadContacts();
  }

  private initializeForm() {
    this.editForm.patchValue({
      contactId: this.loan.contactId,
      type: this.loan.type,
      amount: this.loan.amount,
      interestRate: this.loan.interestRate
    });
  }

  getContactName(contactId: number): string {
    const contact = this.contacts.find(c => c.id === contactId);
    return contact ? contact.name : 'Contact inconnu';
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
        await this.loanService.updateLoan({
          ...this.editForm.value,
          id: this.loan.id,
          date: this.loan.date,
          status: this.loan.status,
          remainingAmount: this.loan.remainingAmount
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
      message: 'Voulez-vous supprimer ce prêt ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          handler: () => this.deleteLoan()
        }
      ]
    });
    await alert.present();
  }

  private async deleteLoan() {
    try {
      await this.loanService.removeLoan(this.loan.id!);
      this.dismiss(true);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  }

  /*async openPaymentModal() {
    const alert = await this.alertController.create({
      header: 'Enregistrer un paiement',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Montant du paiement',
          min: 0,
          max: this.loan.remainingAmount
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Enregistrer',
          handler: (data) => {
            if (data.amount) {
              this.registerPayment(Number(data.amount));
            }
          }
        }
      ]
    });
    await alert.present();
  }*/

  /*private async registerPayment(amount: number) {
    try {
      const newRemainingAmount = Math.max(0, this.loan.remainingAmount - amount);
      await this.loanService.updateLoanStatus(this.loan.id!, newRemainingAmount);
      this.dismiss(true);
    } catch (error) {
      console.error('Erreur paiement:', error);
    }
  }*/
  async registerPayment(amount: number) {
    try {
      await this.loanService.handleLoanTransaction(this.loan, amount);
      this.dismiss(true);
    } catch (error) {
      console.error('Erreur paiement:', error);
      // Afficher une alerte d'erreur
    }
  }

  dismiss(refresh = false) {
    this.modalController.dismiss({
      refresh: refresh
    });
  }

  async openPaymentModal() {
    const alert = await this.alertController.create({
      header: 'Enregistrer un paiement',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Montant du paiement',
          min: 1,
          max: this.loan.remainingAmount
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Enregistrer',
          handler: (data) => {
            if (data.amount && data.amount <= this.loan.remainingAmount) {
              this.registerPayment(Number(data.amount));
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async viewContactDetails(contactId: number) {
    const contact = await this.contactService.getContact(contactId);
    if (!contact) return;
  
    const loans = await this.loanService.searchLoansByContact(contactId);
  
    const modal = await this.modalController.create({
      component: ContactDetailComponent,
      componentProps: {
        contact: contact,
        loans: loans
      }
    });
  
    modal.onDidDismiss().then(async (result) => {
      if (result.data?.refresh) {
        // Recharger le contact
        const updatedContact = await this.contactService.getContact(contactId);
        // Mettre à jour l'affichage
        if (updatedContact) {
          this.getContactName(contactId); // Forcer la mise à jour du nom
        }
      }
    });
  
    return await modal.present();
  }
}