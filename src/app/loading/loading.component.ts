import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div class="loading-container">
      <div class="loading-content">
        <div class="loading-spinner">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
        
        <h2 class="loading-title">Validando Acceso</h2>
        
        <p class="loading-message">
          Estamos verificando tu token de acceso con el sistema GLPI...
        </p>
        
        <div class="loading-steps">
          <div class="step">
            <mat-spinner diameter="20" *ngIf="currentStep >= 1"></mat-spinner>
            <span class="step-text">Conectando con GLPI</span>
          </div>
          
          <div class="step">
            <mat-spinner diameter="20" *ngIf="currentStep >= 2"></mat-spinner>
            <span class="step-text">Validando token</span>
          </div>
          
          <div class="step">
            <mat-spinner diameter="20" *ngIf="currentStep >= 3"></mat-spinner>
            <span class="step-text">Cargando información del usuario</span>
          </div>
        </div>
        
        <div class="loading-info">
          <p><strong>API:</strong> https://helpdesk.sectorial.co/glpi/apirest.php</p>
          <p><strong>Token:</strong> {{ getTokenInfo() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .loading-content {
      background: white;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }

    .loading-spinner {
      margin-bottom: 24px;
    }

    .loading-title {
      color: #333;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .loading-message {
      color: #666;
      font-size: 16px;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    .loading-steps {
      margin-bottom: 32px;
    }

    .step {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-bottom: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .step-text {
      margin-left: 12px;
      color: #555;
      font-size: 14px;
    }

    .loading-info {
      background: #e3f2fd;
      border-radius: 8px;
      padding: 16px;
      text-align: left;
      font-size: 12px;
      color: #1976d2;
    }

    .loading-info p {
      margin: 4px 0;
    }

    .loading-info strong {
      color: #0d47a1;
    }

    @media (max-width: 600px) {
      .loading-content {
        padding: 24px;
      }

      .loading-title {
        font-size: 20px;
      }

      .loading-message {
        font-size: 14px;
      }
    }
  `]
})
export class LoadingComponent {
  currentStep = 1;

  ngOnInit() {
    // Simular progreso de los pasos
    setTimeout(() => this.currentStep = 2, 1000);
    setTimeout(() => this.currentStep = 3, 2000);
  }

  /**
   * Obtiene información del token
   */
  getTokenInfo(): string {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || urlParams.get('glpi_token');
    if (token) {
      return token.substring(0, 10) + '...';
    }
    return 'No disponible';
  }
}

