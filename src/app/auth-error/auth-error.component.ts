import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-error',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="auth-error-container">
      <div class="auth-error-content">
        <div class="error-icon">
          <mat-icon>error_outline</mat-icon>
        </div>
        
        <h1 class="error-title">Error de Autenticación</h1>
        
        <p class="error-message">
          No se pudo validar el token de acceso con el sistema GLPI.
        </p>
        
        <div class="error-details">
          <h3>Posibles causas:</h3>
          <ul>
            <li>Token inválido o expirado</li>
            <li>Problemas de conectividad con GLPI</li>
            <li>Permisos insuficientes</li>
            <li>Servicio GLPI no disponible</li>
          </ul>
        </div>
        
        <div class="error-actions">
          <button mat-raised-button color="primary" (click)="retryAuth()">
            <mat-icon>refresh</mat-icon>
            Reintentar
          </button>
          
          <button mat-stroked-button (click)="goHome()">
            <mat-icon>home</mat-icon>
            Ir al Inicio
          </button>
        </div>
        
        <div class="error-info">
          <p><strong>Token utilizado:</strong> {{ getTokenInfo() }}</p>
          <p><strong>URL de la API:</strong> https://helpdesk.sectorial.co/glpi/apirest.php</p>
          <p><strong>Hora del error:</strong> {{ getCurrentTime() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
    }

    .auth-error-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      padding: 40px;
      max-width: 600px;
      width: 100%;
      text-align: center;
    }

    .error-icon {
      margin-bottom: 24px;
    }

    .error-icon mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }

    .error-title {
      color: #333;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .error-message {
      color: #666;
      font-size: 16px;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    .error-details {
      text-align: left;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
    }

    .error-details h3 {
      color: #333;
      font-size: 18px;
      margin-bottom: 12px;
    }

    .error-details ul {
      color: #666;
      margin: 0;
      padding-left: 20px;
    }

    .error-details li {
      margin-bottom: 8px;
    }

    .error-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-bottom: 32px;
    }

    .error-actions button {
      min-width: 140px;
    }

    .error-info {
      background: #e3f2fd;
      border-radius: 8px;
      padding: 16px;
      text-align: left;
      font-size: 14px;
      color: #1976d2;
    }

    .error-info p {
      margin: 8px 0;
    }

    .error-info strong {
      color: #0d47a1;
    }

    @media (max-width: 600px) {
      .auth-error-content {
        padding: 24px;
      }

      .error-actions {
        flex-direction: column;
      }

      .error-actions button {
        width: 100%;
      }
    }
  `]
})
export class AuthErrorComponent {
  
  constructor(private router: Router) {}

  /**
   * Reintenta la autenticación
   */
  retryAuth(): void {
    // Recargar la página para reintentar la autenticación
    window.location.reload();
  }

  /**
   * Redirige al inicio (página principal de GLPI)
   */
  goHome(): void {
    // Redirigir a la página principal de GLPI
    window.location.href = 'https://helpdesk.sectorial.co/glpi/';
  }

  /**
   * Obtiene información del token utilizado
   */
  getTokenInfo(): string {
    const token = localStorage.getItem('helpdesk_token');
    if (token) {
      return token.substring(0, 10) + '...';
    }
    return 'No disponible';
  }

  /**
   * Obtiene la hora actual
   */
  getCurrentTime(): string {
    return new Date().toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

