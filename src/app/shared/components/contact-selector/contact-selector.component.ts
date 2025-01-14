import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ContactService } from 'src/app/core/services/contact.service';
import { ContactModel } from 'src/app/core/models/contact.model';
import { NewContactComponent } from 'src/app/features/contacts/contact/contact.component';
import {IonSkeletonText, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonButton, IonSearchbar, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
@Component({
  selector: 'app-contact-selector',
  templateUrl:'contact-selector.component.html',
  styleUrls: ['contact-selector.component.scss'],
  standalone: true,
  imports: [ CommonModule, IonSkeletonText, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonButton, IonSearchbar, IonList, IonItem, IonLabel ]
})
export class ContactSelectorComponent implements OnInit {
  filteredContacts: ContactModel[] = [];
  isSearching = false;
  loading = true;

  constructor(
    private contactService: ContactService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.loadContacts();
  }

  /*async loadContacts() {
    try {
      const contacts = await this.contactService.loadContacts();
      if (contacts) {
        this.filteredContacts = contacts;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
    }
  }*/

  async handleSearch(event: any) {
    const searchTerm = event.target.value?.toLowerCase().trim();
    this.isSearching = true;
    
    try {
      if (!searchTerm) {
        this.clearSearch();
        return;
      }
      this.filteredContacts = await this.contactService.searchContacts(searchTerm);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      this.isSearching = false;
    }
  }

  clearSearch() {
    this.isSearching = false;
    this.loadContacts();
  }

  async openNewContactModal() {
    const modal = await this.modalController.create({
      component: NewContactComponent
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        await this.loadContacts();
      }
    });

    return await modal.present();
  }

  async loadContacts() {
    this.loading = true;
    try {
      const contacts = await this.contactService.loadContacts();
      if (contacts) {
        this.filteredContacts = contacts;
      }
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    } finally {
      this.loading = false;
    }
  }

  selectContact(contact: ContactModel) {
    this.modalController.dismiss(contact);
  }

  dismiss() {
    this.modalController.dismiss();
  }
}