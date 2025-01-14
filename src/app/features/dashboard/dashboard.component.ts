import { ModalController } from '@ionic/angular';
// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { StatisticsService } from '../../core/services/statistics.service';
import { TransactionType } from '../../core/interfaces/transaction.interface';
import { RecommendationService } from 'src/app/core/services/recommendation.service';
import { addIcons } from 'ionicons';
import { alertCircle, alertSharp, eye, star, trophy } from 'ionicons/icons';
import { interval, startWith, Subject, switchMap } from 'rxjs';
import { TransactionService } from 'src/app/core/services/transaction.service';
import { TransactionDetailComponent } from '../transactions/transaction-detail/transaction-detail.component';
import { LoanDetailComponent } from '../loans/loan-detail/loan-detail.component';
import { SavingsDetailComponent } from '../savings/saving-detail/saving-detail.component';
import { TransactionModel } from 'src/app/core/models/transaction.model';
import { LoanModel } from 'src/app/core/models/loan.model';
import { FinancialChartsComponent } from "../../shared/components/financial-charts/financial-charts.component";

@Component({
  selector: 'app-dashboard',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Tableau de Bord</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Résumé du mois -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Vue d'ensemble du mois</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col>
                <div class="stat-label">Entrées</div>
                <div class="stat-value success">
                  {{ monthlyStats.income | currency:'XAF':'symbol':'1.0-0' }}
                </div>
              </ion-col>
              <ion-col>
                <div class="stat-label">Sorties</div>
                <div class="stat-value danger">
                  {{ monthlyStats.expense | currency:'XAF':'symbol':'1.0-0' }}
                </div>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <div class="stat-label">Épargne</div>
                <div class="stat-value primary">
                  {{ monthlyStats.savings | currency:'XAF':'symbol':'1.0-0' }}
                </div>
              </ion-col>
              <ion-col>
                <div class="stat-label">Balance</div>
                <div class="stat-value" [ngClass]="{'success': balance >= 0, 'danger': balance < 0}">
                  {{ balance | currency:'XAF':'symbol':'1.0-0' }}
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Dépenses par catégorie -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Dépenses par catégorie</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngFor="let category of expenseCategories">
              <ion-label>
                <h2>{{ category.name }}</h2>
                <ion-progress-bar [value]="category.percentage"></ion-progress-bar>
              </ion-label>
              <ion-note slot="end">
                {{ category.amount | currency:'XAF':'symbol':'1.0-0' }}
              </ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-card>
      <ion-card-header>
        <ion-card-title>Analyse Financière</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <app-financial-charts></app-financial-charts>
      </ion-card-content>
    </ion-card>
    
      <!-- Alertes et Recommandations -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Recommandations</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item *ngFor="let recommendation of recommendations" [color]="recommendation.color">
            <ion-icon [name]="recommendation.icon" slot="start"></ion-icon>
            <ion-label>{{ recommendation.message }}</ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .stat-label {
      font-size: 0.9em;
      color: var(--ion-color-medium);
    }
    .stat-value {
      font-size: 1.2em;
      font-weight: bold;
    }
    .success { color: var(--ion-color-success); }
    .danger { color: var(--ion-color-danger); }
    .primary { color: var(--ion-color-primary); }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FinancialChartsComponent]
})
export class DashboardComponent implements OnInit {
  monthlyStats = {
    income: 0,
    expense: 0,
    savings: 0
  };
  balance = 0;
  expenseCategories: { name: string; amount: number; percentage: number }[] = [];
  recommendations: { message: string; icon: string; color: string }[] = [];
  private refresh = new Subject<void>();
  

  constructor(private statisticsService: StatisticsService, private recommendationService: RecommendationService, private transactionService: TransactionService,private modalController: ModalController) {
    addIcons({trophy, eye, star, alertCircle, alertSharp});

  }

  ngOnInit() {
    // Rafraîchissement automatique toutes les 5 secondes
    interval(5000).pipe(
      startWith(0),
      switchMap(() => this.loadDashboardData())
    ).subscribe();

    // S'abonner aux changements des services
    this.transactionService.transactions$.subscribe(() => {
      this.loadDashboardData();
    });
  }

  async loadDashboardData() {
    try {
      await Promise.all([
        this.loadMonthlyStats(),
        this.loadExpenseCategories(),
        this.generateRecommendations()
      ]);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  }


  async loadMonthlyStats() {
    const incomeStats = await this.statisticsService.getStatsByType('INCOME');
    const expenseStats = await this.statisticsService.getStatsByType('EXPENSE');
    const savingsStats = await this.statisticsService.getStatsByType('SAVINGS');

    this.monthlyStats = {
      income: incomeStats.monthly,
      expense: expenseStats.monthly,
      savings: savingsStats.monthly
    };

    this.balance = this.monthlyStats.income - this.monthlyStats.expense - this.monthlyStats.savings;
  }

  async loadExpenseCategories() {
    const categories = await this.statisticsService.getExpensesByCategory();
    const total = Array.from(categories.values()).reduce((sum, amount) => sum + amount, 0);

    this.expenseCategories = Array.from(categories.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? amount / total : 0
    }));

    // Trier par montant décroissant
    this.expenseCategories.sort((a, b) => b.amount - a.amount);
  }

  async generateRecommendations() {
    this.recommendations = await this.recommendationService.generateMonthlyRecommendations();
  }

  async viewTransactionDetails(transaction: TransactionModel) {
    const modal = await this.modalController.create({
      component: TransactionDetailComponent,
      componentProps: {
        transaction: transaction
      }
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data?.refresh) {
        await this.loadDashboardData();
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
        await this.loadDashboardData();
      }
    });

    return await modal.present();
  }

  async viewSavingDetails(saving: TransactionModel) {
    const modal = await this.modalController.create({
      component: SavingsDetailComponent,
      componentProps: {
        saving: saving
      }
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data?.refresh) {
        await this.loadDashboardData();
      }
    });

    return await modal.present();
  }
}