import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonApp, IonRouterOutlet, IonContent, IonItem, IonIcon, IonList, IonLabel, IonHeader, IonToolbar, IonTitle, IonMenu, IonSplitPane, IonMenuToggle} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { card, cash, home, save, settings, grid, information, people } from 'ionicons/icons';
import { SqliteService } from './core/services/sqlite.service';
import { ContactService } from './core/services/contact.service';
import { TransactionService } from './core/services/transaction.service';
import { LoanService } from './core/services/loan.service';
import { Platform } from '@ionic/angular';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonSplitPane, IonTitle, IonToolbar, IonHeader, IonLabel, IonList, IonIcon, IonItem, IonContent, IonApp, IonRouterOutlet, RouterModule, IonMenu, IonMenuToggle],
})
export class AppComponent {
  loading = true;
  

  constructor(private sqliteService: SqliteService, private contactService: ContactService, private transactionService: TransactionService, private loanService: LoanService,private platform: Platform) {
    addIcons({grid,cash,card,save,people,settings,information,home});
    this.initializeApp();
    this.platform.backButton.subscribeWithPriority(0, () => {
      this.handleBackButton();
    });
  }
  async initializeApp() {
    try {
      // Initialiser SQLite de manière asynchrone
      const db = await this.sqliteService.initializeDatabase();
      
      // Charger les données essentielles en parallèle
      await Promise.all([
        this.contactService.loadContacts(),
        this.transactionService.loadTransactions(),
        this.loanService.loadLoans()
      ]);
      
      this.loading = false;
    } catch (error) {
      console.error('Erreur initialisation:', error);
      this.loading = false;
    }
  }

  async handleBackButton() {
    // Si on est sur la page racine
    if (window.location.pathname === '/dashboard') {
      const alert = document.createElement('ion-alert');
      alert.header = 'Confirmation';
      alert.message = 'Voulez-vous quitter l\'application?';
      alert.buttons = [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Quitter',
          handler: () => {
            App.exitApp();
          }
        }
      ];

      document.body.appendChild(alert);
      await alert.present();
    }
  }
}
