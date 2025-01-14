import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding, ReadFileResult } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';

@Injectable({
  providedIn: 'root'
})
export class LocalDriveService {
  private readonly BACKUP_FOLDER = 'backups';

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await Filesystem.mkdir({
        path: this.BACKUP_FOLDER,
        directory: Directory.Documents,
        recursive: true
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du stockage:', error);
    }
  }

  async exportData(data: any): Promise<string> {
    try {
      const fileName = `backup_${new Date().toISOString()}.json`;
      const jsonData = JSON.stringify(data, null, 2);

      await Filesystem.writeFile({
        path: `${this.BACKUP_FOLDER}/${fileName}`,
        data: jsonData,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      return fileName;
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      throw error;
    }
  }

  async listBackups(): Promise<{ name: string, mtime: number }[]> {
    try {
      const result = await Filesystem.readdir({
        path: this.BACKUP_FOLDER,
        directory: Directory.Documents
      });

      const backupFiles = await Promise.all(
        result.files
          .filter(file => file.name.endsWith('.json'))
          .map(async file => {
            const stat = await Filesystem.stat({
              path: `${this.BACKUP_FOLDER}/${file.name}`,
              directory: Directory.Documents
            });
            
            return {
              name: file.name,
              mtime: stat.mtime || Date.now()
            };
          })
      );

      return backupFiles.sort((a, b) => b.mtime - a.mtime);
    } catch (error) {
      console.error('Erreur lors de la lecture des sauvegardes:', error);
      throw error;
    }
  }

  /*async importData(fileName: string): Promise<any> {
    try {
      const result = await Filesystem.readFile({
        path: `${this.BACKUP_FOLDER}/${fileName}`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      // Vérification du type de données reçu
      if (result.data === null || result.data === undefined) {
        throw new Error('Le fichier de sauvegarde est vide');
      }

      // Si le résultat est un Blob, le convertir en texte
      if (result.data instanceof Blob) {
        const text = await this.blobToText(result.data);
        return JSON.parse(text);
      }

      // Si c'est une chaîne de caractères
      if (typeof result.data === 'string') {
        return JSON.parse(result.data);
      }

      throw new Error('Format de données non supporté');
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      throw error;
    }
  }*/

  private async blobToText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Échec de la lecture du fichier'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
  }

  async deleteBackup(fileName: string): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: `${this.BACKUP_FOLDER}/${fileName}`,
        directory: Directory.Documents
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  async pickAndImportBackup(): Promise<any> {
    try {
      const result = await FilePicker.pickFiles({
        types: ['application/json']
      });

      if (!result.files || result.files.length === 0) {
        throw new Error('Aucun fichier sélectionné');
      }

      const file = result.files[0];
      const fileContent = await this.readFileContent(file.path || '');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      throw error;
    }
  }

  private async readFileContent(path: string): Promise<string> {
    const result = await Filesystem.readFile({
      path,
      encoding: Encoding.UTF8
    });

    if (typeof result.data !== 'string') {
      throw new Error('Format de fichier non supporté');
    }

    return result.data;
  }
  

  async importData(filePath: string): Promise<any> {
    try {
      const result = await Filesystem.readFile({
        path: filePath,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      if (typeof result.data === 'string') {
        return JSON.parse(result.data);
      }
      throw new Error('Format de données non supporté');
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      throw error;
    }
  }
}