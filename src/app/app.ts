import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavigationComponent } from './components/navigation/navigation.component';
import { DebugOverlayComponent } from './shared/debug-overlay.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, DebugOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  @ViewChild(DebugOverlayComponent) debugOverlay?: DebugOverlayComponent;
  title = 'Crypto Analyzer';

  constructor(private router: Router) {
    // Log de inicialización
    console.log('App initialized');
  }

  ngOnInit() {
    // Esperar un momento para que el ViewChild esté disponible
    setTimeout(() => {
      if (this.debugOverlay) {
        this.debugOverlay.addMessage('App iniciada', 'success');
        this.debugOverlay.addMessage('Ruta actual: ' + this.router.url, 'info');
      }

      // Monitorear cambios de ruta
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          if (this.debugOverlay) {
            this.debugOverlay.addMessage('Navegando a: ' + event.url, 'info');
          }
        });
    }, 500);

    // Capturar errores globales
    window.addEventListener('error', (event) => {
      if (this.debugOverlay) {
        this.debugOverlay.addMessage('ERROR: ' + event.message, 'error');
      }
    });

    // Capturar rechazos de promesas
    window.addEventListener('unhandledrejection', (event) => {
      if (this.debugOverlay) {
        this.debugOverlay.addMessage('PROMISE ERROR: ' + event.reason, 'error');
      }
    });
  }
}
