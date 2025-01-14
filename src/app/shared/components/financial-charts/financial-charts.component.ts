import { Component, ElementRef, ViewChild} from '@angular/core';
import { IonSegment, IonButton, IonSegmentButton, IonLabel, IonSpinner } from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionModel } from '../../../core/models/transaction.model';
import { Subscription } from 'rxjs';
import { switchMap, startWith, filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-financial-charts',
  standalone: true,
  imports: [IonSegment, IonButton, IonSegmentButton, IonLabel, IonSpinner, FormsModule, NgIf],
  templateUrl: 'financial-charts.component.html',
  styleUrls: ['financial-charts.component.scss']
})


export class FinancialChartsComponent {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  selectedPeriod: 'week' | 'month' | 'year' = 'week';
  chart: Chart | null = null;
  private subscription: Subscription = new Subscription();
  hasData = false;
  loading = true;
  error: string | null = null;
  private currentTransactions: TransactionModel[] = [];

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.initializeChart();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initializeChart() {
    this.loading = true;
    this.error = null;

    this.subscription.add(
      this.transactionService.transactions$
        .pipe(
          filter(transactions => Array.isArray(transactions))
        )
        .subscribe({
          next: (transactions) => {
            this.loading = false;
            this.hasData = transactions.length > 0;
            this.currentTransactions = transactions;
            if (this.hasData) {
              this.refreshChart();
            }
          },
          error: (err) => {
            this.loading = false;
            this.error = 'Erreur lors du chargement des données';
            console.error('Erreur de chargement:', err);
          }
        })
    );
  }

  refreshData() {
    this.initializeChart();
  }

  onPeriodChange() {
    this.refreshChart();
  }

  private refreshChart() {
    if (!this.chartCanvas || !this.currentTransactions.length) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const { labels, incomes, expenses } = this.prepareData(this.currentTransactions);
    
    const config: ChartConfiguration = {
      type: this.selectedPeriod === 'week' ? 'line' : 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenus',
            data: incomes,
            backgroundColor: 'rgba(45, 211, 111, 0.5)',
            borderColor: 'rgb(45, 211, 111)',
            borderWidth: 1,
            fill: true
          },
          {
            label: 'Dépenses',
            data: expenses,
            backgroundColor: 'rgba(235, 68, 90, 0.5)',
            borderColor: 'rgb(235, 68, 90)',
            borderWidth: 1,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                const value = item.raw as number;
                return `${item.dataset.label}: ${new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  minimumFractionDigits: 0
                }).format(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (typeof value === 'number') {
                  if (value >= 1000000) {
                    return (value / 1000000).toFixed(1) + 'M XAF';
                  } else if (value >= 1000) {
                    return (value / 1000).toFixed(0) + 'K XAF';
                  }
                  return value.toLocaleString('fr-FR') + ' XAF';
                }
                return value;
              }
            }
          }
        }
      }
    };

    try {
      this.chart = new Chart(ctx, config);
    } catch (error) {
      console.error('Erreur lors de la création du graphique:', error);
      this.error = 'Erreur lors de la création du graphique';
    }
  }

  private prepareData(transactions: TransactionModel[]) {
    const now = new Date();
    let labels: string[] = [];
    let incomes: number[] = [];
    let expenses: number[] = [];

    const validTransactions = transactions.filter(t => 
      t.date && (t.isIncome() || t.isExpense()) && t.amount > 0
    );

    switch (this.selectedPeriod) {
      case 'week':
        labels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        incomes = new Array(7).fill(0);
        expenses = new Array(7).fill(0);
        
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        validTransactions.forEach(t => {
          const date = new Date(t.date);
          if (date >= weekStart) {
            const dayIndex = date.getDay();
            if (t.isIncome()) {
              incomes[dayIndex] += t.amount;
            } else if (t.isExpense()) {
              expenses[dayIndex] += t.amount;
            }
          }
        });
        break;

      case 'month':
        const currentMonth = now.getMonth();
        labels = ['S1', 'S2', 'S3', 'S4', 'S5'];
        incomes = new Array(5).fill(0);
        expenses = new Array(5).fill(0);

        validTransactions.forEach(t => {
          const date = new Date(t.date);
          if (date.getMonth() === currentMonth) {
            const week = Math.floor((date.getDate() - 1) / 7);
            if (week < 5) {
              if (t.isIncome()) {
                incomes[week] += t.amount;
              } else if (t.isExpense()) {
                expenses[week] += t.amount;
              }
            }
          }
        });
        break;

      case 'year':
        labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        incomes = new Array(12).fill(0);
        expenses = new Array(12).fill(0);

        validTransactions.forEach(t => {
          const date = new Date(t.date);
          if (date.getFullYear() === now.getFullYear()) {
            const monthIndex = date.getMonth();
            if (t.isIncome()) {
              incomes[monthIndex] += t.amount;
            } else if (t.isExpense()) {
              expenses[monthIndex] += t.amount;
            }
          }
        });
        break;
    }

    return { labels, incomes, expenses };
  }
}