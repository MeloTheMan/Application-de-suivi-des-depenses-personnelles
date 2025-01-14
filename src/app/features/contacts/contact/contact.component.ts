import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactService } from 'src/app/core/services/contact.service';

@Component({
  selector: 'app-new-contact',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Nouveau Contact</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="floating">Nom</ion-label>
          <ion-input type="text" formControlName="name"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Téléphone</ion-label>
          <ion-input type="tel" formControlName="phone"></ion-input>
        </ion-item>

        <ion-button expand="block" type="submit" [disabled]="!contactForm.valid" class="ion-margin">
          Enregistrer
        </ion-button>
      </form>

      <ion-button expand="block" color="secondary" class="ion-margin" (click)="synchronizeContacts()">
        Synchroniser avec le téléphone
      </ion-button>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class NewContactComponent {
  contactForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.pattern('^[0-9]{9}$')]]
    });
  }

  async onSubmit() {
    if (this.contactForm.valid) {
      try {
        await this.contactService.addContact(this.contactForm.value);
        this.dismiss(true);
      } catch (error) {
        console.error('Erreur lors de l\'ajout du contact:', error);
      }
    }
  }
  
  async synchronizeContacts() {
    try {
      await this.contactService.syncContacts();
      this.dismiss(true);
    } catch (error) {
      console.error('Erreur lors de la synchronisation des contacts:', error);
    }
  }

  

  dismiss(refresh = false) {
    this.modalController.dismiss(refresh);
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
    });
    toast.present();
  }
}
