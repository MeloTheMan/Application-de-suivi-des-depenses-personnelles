// src/app/features/contacts/contact-detail/contact-detail.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactModel } from 'src/app/core/models/contact.model';
import { LoanModel } from 'src/app/core/models/loan.model';
import { ContactService } from 'src/app/core/services/contact.service';
import { CallNumber } from 'capacitor-call-number';
import { Capacitor } from '@capacitor/core';
import { LoanDetailComponent } from '../../loans/loan-detail/loan-detail.component';
import { addIcons } from 'ionicons';
import { call, chatbubble, close, create, logoWhatsapp, trash } from 'ionicons/icons';

@Component({
  selector: 'app-contact-detail',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ isEditing ? 'Modifier' : 'Détails' }} Contact</ion-title>
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
        <!-- Informations de contact -->
        <ion-list>
          <ion-item>
            <ion-label>
              <h2>Nom</h2>
              <p>{{ contact.name }}</p>
            </ion-label>
          </ion-item>

          <ion-item *ngIf="contact.hasPhoneNumber()">
            <ion-label>
              <h2>Téléphone</h2>
              <p>{{ contact.phone }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Actions de communication -->
        <ion-grid>
          <ion-row>
            <ion-col>
              <ion-button expand="block" (click)="callContact()" [disabled]="!contact.hasPhoneNumber()">
                <ion-icon name="call" slot="start"></ion-icon>
                Appeler
              </ion-button>
            </ion-col>
            <ion-col>
              <ion-button expand="block" (click)="sendSMS()" [disabled]="!contact.hasPhoneNumber()">
                <ion-icon name="chatbubble" slot="start"></ion-icon>
                SMS
              </ion-button>
            </ion-col>
            <ion-col>
              <ion-button expand="block" (click)="openWhatsApp()" [disabled]="!contact.hasPhoneNumber()">
                <ion-icon name="logo-whatsapp" slot="start"></ion-icon>
                WhatsApp
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Résumé des prêts -->
        <ion-list-header class="ion-margin-top">
          <ion-label>Résumé des prêts</ion-label>
        </ion-list-header>

        <ion-card class="ion-margin" *ngIf="loans && loans.length > 0">
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col>
                  <div class="stat-label">Prêts accordés</div>
                  <div class="stat-value success">
                    {{ getTotalGivenLoans() | currency:'XAF':'symbol':'1.0-0' }}
                  </div>
                </ion-col>
                <ion-col>
                  <div class="stat-label">Emprunts reçus</div>
                  <div class="stat-value danger">
                    {{ getTotalTakenLoans() | currency:'XAF':'symbol':'1.0-0' }}
                  </div>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col>
                  <div class="stat-label">Restant à recevoir</div>
                  <div class="stat-value warning">
                    {{ getRemainingGivenLoans() | currency:'XAF':'symbol':'1.0-0' }}
                  </div>
                </ion-col>
                <ion-col>
                  <div class="stat-label">Restant à payer</div>
                  <div class="stat-value warning">
                    {{ getRemainingTakenLoans() | currency:'XAF':'symbol':'1.0-0' }}
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Historique des prêts -->
        <ion-list-header>
          <ion-label>Historique des prêts</ion-label>
        </ion-list-header>

        <ion-list *ngIf="loans && loans.length > 0">
          <ion-item *ngFor="let loan of loans" (click)="viewLoanDetails(loan)">
            <ion-label>
              <h2>{{ loan.type === 'GIVEN' ? 'Prêt accordé' : 'Emprunt reçu' }}</h2>
              <p>{{ loan.date | date:'medium' }}</p>
            </ion-label>
            <ion-note slot="end" [color]="getLoanStatusColor(loan)">
              {{ loan.getRemainingAmount() | currency:'XAF':'symbol':'1.0-0' }}
              <p>sur {{ loan.getTotalAmount() | currency:'XAF':'symbol':'1.0-0' }}</p>
            </ion-note>
          </ion-item>
        </ion-list>

        <div *ngIf="!loans || loans.length === 0" class="ion-text-center ion-padding">
          <p>Aucun prêt ou emprunt pour ce contact</p>
        </div>
      </ng-container>

      <form *ngIf="isEditing" [formGroup]="editForm" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="stacked">Nom</ion-label>
          <ion-input type="text" formControlName="name"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Téléphone</ion-label>
          <ion-input type="tel" formControlName="phone"></ion-input>
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
    .stat-label {
      font-size: 0.9em;
      color: var(--ion-color-medium);
    }
    .stat-value {
      font-size: 1.2em;
      font-weight: bold;
    }
    .success { color: var(--ion-color-success); }
    .danger { color: var(--ion-color-danger); }
    .warning { color: var(--ion-color-warning); }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class ContactDetailComponent implements OnInit {
  @Input() contact!: ContactModel;
  @Input() loans: LoanModel[] = [];
  isEditing = false;
  editForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private contactService: ContactService,
    private fb: FormBuilder
  ) {
    addIcons({ call, chatbubble, logoWhatsapp, trash, create, close });
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.pattern('^[0-9]{9}$')]]
    });
  }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.editForm.patchValue({
      name: this.contact.name,
      phone: this.contact.phone
    });
  }

  // Calculs des totaux
  getTotalGivenLoans(): number {
    return this.loans
      .filter(loan => loan.type === 'GIVEN')
      .reduce((total, loan) => total + loan.amount, 0);
  }

  getTotalTakenLoans(): number {
    return this.loans
      .filter(loan => loan.type === 'TAKEN')
      .reduce((total, loan) => total + loan.amount, 0);
  }

  getRemainingGivenLoans(): number {
    return this.loans
      .filter(loan => loan.type === 'GIVEN')
      .reduce((total, loan) => total + loan.remainingAmount, 0);
  }

  getRemainingTakenLoans(): number {
    return this.loans
      .filter(loan => loan.type === 'TAKEN')
      .reduce((total, loan) => total + loan.remainingAmount, 0);
  }

  getLoanStatusColor(loan: LoanModel): string {
    const percentage = loan.getRepaymentPercentage();
    if (percentage < 10) return 'danger';
    if (percentage < 50) return 'warning';
    return 'success';
  }

  // Actions de communication
  async callContact() {
    if (!this.contact.phone) return;

    if (Capacitor.isNativePlatform()) {
      try {
        await CallNumber.call({ number: this.contact.phone, bypassAppChooser: false });
      } catch (error) {
        console.error('Erreur lors de l\'appel:', error);
      }
    } else {
      window.location.href = `tel:${this.contact.phone}`;
    }
  }

  sendSMS() {
    if (!this.contact.phone) return;
    window.location.href = `sms:${this.contact.phone}`;
  }

  openWhatsApp() {
    if (!this.contact.phone) return;
    window.open(`https://wa.me/${this.contact.phone.replace(/^0/, '237')}`, '_system');
  }

  // Gestion du formulaire
  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.initializeForm();
    }
  }

  async onSubmit() {
    if (this.editForm.valid) {
      try {
        await this.contactService.updateContact({
          ...this.editForm.value,
          id: this.contact.id
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
      message: 'Voulez-vous supprimer ce contact ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          handler: () => this.deleteContact()
        }
      ]
    });
    await alert.present();
  }

  private async deleteContact() {
    try {
      if (this.contact.id) {
        await this.contactService.removeContact(this.contact.id);
      }
      this.dismiss(true);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  }

  async viewLoanDetails(loan: LoanModel) {
    const modal = await this.modalController.create({
      component: LoanDetailComponent,
      componentProps: {
        loan: loan
      }
    });

    return await modal.present();
  }

  dismiss(refresh = false) {
    this.modalController.dismiss({
      refresh: refresh
    });
  }
}