import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Plugins } from '@capacitor/core';
import { environment } from 'src/environments/environment';

const { Browser, Storage } = Plugins;

@Injectable({
  providedIn: 'root',
})
export class DriveService {
  private readonly API_ENDPOINT = 'https://www.googleapis.com/drive/v3';
  private readonly FOLDER_NAME = 'IntelligenceFinanciere_Backups';
  private folderId: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Initialisation OAuth et configuration Google Drive
   */
  async initializeGoogleDrive(): Promise<void> {
    try {
      await this.authenticate();
      await this.ensureBackupFolderExists();
    } catch (error) {
      console.error('Erreur initialisation Google Drive:', error);
    }
  }

  /**
   * Authentification utilisateur via OAuth2
   */
  private async authenticate(): Promise<void> {
    const { clientId, redirectUri, scopes } = environment.googleDrive;

    // Construire l'URL d'authentification
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${encodeURIComponent(
      scopes.join(' ')
    )}`;

    // Ouvrir le navigateur pour l'authentification
    await Browser['open']({ url: authUrl });

    // Intercepter le token depuis l'URI de redirection
    // Intercepter le token depuis l'URI de redirection
    Browser['addListener']('browserFinished', async () => {
      const url = new URL(await Browser['getOpenUrl']());
      const token = url.hash.match(/access_token=([^&]*)/)?.[1];
      if (token) {
        await Storage['set']({ key: 'googleDriveToken', value: token });
      } else {
        throw new Error('Erreur d\'authentification');
      }
    });
  }

  /**
   * Vérifie ou crée le dossier de sauvegarde sur Google Drive
   */
  private async ensureBackupFolderExists(): Promise<void> {
    try {
      const response = await this.http
        .get<any>(
          `${this.API_ENDPOINT}/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`,
          { headers: await this.getHeaders() }
        )
        .toPromise();

      if (response.files && response.files.length > 0) {
        this.folderId = response.files[0].id;
      } else {
        const folderData = {
          name: this.FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        };

        const folderResponse = await this.http
          .post<any>(
            `${this.API_ENDPOINT}/files`,
            folderData,
            { headers: await this.getHeaders() }
          )
          .toPromise();

        this.folderId = folderResponse.id;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification/création du dossier:', error);
    }
  }

  /**
   * Sauvegarde les données dans un fichier Google Drive
   */
  async exportToGoogleDrive(data: any): Promise<void> {
    try {
      const fileContent = JSON.stringify(data, null, 2);
      const fileName = `backup_${new Date().toISOString()}.json`;

      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: this.folderId ? [this.folderId] : undefined,
      };

      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append(
        'file',
        new Blob([fileContent], { type: 'application/json' })
      );

      await this.http
        .post(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          form,
          { headers: await this.getHeaders() }
        )
        .toPromise();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Liste les fichiers de sauvegarde
   */
  async listBackups(): Promise<any[]> {
    try {
      if (!this.folderId) await this.ensureBackupFolderExists();

      const response = await this.http
        .get<any>(
          `${this.API_ENDPOINT}/files?q='${this.folderId}' in parents and mimeType='application/json'&orderBy=modifiedTime desc`,
          { headers: await this.getHeaders() }
        )
        .toPromise();

      return response.files || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des sauvegardes:', error);
      return [];
    }
  }

  /**
   * Restaure les données à partir d'un fichier Google Drive
   */
  async importFromGoogleDrive(fileId: string): Promise<void> {
    try {
      const response = await this.http
        .get(
          `${this.API_ENDPOINT}/files/${fileId}?alt=media`,
          { headers: await this.getHeaders(), responseType: 'json' }
        )
        .toPromise();

      // Intégrez ici la logique pour restaurer les données dans votre application
      console.log('Données importées:', response);
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
    }
  }

  /**
   * Génère les headers d'autorisation
   */
  private async getHeaders(): Promise<{ Authorization: string }> {
    const token = (await Storage['get']({ key: 'googleDriveToken' })).value;
    if (!token) throw new Error('Token non disponible');
    return { Authorization: `Bearer ${token}` };
  }
}
