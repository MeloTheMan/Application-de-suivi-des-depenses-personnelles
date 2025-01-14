// src/app/core/services/recommendation.service.ts
import { Injectable } from '@angular/core';
import { StatisticsService } from './statistics.service';
import { Recommendation } from '../interfaces/recommendation.interface';
import { addIcons } from 'ionicons';
import { alertCircle, alertSharp, eye, pieChart, star, trendingUp, trophy } from 'ionicons/icons';



@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private readonly SPENDING_THRESHOLD = {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.9
  };

  constructor(private statisticsService: StatisticsService) {
    addIcons({trophy, eye, star, alertCircle, alertSharp, pieChart, trendingUp});
  }

  async generateMonthlyRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    const incomeStats = await this.statisticsService.getStatsByType('INCOME');
    const expenseStats = await this.statisticsService.getStatsByType('EXPENSE');
    const monthlyIncome = incomeStats.monthly;
    const monthlyExpense = expenseStats.monthly;

    if (monthlyIncome <= 0) {
      return recommendations;
    }

    // Calcul du ratio dépenses/revenus
    const spendingRatio = monthlyExpense / monthlyIncome;

    // Recommandations basées sur le niveau de dépense
    if (spendingRatio <= this.SPENDING_THRESHOLD.LOW) {
      recommendations.push({
        message: 'Excellent niveau de dépenses! Continuez à épargner.',
        icon: 'trophy',
        color: 'success',
        priority: 3
      });
    } else if (spendingRatio <= this.SPENDING_THRESHOLD.MEDIUM) {
      recommendations.push({
        message: 'Niveau de dépenses modéré. Surveillez vos dépenses non essentielles.',
        icon: 'eye',
        color: 'warning',
        priority: 2
      });
    } else if (spendingRatio <= this.SPENDING_THRESHOLD.HIGH) {
      recommendations.push({
        message: 'Attention: Vos dépenses sont élevées. Réduisez les dépenses non essentielles.',
        icon: 'alert-circle',
        color: 'warning',
        priority: 1
      });
    } else {
      recommendations.push({
        message: 'Critique: Vos dépenses dépassent vos revenus. Action immédiate requise!',
        icon: 'alert-sharp',
        color: 'danger',
        priority: 1
      });
    }

    // Analyse des catégories de dépenses
    const categoryStats = await this.statisticsService.getExpensesByCategory();
    let highestCategory = { name: '', amount: 0 };
    
    categoryStats.forEach((amount, category) => {
      if (amount > highestCategory.amount) {
        highestCategory = { name: category, amount: amount };
      }
    });

    if (highestCategory.amount > monthlyIncome * 0.4) {
      recommendations.push({
        message: `La catégorie "${highestCategory.name}" représente une part importante de vos dépenses`,
        icon: 'pie-chart',
        color: 'warning',
        priority: 2
      });
    }

    // Analyse de l'épargne
    const savingsStats = await this.statisticsService.getStatsByType('SAVINGS');
    const monthlySavings = savingsStats.monthly;
    const savingsRatio = monthlySavings / monthlyIncome;

    if (savingsRatio < 0.1) {
      recommendations.push({
        message: 'Objectif: Essayez d\'épargner au moins 10% de vos revenus mensuels',
        icon: 'save',
        color: 'primary',
        priority: 2
      });
    } else if (savingsRatio >= 0.2) {
      recommendations.push({
        message: 'Excellent taux d\'épargne! Continuez ainsi!',
        icon: 'star',
        color: 'success',
        priority: 3
      });
    }

    // Tendances sur 3 mois
    const threeMonthsExpenses = expenseStats.monthly * 3;
    const threeMonthsIncome = incomeStats.monthly * 3;
    const trend = threeMonthsExpenses / threeMonthsIncome;

    if (trend > 0.85) {
      recommendations.push({
        message: 'Tendance: Vos dépenses augmentent sur les 3 derniers mois',
        icon: 'trending-up',
        color: 'warning',
        priority: 2
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }
}