import { Routes } from '@angular/router';
import { ChartAnalyzerComponent } from './components/chart-analyzer/chart-analyzer.component';
import { LeverageCalculatorComponent } from './components/leverage-calculator/leverage-calculator.component';
import { OrderSetupComponent } from './components/order-setup/order-setup.component';

export const routes: Routes = [
  { path: '', redirectTo: '/chart', pathMatch: 'full' },
  { path: 'chart', component: ChartAnalyzerComponent },
  { path: 'calculator', component: LeverageCalculatorComponent },
  { path: 'setup', component: OrderSetupComponent }
];
