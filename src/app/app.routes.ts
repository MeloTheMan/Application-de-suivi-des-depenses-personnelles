import { Routes } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: '',
    component: NavbarComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { preload: true }
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      {
        path: 'loans',
        loadComponent: () => import('./features/loans/loans.component').then(m => m.LoansComponent)
      },
      {
        path: 'contacts',
        loadComponent: () => import('./features/contacts/contacts/contacts.component').then(m => m.ContactsComponent)
      },
      {
        path: 'savings',
        loadComponent: () => import('./features/savings/savings.component').then(m => m.SavingsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
      
    ]
  }
];