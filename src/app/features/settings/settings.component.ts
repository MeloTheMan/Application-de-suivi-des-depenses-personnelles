// src/app/features/settings/settings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { LocalDriveService } from '../../core/services/local-drive.service';
import { TransactionService } from '../../core/services/transaction.service';
import { LoanService } from '../../core/services/loan.service';
import { addIcons } from 'ionicons';
import { save, download, trash, settings, moon, notifications, cash, cloud, cloudUpload } from 'ionicons/icons';
import { ContactService } from 'src/app/core/services/contact.service';
import { SqliteService } from 'src/app/core/services/sqlite.service';

@Component({
  selector: 'app-settings',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Paramètres</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <!-- Sauvegarde Locale -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Sauvegardes</ion-label>
          </ion-item-divider>

          <ion-item button (click)="exportToLocal()" detail>
            <ion-icon name="save" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>Créer une sauvegarde</h2>
              <p>Sauvegarder vos données localement</p>
            </ion-label>
          </ion-item>

          <ion-item button (click)="showBackupsList1()" detail>
            <ion-icon name="download" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>Gérer les sauvegardes</h2>
              <p>Supprimer des sauvegardes</p>
            </ion-label>
          </ion-item>

          <ion-item button (click)="showBackupsList()" detail>
            <ion-icon name="download" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>Restaurer une sauvegarde</h2>
              <p>Charger une sauvegarde existante</p>
            </ion-label>
          </ion-item>
        </ion-item-group>

        <!-- Paramètres d'affichage -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Affichage</ion-label>
          </ion-item-divider>

          <ion-item>
            <ion-icon name="cash" slot="start"></ion-icon>
            <ion-label>Devise</ion-label>
            <ion-select [(ngModel)]="settings.currency" (ionChange)="saveSetting('currency')">
              <ion-select-option value="XAF">FCFA</ion-select-option>
              <ion-select-option value="EUR">Euro (€)</ion-select-option>
              <ion-select-option value="USD">Dollar ($)</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-icon name="moon" slot="start"></ion-icon>
            <ion-label>Thème sombre</ion-label>
            <ion-toggle [(ngModel)]="settings.darkMode" (ionChange)="toggleDarkMode()"></ion-toggle>
          </ion-item>
        </ion-item-group>

        <!-- Notifications -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Notifications</ion-label>
          </ion-item-divider>

          <ion-item>
            <ion-icon name="notifications" slot="start"></ion-icon>
            <ion-label>Alertes de dépenses</ion-label>
            <ion-toggle [(ngModel)]="settings.expenseAlerts" (ionChange)="saveSetting('expenseAlerts')"></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-icon name="notifications" slot="start"></ion-icon>
            <ion-label>Rappels de prêts</ion-label>
            <ion-toggle [(ngModel)]="settings.loanReminders" (ionChange)="saveSetting('loanReminders')"></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-icon name="notifications" slot="start"></ion-icon>
            <ion-label>Objectifs d'épargne</ion-label>
            <ion-toggle [(ngModel)]="settings.savingsGoals" (ionChange)="saveSetting('savingsGoals')"></ion-toggle>
          </ion-item>
        </ion-item-group>

        <!-- Version -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>À propos</ion-label>
          </ion-item-divider>
          
          <ion-item>
            <ion-icon name="settings" slot="start"></ion-icon>
            <ion-label>
              <h2>Version</h2>
              <p>1.0.0</p>
            </ion-label>
          </ion-item>
        </ion-item-group>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    ion-item-divider {
      --background: var(--ion-color-light);
      --color: var(--ion-color-medium);
      text-transform: uppercase;
      font-size: 0.8em;
      letter-spacing: 1px;
    }
    
    ion-icon {
      color: var(--ion-color-medium);
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SettingsComponent implements OnInit {
  settings = {
    currency: 'XAF',
    darkMode: false,
    expenseAlerts: true,
    loanReminders: true,
    savingsGoals: true
  };

  constructor(
    private localDriveService: LocalDriveService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private transactionService: TransactionService,
    private loanService: LoanService,
    private contactService: ContactService,
    private sqliteService: SqliteService
  ) {
    addIcons({ save, download, trash, settings, moon, notifications, cash, cloudUpload });
  }

  ngOnInit() {
    this.loadSettings();
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      this.applyTheme();
    }
  }

  saveSetting(key: keyof typeof this.settings) {
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark', this.settings.darkMode);
    this.saveSetting('darkMode');
  }

  private applyTheme() {
    document.body.classList.toggle('dark', this.settings.darkMode);
  }

  private async collectBackupData() {
    try {
      const transactions = await this.transactionService.loadTransactions();
      const loans = await this.loanService.loadLoans();
      const contacts = await this.contactService.loadContacts();
      
      return {
        transactions,
        loans,
        contacts,
        settings: this.settings,
        backupDate: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Erreur lors de la collecte des données:', error);
      throw new Error('Impossible de récupérer les données à sauvegarder');
    }
  }

  async exportToLocal() {
    const loading = await this.loadingCtrl.create({
      message: 'Sauvegarde en cours...'
    });
    await loading.present();

    try {
      const dataToBackup = await this.collectBackupData();
      const fileName = await this.localDriveService.exportData(dataToBackup);
      
      await loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Succès',
        message: `Sauvegarde créée avec succès\nFichier: ${fileName}`,
        buttons: ['OK']
      });
      await alert.present();
    } catch (error) {
      await loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Erreur',
        message: 'Impossible de créer la sauvegarde. Veuillez réessayer.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async showBackupsList1() {
    const loading = await this.loadingCtrl.create({
      message: 'Chargement des sauvegardes...'
    });
    await loading.present();

    try {
      const backups = await this.localDriveService.listBackups();
      await loading.dismiss();

      if (backups.length === 0) {
        const alert = await this.alertCtrl.create({
          header: 'Information',
          message: 'Aucune sauvegarde disponible',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }

      const alert = await this.alertCtrl.create({
        header: 'Sauvegardes disponibles',
        inputs: backups.map((backup, index) => ({
          type: 'radio',
          label: `${new Date(backup.mtime).toLocaleString()}`,
          value: backup.name,
          checked: index === 0
        })),
        buttons: [
          {
            text: 'Supprimer',
            handler: (fileName) => {
              if (fileName) this.deleteBackup(fileName);
            }
          },
          /*{
            text: 'Restaurer',
            handler: (fileName) => {
              if (fileName) this.restoreBackup(fileName);
            }
          },*/
          {
            text: 'Annuler',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
    } catch (error) {
      await loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Erreur',
        message: 'Impossible de charger les sauvegardes',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  private async deleteBackup(fileName: string) {
    const confirm = await this.alertCtrl.create({
      header: 'Confirmation',
      message: 'Voulez-vous vraiment supprimer cette sauvegarde ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Suppression en cours...'
            });
            await loading.present();

            try {
              await this.localDriveService.deleteBackup(fileName);
              await loading.dismiss();
              const alert = await this.alertCtrl.create({
                header: 'Succès',
                message: 'Sauvegarde supprimée avec succès',
                buttons: ['OK']
              });
              await alert.present();
            } catch (error) {
              await loading.dismiss();
              const alert = await this.alertCtrl.create({
                header: 'Erreur',
                message: 'Impossible de supprimer la sauvegarde',
                buttons: ['OK']
              });
              await alert.present();
            }
          }
        }
      ]
    });
    await confirm.present();
  }

  /*private async restoreBackup(fileName: string) {
    const confirm = await this.alertCtrl.create({
      header: 'Confirmation',
      message: 'Cette action remplacera toutes vos données actuelles. Continuer ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Continuer',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Restauration en cours...'
            });
            await loading.present();

            try {
              const data = await this.localDriveService.importData(fileName);
              // Implémenter la logique de restauration ici
              await loading.dismiss();
              
              const alert = await this.alertCtrl.create({
                header: 'Succès',
                message: 'Restauration terminée avec succès',
                buttons: ['OK']
              });
              await alert.present();
            } catch (error) {
              await loading.dismiss();
              const alert = await this.alertCtrl.create({
                header: 'Erreur',
                message: 'Impossible de restaurer la sauvegarde',
                buttons: ['OK']
              });
              await alert.present();
            }
          }
        }
      ]
    });
    await confirm.present();
  }*/

  async importBackup() {
    const confirm = await this.alertCtrl.create({
      header: 'Confirmation',
      message: 'Cette action remplacera toutes vos données actuelles. Continuer ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Continuer',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Restauration en cours...'
            });
            await loading.present();

            try {
              const data = await this.localDriveService.pickAndImportBackup();
              await this.restoreData(data);
              
              await loading.dismiss();
              await this.showSuccessAlert('Restauration terminée avec succès');
            } catch (error) {
              await loading.dismiss();
              await this.showErrorAlert('Impossible de restaurer la sauvegarde');
            }
          }
        }
      ]
    });
    await confirm.present();
  }

  /*private async restoreData(data: any) {
    const queries = [];

    // Nettoyer les tables existantes
    queries.push(
      { query: 'DELETE FROM transactions', params: [] },
      { query: 'DELETE FROM contacts', params: [] },
      { query: 'DELETE FROM loans', params: [] }
    );

    // Restaurer les contacts
    for (const contact of data.contacts) {
      queries.push({
        query: 'INSERT INTO contacts (id, name, phone) VALUES (?, ?, ?)',
        params: [contact.id, contact.name, contact.phone]
      });
    }

    // Restaurer les transactions
    for (const transaction of data.transactions) {
      queries.push({
        query: `INSERT INTO transactions 
                (id, type, amount, description, date, category) 
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [
          transaction.id,
          transaction.type,
          transaction.amount,
          transaction.description,
          transaction.date,
          transaction.category
        ]
      });
    }

    // Restaurer les prêts
    for (const loan of data.loans) {
      queries.push({
        query: `INSERT INTO loans 
                (id, contact_id, amount, remaining_amount, type, date, 
                 status, interest_rate, interest_amount, total_amount) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          loan.id,
          loan.contactId,
          loan.amount,
          loan.remainingAmount,
          loan.type,
          loan.date,
          loan.status,
          loan.interestRate,
          loan.interestAmount,
          loan.totalAmount
        ]
      });
    }

    // Exécuter toutes les requêtes dans une transaction
    await this.sqliteService.executeTransaction(queries);

    // Restaurer les paramètres
    if (data.settings) {
      this.settings = { ...this.settings, ...data.settings };
      localStorage.setItem('appSettings', JSON.stringify(this.settings));
      this.applyTheme();
    }

    // Recharger les données
    await Promise.all([
      this.transactionService.loadTransactions(),
      this.contactService.loadContacts(),
      this.loanService.loadLoans()
    ]);
  }*/

  private async showSuccessAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Succès',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Erreur',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showBackupsList() {
    const loading = await this.loadingCtrl.create({
      message: 'Chargement des sauvegardes...'
    });
    await loading.present();

    try {
      const backups = await this.localDriveService.listBackups();
      await loading.dismiss();

      if (backups.length === 0) {
        await this.showAlert('Information', 'Aucune sauvegarde disponible');
        return;
      }

      const alert = await this.alertCtrl.create({
        header: 'Sélectionner une sauvegarde',
        inputs: backups.map(backup => ({
          type: 'radio',
          label: new Date(backup.mtime).toLocaleString(),
          value: backup.name
        })),
        buttons: [
          {
            text: 'Restaurer',
            handler: (fileName) => this.confirmAndRestore(fileName)
          },
          {
            text: 'Annuler',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
    } catch (error) {
      await loading.dismiss();
      await this.showAlert('Erreur', 'Impossible de charger les sauvegardes');
    }
  }

  private async confirmAndRestore(fileName: string) {
    const confirm = await this.alertCtrl.create({
      header: 'Confirmation',
      message: 'Cette action remplacera toutes vos données actuelles. Continuer ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Continuer',
          handler: () => this.restoreBackup(fileName)
        }
      ]
    });
    await confirm.present();
  }

  private async restoreBackup(fileName: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Restauration en cours...'
    });
    await loading.present();

    try {
      const data = await this.localDriveService.importData(fileName);
      await this.restoreData(data);
      await loading.dismiss();
      await this.showAlert('Succès', 'Restauration terminée avec succès');
    } catch (error) {
      await loading.dismiss();
      await this.showAlert('Erreur', 'Impossible de restaurer la sauvegarde');
    }
  }

  private async restoreData(data: any) {
    const queries = [];

    // Nettoyage des tables
    queries.push(
      { query: 'DELETE FROM transactions', params: [] },
      { query: 'DELETE FROM contacts', params: [] },
      { query: 'DELETE FROM loans', params: [] }
    );

    // Restauration des contacts
    data.contacts?.forEach((contact: { id: any; name: any; phone: any; }) => {
      queries.push({
        query: 'INSERT INTO contacts (id, name, phone) VALUES (?, ?, ?)',
        params: [contact.id, contact.name, contact.phone]
      });
    });

    // Restauration des transactions
    data.transactions?.forEach((transaction: { id: any; type: any; amount: any; description: any; date: any; category: any; }) => {
      queries.push({
        query: `INSERT INTO transactions 
                (id, type, amount, description, date, category)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [
          transaction.id,
          transaction.type,
          transaction.amount,
          transaction.description,
          transaction.date,
          transaction.category
        ]
      });
    });

    // Restauration des prêts
    data.loans?.forEach((loan: { id: any; contactId: any; amount: any; remainingAmount: any; type: any; date: any; status: any; interestRate: any; interestAmount: any; totalAmount: any; }) => {
      queries.push({
        query: `INSERT INTO loans 
                (id, contact_id, amount, remaining_amount, type, date,
                 status, interest_rate, interest_amount, total_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          loan.id,
          loan.contactId,
          loan.amount,
          loan.remainingAmount,
          loan.type,
          loan.date,
          loan.status,
          loan.interestRate,
          loan.interestAmount,
          loan.totalAmount
        ]
      });
    });

    // Exécution des requêtes
    await this.sqliteService.executeTransaction(queries);

    // Restauration des paramètres
    if (data.settings) {
      this.settings = { ...this.settings, ...data.settings };
      localStorage.setItem('appSettings', JSON.stringify(this.settings));
      this.applyTheme();
    }

    // Rechargement des données
    await Promise.all([
      this.transactionService.loadTransactions(),
      this.contactService.loadContacts(),
      this.loanService.loadLoans()
    ]);
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}