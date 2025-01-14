import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LoanService } from '../../core/services/loan.service';
import { LoanModel } from '../../core/models/loan.model';
import { ModalController } from '@ionic/angular';
import { NewLoanComponent } from './new-loan/new-loan.component';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { create, add } from 'ionicons/icons';
import { LoanDetailComponent } from './loan-detail/loan-detail.component';
import { ContactModel } from 'src/app/core/models/contact.model';
import { ContactService } from 'src/app/core/services/contact.service';

@Component({
  selector: 'app-loans',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Prêts & Emprunts</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openNewLoanModal()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [(ngModel)]="searchTerm"
          (ionInput)="handleSearch($event)"
          placeholder="Rechercher un prêt..."
          debounce="300"
        ></ion-searchbar>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="selectedSegment" (ionChange)="filterLoans()">
          <ion-segment-button value="GIVEN">
            <ion-label>Prêts</ion-label>
          </ion-segment-button>
          <ion-segment-button value="TAKEN">
            <ion-label>Emprunts</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item *ngIf="activeLoans.length === 0 && completedLoans.length === 0">
          <ion-label>
            Aucun prêt trouvé
          </ion-label>
        </ion-item>

        <ion-item-group *ngIf="activeLoans.length > 0">
          <ion-item-divider>
            <ion-label>En cours</ion-label>
          </ion-item-divider>
          <ion-item *ngFor="let loan of activeLoans" (click)="viewLoanDetails(loan)">
            <ion-label>
              <h2>{{ getContactName(loan.contactId) }}</h2>
              <p>{{ loan.date | date:'shortDate' }}</p>
            </ion-label>
            <ion-note slot="end" [color]="getLoanStatusColor(loan)">
              {{ loan.remainingAmount | currency:'XAF':'symbol':'1.0-0' }}
              <p>sur {{ loan.totalAmount | currency:'XAF':'symbol':'1.0-0' }}</p>
            </ion-note>
          </ion-item>
        </ion-item-group>

        <ion-item-group *ngIf="completedLoans.length > 0">
          <ion-item-divider>
            <ion-label>Terminés</ion-label>
          </ion-item-divider>
          <ion-item *ngFor="let loan of completedLoans" (click)="viewLoanDetails(loan)">
            <ion-label>
              <h2>{{ getContactName(loan.contactId) }}</h2>
              <p>{{ loan.date | date:'shortDate' }}</p>
            </ion-label>
            <ion-badge color="success" slot="end">100%</ion-badge>
          </ion-item>
        </ion-item-group>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoansComponent implements OnInit {
  selectedSegment: 'GIVEN' | 'TAKEN' = 'GIVEN';
  activeLoans: LoanModel[] = [];
  completedLoans: LoanModel[] = [];
  contacts: ContactModel[] = [];
  searchTerm: string = '';

  constructor(
    private loanService: LoanService,
    private modalController: ModalController,
    private contactService: ContactService
  ) {
    addIcons({ create, add });
  }

  ngOnInit() {
    this.loadContacts();
    this.loadLoans();
  }

  async loadContacts() {
    this.contacts = await this.contactService.loadContacts();
  }

  async handleSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    await this.filterLoans();
  }

  async loadLoans() {
    try {
      this.contacts = await this.contactService.loadContacts();
      const loans = await this.loanService.getLoansNeedingAlert();
      if (loans) {
        this.checkLoanAlerts(loans);
      }
      await this.filterLoans();
    } catch (error) {
      console.error('Erreur lors du chargement des prêts:', error);
    }
  }

  async filterLoans() {
    try {
      const allLoans = await this.loanService.loadLoans();
      if (allLoans) {
        let filteredLoans = allLoans.filter(loan => loan.type === this.selectedSegment);
        
        if (this.searchTerm) {
          filteredLoans = filteredLoans.filter(loan => {
            const contact = this.contacts.find(c => c.id === loan.contactId);
            const contactName = contact ? contact.name.toLowerCase() : '';
            const amount = loan.amount.toString();
            const date = new Date(loan.date).toLocaleDateString();
            
            return contactName.includes(this.searchTerm) ||
                   amount.includes(this.searchTerm) ||
                   date.includes(this.searchTerm);
          });
        }

        this.activeLoans = filteredLoans.filter(loan => !loan.isCompleted());
        this.completedLoans = filteredLoans.filter(loan => loan.isCompleted());
      }
    } catch (error) {
      console.error('Erreur lors du filtrage des prêts:', error);
    }
  }

  getLoanStatusColor(loan: LoanModel): string {
    const percentage = loan.getRepaymentPercentage();
    if (percentage < 10) return 'danger';
    if (percentage < 50) return 'warning';
    return 'success';
  }

  getContactName(contactId: number): string {
    const contact = this.contacts.find(c => c.id === contactId);
    return contact ? contact.name : 'Contact inconnu';
  }

  async checkLoanAlerts(loans: LoanModel[]) {
    for (const loan of loans) {
      if (loan.needsAlert()) {
        const percentage = loan.getRepaymentPercentage();
        if (percentage < 10) {
          await this.presentAlert('Alerte Prêt', 'Un prêt a moins de 10% de remboursement');
        } else if (percentage === 50) {
          await this.presentAlert('Information Prêt', 'Un prêt a atteint 50% de remboursement');
        }
      }
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = document.createElement('ion-alert');
    alert.header = header;
    alert.message = message;
    alert.buttons = ['OK'];

    document.body.appendChild(alert);
    await alert.present();
  }

  async openNewLoanModal() {
    const modal = await this.modalController.create({
      component: NewLoanComponent
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.loadLoans();
      }
    });

    return await modal.present();
  }

  async viewLoanDetails(loan: LoanModel) {
    const modal = await this.modalController.create({
      component: LoanDetailComponent,
      componentProps: {
        loan: loan
      }
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data?.refresh) {
        await this.loadLoans();
      }
    });

    return await modal.present();
  }
}