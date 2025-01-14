import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  
  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.initializeDatabase();
  }

  public async initializeDatabase() {
    try {
      this.db = await this.sqlite.createConnection(
        'finance_db',
        false,
        'no-encryption',
        1,
        false
      );
      await this.db.open();
      
      await this.createTables();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données:', error);
    }
  }

  private async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE', 'LOAN', 'BORROW', 'SAVINGS')),
        amount REAL NOT NULL,
        description TEXT,
        date INTEGER NOT NULL,
        category TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER,
      amount REAL NOT NULL,
      remaining_amount REAL,
      type TEXT NOT NULL CHECK(type IN ('GIVEN', 'TAKEN')),
      date INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'PARTIAL', 'COMPLETED')),
      interest_rate REAL NOT NULL DEFAULT 0,
      interest_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts (id)
    )`
  ];

  for (const query of queries) {
    await this.db.execute(query);
  }
}

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      return await this.db.query(query, params);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  async executeTransaction(queries: { query: string; params: any[] }[]): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Début de la transaction
      await this.db.query('BEGIN TRANSACTION');

      // Exécution de chaque requête
      for (const { query, params } of queries) {
        await this.db.query(query, params);
      }

      // Validation de la transaction
      await this.db.query('COMMIT');

    } catch (error) {
      // En cas d'erreur, annulation de la transaction
      await this.db.query('ROLLBACK');
      console.error('Error executing transaction:', error);
      throw error;
    }
  }
}