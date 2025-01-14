// contacts.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, warning, call, logoWhatsapp, chatbubble, sync } from 'ionicons/icons';
import { CallNumber } from 'capacitor-call-number';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ContactModel } from 'src/app/core/models/contact.model';
import { ContactService } from 'src/app/core/services/contact.service';
import { LoanService } from 'src/app/core/services/loan.service';
import { NewContactComponent } from '../contact/contact.component';
import { ContactDetailComponent } from '../contact-detail/contact-detail.component';

@Component({
  selector: 'app-contacts',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Contacts</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openNewContactModal()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [(ngModel)]="searchTerm"
          (ionInput)="handleSearch($event)"
          placeholder="Rechercher un contact..."
          [debounce]="500"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Contacts avec alertes -->
      <ion-list *ngIf="alertContacts.length > 0">
        <ion-list-header color="danger">
          <ion-label>Contacts avec prêts à risque</ion-label>
        </ion-list-header>

        <ion-item *ngFor="let contact of alertContacts" (click)="viewContactDetails(contact)">
          <ion-icon name="warning" color="danger" slot="start"></ion-icon>
          <ion-label>
            <h2>{{ contact.name }}</h2>
            <p *ngIf="contact.phone">{{ contact.phone }}</p>
          </ion-label>
          <ion-note slot="end" color="danger">
            < 10% remboursé
          </ion-note>
        </ion-item>
      </ion-list>

      <!-- Liste principale des contacts -->
      <ion-list>
        <ion-item *ngFor="let contact of contacts; trackBy: trackByFn" (click)="viewContactDetails(contact)">
          <ion-label>
            <h2>{{ contact.name }}</h2>
            <p *ngIf="contact.phone">{{ contact.phone }}</p>
          </ion-label>
          
          <ion-buttons slot="end">
            <ion-button (click)="openActionSheet(contact, $event)">
              <ion-icon name="ellipsis-vertical"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>

      <ion-infinite-scroll (ionInfinite)="loadMoreContacts($event)">
        <ion-infinite-scroll-content></ion-infinite-scroll-content>
      </ion-infinite-scroll>

      <!-- Spinner de chargement -->
      <div class="ion-text-center" *ngIf="isLoading">
        <ion-spinner name="circular"></ion-spinner>
      </div>

      <!-- Message si aucun contact -->
      <div class="ion-text-center ion-padding" *ngIf="contacts.length === 0 && !isLoading">
        <p>Aucun contact trouvé</p>
      </div>

      <!-- FAB pour synchronisation -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="syncContacts()">
          <ion-icon name="sync"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ContactsComponent implements OnInit {
  contacts: ContactModel[] = [];
  alertContacts: ContactModel[] = [];
  isLoading = false;
  searchTerm = '';
  pageSize = 20;
  currentPage = 0;
  private searchSubject = new BehaviorSubject<string>('');

  constructor(
    private contactService: ContactService,
    private loanService: LoanService,
    private modalController: ModalController,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    addIcons({ add, warning, call, logoWhatsapp, chatbubble, sync });
  }

  ngOnInit() {
    this.initializeSearch();
    this.loadContacts();
  }

  private initializeSearch() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.currentPage = 0;
      this.loadContacts(true);
    });
  }

  async loadContacts(reset = false) {
    if (reset) {
      this.contacts = [];
      this.currentPage = 0;
    }

    this.isLoading = true;
    try {
      let loadedContacts: ContactModel[];
      if (this.searchTerm) {
        loadedContacts = await this.contactService.searchContacts(this.searchTerm);
      } else {
        loadedContacts = await this.contactService.loadPaginatedContacts(this.currentPage, this.pageSize);
      }
      
      if (reset) {
        this.contacts = loadedContacts;
      } else {
        this.contacts = [...this.contacts, ...loadedContacts];
      }

      await this.loadAlertContacts();
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMoreContacts(event: any) {
    this.currentPage++;
    await this.loadContacts();
    event.target.complete();

    // Désactiver infinite scroll s'il n'y a plus de données
    if (this.contacts.length % this.pageSize !== 0) {
      event.target.disabled = true;
    }
  }

  async loadAlertContacts() {
    this.alertContacts = [];
    for (const contact of this.contacts) {
      const loans = await this.loanService.searchLoansByContact(contact.id!);
      const hasRiskyLoan = loans.some(loan => {
        const percentage = loan.getRepaymentPercentage();
        return percentage < 10 && loan.status !== 'COMPLETED';
      });
      if (hasRiskyLoan) {
        this.alertContacts.push(contact);
      }
    }
  }

  handleSearch(event: any) {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }

  async openActionSheet(contact: ContactModel, event: Event) {
    event.stopPropagation();
    const actionSheet = await document.createElement('ion-action-sheet');
    actionSheet.header = 'Actions';
    actionSheet.buttons = [
      {
        text: 'Appeler',
        icon: 'call',
        handler: () => this.callContact(contact)
      },
      {
        text: 'SMS',
        icon: 'chatbubble',
        handler: () => this.sendSMS(contact)
      },
      {
        text: 'WhatsApp',
        icon: 'logo-whatsapp',
        handler: () => this.openWhatsApp(contact)
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

  async callContact(contact: ContactModel) {
    if (!contact.phone) {
      this.showNoPhoneAlert();
      return;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await CallNumber.call({ number: contact.phone, bypassAppChooser: false });
      } catch (error) {
        console.error('Erreur lors de l\'appel:', error);
      }
    } else {
      window.location.href = `tel:${contact.phone}`;
    }
  }

  async sendSMS(contact: ContactModel) {
    if (!contact.phone) {
      this.showNoPhoneAlert();
      return;
    }
    window.location.href = `sms:${contact.phone}`;
  }

  async openWhatsApp(contact: ContactModel) {
    if (!contact.phone) {
      this.showNoPhoneAlert();
      return;
    }
    window.open(`https://wa.me/${contact.phone.replace(/^0/, '237')}`, '_system');
  }

  private async showNoPhoneAlert() {
    const alert = await this.alertController.create({
      header: 'Information manquante',
      message: 'Ce contact n\'a pas de numéro de téléphone',
      buttons: ['OK']
    });
    await alert.present();
  }

  async syncContacts() {
    const loading = await this.loadingController.create({
      message: 'Synchronisation en cours...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      await this.contactService.syncContacts();
      this.currentPage = 0;
      await this.loadContacts(true);
    } finally {
      await loading.dismiss();
    }
  }

  async openNewContactModal() {
    const modal = await this.modalController.create({
      component: NewContactComponent
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        this.currentPage = 0;
        await this.loadContacts(true);
      }
    });

    return await modal.present();
  }

  trackByFn(index: number, contact: ContactModel) {
    return contact.id;
  }

  async viewContactDetails(contact: ContactModel) {
    const modal = await this.modalController.create({
      component: ContactDetailComponent,
      componentProps: {
        contact: contact,
        loans: await this.loanService.searchLoansByContact(contact.id!)
      }
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data?.refresh) {
        await this.loadContacts(true);
      }
    });

    return await modal.present();
  }
}