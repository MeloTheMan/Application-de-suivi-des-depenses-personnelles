import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactModel } from 'src/app/core/models/contact.model';
import { LoanService } from 'src/app/core/services/loan.service';
import { ContactService } from 'src/app/core/services/contact.service';
import { NewContactComponent } from '../../contacts/contact/contact.component';
import { addIcons } from 'ionicons';
import { close, person, search, add } from 'ionicons/icons';
import { ContactSelectorComponent } from 'src/app/shared/components/contact-selector/contact-selector.component';

@Component({
  selector: 'app-new-loan',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Nouveau Prêt/Emprunt</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="loanForm" (ngSubmit)="onSubmit()">
        <!-- Type de transaction -->
        <ion-item lines="full">
          <ion-label position="stacked">Type</ion-label>
          <ion-select formControlName="type" interface="action-sheet">
            <ion-select-option value="GIVEN">Prêt</ion-select-option>
            <ion-select-option value="TAKEN">Emprunt</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Sélection du contact -->
        <ion-item lines="full" class="ion-margin-top" (click)="openContactSelector()">
          <ion-label position="stacked">Contact</ion-label>
          <ion-input 
            readonly 
            [value]="selectedContactName" 
            placeholder="Sélectionner un contact">
          </ion-input>
          <ion-note slot="helper" *ngIf="selectedContactPhone">{{ selectedContactPhone }}</ion-note>
        </ion-item>

        <!-- Montant -->
        <ion-item lines="full" class="ion-margin-top">
          <ion-label position="stacked">Montant</ion-label>
          <ion-input type="number" formControlName="amount"></ion-input>
          <ion-note slot="error" *ngIf="loanForm.get('amount')?.errors?.['required'] && loanForm.get('amount')?.touched">
            Le montant est requis
          </ion-note>
        </ion-item>

        <!-- Taux d'intérêt -->
        <ion-item lines="full">
          <ion-label position="stacked">Taux d'intérêt (%)</ion-label>
          <ion-input type="number" formControlName="interestRate" min="0" max="100"></ion-input>
          <ion-note slot="error" *ngIf="loanForm.get('interestRate')?.errors?.['max']">
            Le taux ne peut pas dépasser 100%
          </ion-note>
        </ion-item>

        <!-- Bouton de soumission -->
        <ion-button expand="block" type="submit" class="ion-margin-top" [disabled]="!loanForm.valid">
          Enregistrer
        </ion-button>
      </form>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class NewLoanComponent implements OnInit {
  loanForm!: FormGroup;
  selectedContactName: string = '';
  selectedContactPhone: string = '';

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
    private modalController: ModalController
  ) {
    addIcons({ close, person, search, add });
    this.initForm();
  }

  private initForm(): void {
    this.loanForm = this.fb.group({
      type: ['GIVEN', Validators.required],
      contactId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      interestRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }

  ngOnInit() {}

  async openContactSelector() {
    const modal = await this.modalController.create({
      component: ContactSelectorComponent,
      breakpoints: [0, 0.5, 0.75],
      initialBreakpoint: 0.75,
      cssClass: 'contact-selector-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        const contact = result.data;
        this.loanForm.get('contactId')?.setValue(contact.id);
        this.selectedContactName = contact.name;
        this.selectedContactPhone = contact.phone;
      }
    });

    await modal.present();
  }

  async onSubmit() {
    if (this.loanForm.valid) {
      try {
        const formValues = this.loanForm.value;
        const loan = {
          contactId: formValues.contactId,
          amount: formValues.amount,
          type: formValues.type,
          date: Date.now(),
          status: 'PENDING' as const,
          interestRate: formValues.interestRate,
          interestAmount: (formValues.amount * formValues.interestRate) / 100,
          totalAmount: formValues.amount + ((formValues.amount * formValues.interestRate) / 100),
          remainingAmount: formValues.amount + ((formValues.amount * formValues.interestRate) / 100)
        };

        await this.loanService.handleLoanTransaction(loan);
        this.dismiss(true);
      } catch (error) {
        console.error('Erreur lors de la création du prêt:', error);
      }
    }
  }

  dismiss(refresh = false) {
    this.modalController.dismiss(refresh);
  }
}