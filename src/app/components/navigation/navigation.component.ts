import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  navItems = [
    { path: '/chart', icon: '📊', label: 'Gráficas' },
    { path: '/calculator', icon: '🧮', label: 'Calculadora' },
    { path: '/setup', icon: '🎯', label: 'Setup' }
  ];
}
