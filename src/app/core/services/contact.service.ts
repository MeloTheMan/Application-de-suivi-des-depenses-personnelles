import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { Contact } from '../interfaces/contact.interface';
import { ContactModel } from '../models/contact.model';
import { BehaviorSubject } from 'rxjs';
import { Contacts, GetContactsResult } from '@capacitor-community/contacts';
import { ToastController, LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private contactsSubject = new BehaviorSubject<ContactModel[]>([]);
  contacts$ = this.contactsSubject.asObservable();

  constructor(
    private sqliteService: SqliteService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    console.log('Initializing ContactService');
    this.loadContacts();
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async loadContacts(): Promise<ContactModel[]> {
    try {
      console.log('Loading contacts from database');
      const result = await this.sqliteService.executeQuery(
        'SELECT * FROM contacts ORDER BY name'
      );
      const contacts = result.values?.map((c: any) => new ContactModel({
        id: c.id,
        name: c.name,
        phone: c.phone
      })) || [];
      this.contactsSubject.next(contacts);
      console.log(`Loaded ${contacts.length} contacts from database`);
      return contacts;
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
      await this.presentToast('Erreur lors du chargement des contacts', 'danger');
      return [];
    }
  }

  

  

  async addContact(contact: Contact): Promise<void> {
    try {
      console.log(`Adding contact: ${contact.name} (${contact.phone})`);
      await this.sqliteService.executeQuery(
        'INSERT INTO contacts (name, phone) VALUES (?, ?)',
        [contact.name, contact.phone]
      );
      await this.loadContacts();
      console.log('Contact added successfully');
      await this.presentToast('Contact ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du contact:', error);
      await this.presentToast('Erreur lors de l\'ajout du contact', 'danger');
      throw error;
    }
  }

  async getContact(id: number): Promise<ContactModel | null> {
    try {
      console.log(`Fetching contact with ID: ${id}`);
      const result = await this.sqliteService.executeQuery(
        'SELECT * FROM contacts WHERE id = ?',
        [id]
      );

      if (result.values?.length) {
        const contact = result.values[0];
        console.log(`Contact found: ${contact.name} (${contact.phone})`);
        return new ContactModel({
          id: contact.id,
          name: contact.name,
          phone: contact.phone
        });
      }
      console.log('No contact found with the given ID');
      return null;
    } catch (error) {
      console.error('Erreur récupération contact:', error);
      await this.presentToast('Erreur lors de la récupération du contact', 'danger');
      return null;
    }
  }

  async updateContact(contact: Contact): Promise<void> {
    try {
      console.log(`Updating contact with ID: ${contact.id}`);
      await this.sqliteService.executeQuery(
        'UPDATE contacts SET name = ?, phone = ? WHERE id = ?',
        [contact.name, contact.phone, contact.id]
      );
      await this.loadContacts();
      console.log('Contact updated successfully');
      await this.presentToast('Contact mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour contact:', error);
      await this.presentToast('Erreur lors de la mise à jour du contact', 'danger');
      throw error;
    }
  }

  async removeContact(id: number): Promise<void> {
    try {
      console.log(`Removing contact with ID: ${id}`);
      await this.sqliteService.executeQuery(
        'DELETE FROM contacts WHERE id = ?',
        [id]
      );
      await this.loadContacts();
      console.log('Contact removed successfully');
      await this.presentToast('Contact supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression contact:', error);
      await this.presentToast('Erreur lors de la suppression du contact', 'danger');
      throw error;
    }
  }

  

  

  // Optimiser la synchronisation des contacts
  

  // Optimiser la recherche de contacts
  async searchContacts(searchTerm: string): Promise<ContactModel[]> {
    try {
      if (!searchTerm.trim()) {
        return this.loadContacts();
      }

      // Optimiser la requête de recherche
      const result = await this.sqliteService.executeQuery(
        `SELECT * FROM contacts 
         WHERE name LIKE ? OR phone LIKE ? 
         ORDER BY 
           CASE 
             WHEN name LIKE ? THEN 1
             WHEN name LIKE ? THEN 2
             ELSE 3
           END,
           name
         LIMIT 100`,  // Limiter les résultats pour de meilleures performances
        [
          `%${searchTerm}%`,
          `%${searchTerm}%`,
          `${searchTerm}%`,    // Commence par
          `%${searchTerm}%`    // Contient
        ]
      );

      return result.values?.map((c: any) => new ContactModel({
        id: c.id,
        name: c.name,
        phone: c.phone
      })) || [];
    } catch (error) {
      console.error('Erreur lors de la recherche des contacts:', error);
      await this.presentToast('Erreur lors de la recherche des contacts', 'danger');
      return [];
    }
  }

  // Optimiser le chargement des contacts du téléphone
  

  // Dans contact.service.ts

/*async loadContactsFromPhone(): Promise<ContactModel[]> {
  try {
    console.log('Début du chargement des contacts du téléphone');
    const permissionStatus = await Contacts.checkPermissions();
    if (permissionStatus.contacts !== 'granted') {
      const request = await Contacts.requestPermissions();
      if (request.contacts !== 'granted') {
        await this.presentToast('Permission d\'accès aux contacts refusée', 'danger');
        return [];
      }
    }

    // Configuration plus détaillée pour la récupération des contacts
    const result: GetContactsResult = await Contacts.getContacts({
      projection: {
        name: true,
        phones: true,
        organization: true,
        emails: true
      }
    });

    console.log(`Nombre total de contacts trouvés: ${result.contacts.length}`);

    const processedContacts = result.contacts
      .filter(contact => {
        // Vérifier si le contact a un nom et au moins un numéro de téléphone
        const hasValidName = contact.name?.display || contact.name?.given;
        const hasValidPhone = contact.phones && contact.phones.length > 0;
        return hasValidName && hasValidPhone;
      })
      .map(contact => {
        // Traitement du numéro de téléphone
        let phoneNumber = contact.phones![0].number || '';
        
        // Nettoyage du numéro de téléphone
        phoneNumber = phoneNumber.replace(/[\s\-\(\)\+\.]/g, '');
        
        // Gestion des numéros avec l'indicatif pays
        if (phoneNumber.startsWith('237')) {
          phoneNumber = phoneNumber.substring(3);
        } else if (phoneNumber.startsWith('+237')) {
          phoneNumber = phoneNumber.substring(4);
        }
        
        // Vérifier si le numéro commence par 6 ou 2
        if (phoneNumber.length === 9 && (phoneNumber.startsWith('6') || phoneNumber.startsWith('2'))) {
          return new ContactModel({
            id: undefined,
            name: contact.name?.display || contact.name?.given || 'Inconnu',
            phone: phoneNumber
          });
        }
        return null;
      })
      .filter((contact): contact is ContactModel => contact !== null);

    console.log(`Nombre de contacts traités: ${processedContacts.length}`);
    return processedContacts;
  } catch (error) {
    console.error('Erreur lors du chargement des contacts:', error);
    await this.presentToast('Erreur lors du chargement des contacts du téléphone', 'danger');
    return [];
  }
}*/

/*async syncContacts(): Promise<void> {
  const loading = await this.loadingController.create({
    message: 'Synchronisation en cours...',
    spinner: 'circular'
  });
  await loading.present();

  try {
    console.log('Début de la synchronisation');
    // Charger les contacts du téléphone
    const phoneContacts = await this.loadContactsFromPhone();
    console.log(`Contacts du téléphone chargés: ${phoneContacts.length}`);

    // Charger les contacts existants
    const existingContacts = await this.sqliteService.executeQuery('SELECT phone FROM contacts');
    const existingPhones = new Set(existingContacts.values?.map((c: any) => c.phone));

    // Filtrer les nouveaux contacts
    const newContacts = phoneContacts.filter(
      contact => contact.phone && !existingPhones.has(contact.phone)
    );
    console.log(`Nouveaux contacts à ajouter: ${newContacts.length}`);

    if (newContacts.length > 0) {
      // Traitement par lots
      const batchSize = 50;
      for (let i = 0; i < newContacts.length; i += batchSize) {
        const batch = newContacts.slice(i, i + batchSize);
        const queries = batch.map(contact => ({
          query: 'INSERT INTO contacts (name, phone) VALUES (?, ?)',
          params: [contact.name, contact.phone]
        }));

        await this.sqliteService.executeTransaction(queries);
        console.log(`Lot ${Math.floor(i/batchSize) + 1} traité`);

        // Mettre à jour le message de chargement
        loading.message = `Synchronisation en cours... ${Math.min(i + batchSize, newContacts.length)}/${newContacts.length}`;
      }
    }

    await this.loadContacts();
    await loading.dismiss();
    await this.presentToast(`Synchronisation terminée. ${newContacts.length} contacts ajoutés.`);
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    await loading.dismiss();
    await this.presentToast('Erreur lors de la synchronisation des contacts', 'danger');
  }
}*/

// Modifions aussi la méthode de chargement paginée
/*async loadPaginatedContacts(page: number, pageSize: number): Promise<ContactModel[]> {
  try {
    console.log(`Chargement de la page ${page}, taille ${pageSize}`);
    const offset = page * pageSize;
    
    // Ajout d'un comptage total pour la pagination
    const countResult = await this.sqliteService.executeQuery('SELECT COUNT(*) as total FROM contacts');
    const total = countResult.values?.[0].total || 0;
    
    const result = await this.sqliteService.executeQuery(
      'SELECT * FROM contacts ORDER BY name COLLATE NOCASE LIMIT ? OFFSET ?',
      [pageSize, offset]
    );
    
    const contacts = result.values?.map((c: any) => new ContactModel({
      id: c.id,
      name: c.name,
      phone: c.phone
    })) || [];
    
    console.log(`Chargés ${contacts.length} contacts sur ${total}`);
    return contacts;
  } catch (error) {
    console.error('Erreur lors du chargement des contacts:', error);
    await this.presentToast('Erreur lors du chargement des contacts', 'danger');
    return [];
  }
}*/

async loadContactsFromPhone(): Promise<ContactModel[]> {
  try {
    console.log('Début du chargement des contacts du téléphone');
    const permissionStatus = await Contacts.checkPermissions();
    if (permissionStatus.contacts !== 'granted') {
      const request = await Contacts.requestPermissions();
      if (request.contacts !== 'granted') {
        await this.presentToast('Permission d\'accès aux contacts refusée', 'danger');
        return [];
      }
    }

    // Configuration plus détaillée pour la récupération des contacts
    const result: GetContactsResult = await Contacts.getContacts({
      projection: {
        name: true,
        phones: true,
        organization: true,
        emails: true
      }
    });

    console.log(`Nombre total de contacts trouvés: ${result.contacts.length}`);

    const processedContacts = result.contacts
      .map(contact => {
        let phoneNumber = contact.phones?.[0]?.number || '';
        
        // Nettoyage basique du numéro
        phoneNumber = phoneNumber.replace(/[\s\-\(\)\+\.]/g, '');
        
        // Gestion des indicatifs
        if (phoneNumber.startsWith('237')) {
          phoneNumber = phoneNumber.substring(3);
        } else if (phoneNumber.startsWith('+237')) {
          phoneNumber = phoneNumber.substring(4);
        }

        return new ContactModel({
          id: undefined,
          name: contact.name?.display || contact.name?.given || 'Inconnu',
          phone: phoneNumber || undefined
        });
      });

    console.log(`Nombre de contacts traités: ${processedContacts.length}`);
    return processedContacts;
  } catch (error) {
    console.error('Erreur lors du chargement des contacts:', error);
    await this.presentToast('Erreur lors du chargement des contacts du téléphone', 'danger');
    return [];
  }
}

async syncContacts(): Promise<void> {
  const loading = await this.loadingController.create({
    message: 'Synchronisation en cours...',
    spinner: 'circular'
  });
  await loading.present();

  try {
    console.log('Début de la synchronisation');
    // Charger les contacts du téléphone
    const phoneContacts = await this.loadContactsFromPhone();
    console.log(`Contacts du téléphone chargés: ${phoneContacts.length}`);

    // Charger les contacts existants
    const existingContacts = await this.sqliteService.executeQuery('SELECT phone FROM contacts');
    const existingPhones = new Set(existingContacts.values?.map((c: any) => c.phone));

    // Filtrer les nouveaux contacts
    const newContacts = phoneContacts.filter(
      contact => contact.phone && !existingPhones.has(contact.phone)
    );
    console.log(`Nouveaux contacts à ajouter: ${newContacts.length}`);

    if (newContacts.length > 0) {
      // Traitement par lots
      const batchSize = 50;
      for (let i = 0; i < newContacts.length; i += batchSize) {
        const batch = newContacts.slice(i, i + batchSize);
        const queries = batch.map(contact => ({
          query: 'INSERT INTO contacts (name, phone) VALUES (?, ?)',
          params: [contact.name, contact.phone]
        }));

        await this.sqliteService.executeTransaction(queries);
        console.log(`Lot ${Math.floor(i/batchSize) + 1} traité`);

        // Mettre à jour le message de chargement
        loading.message = `Synchronisation en cours... ${Math.min(i + batchSize, newContacts.length)}/${newContacts.length}`;
      }
    }

    await this.loadContacts();
    await loading.dismiss();
    await this.presentToast(`Synchronisation terminée. ${newContacts.length} contacts ajoutés.`);
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    await loading.dismiss();
    await this.presentToast('Erreur lors de la synchronisation des contacts', 'danger');
  }
}

// Modifions aussi la méthode de chargement paginée
async loadPaginatedContacts(page: number, pageSize: number): Promise<ContactModel[]> {
  try {
    console.log(`Chargement de la page ${page}, taille ${pageSize}`);
    const offset = page * pageSize;
    
    // Ajout d'un comptage total pour la pagination
    const countResult = await this.sqliteService.executeQuery('SELECT COUNT(*) as total FROM contacts');
    const total = countResult.values?.[0].total || 0;
    
    const result = await this.sqliteService.executeQuery(
      'SELECT * FROM contacts ORDER BY name COLLATE NOCASE LIMIT ? OFFSET ?',
      [pageSize, offset]
    );
    
    const contacts = result.values?.map((c: any) => new ContactModel({
      id: c.id,
      name: c.name,
      phone: c.phone
    })) || [];
    
    console.log(`Chargés ${contacts.length} contacts sur ${total}`);
    return contacts;
  } catch (error) {
    console.error('Erreur lors du chargement des contacts:', error);
    await this.presentToast('Erreur lors du chargement des contacts', 'danger');
    return [];
  }
}
}