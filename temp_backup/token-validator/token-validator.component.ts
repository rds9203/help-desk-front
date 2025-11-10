import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-token-validator',
  standalone: true,
  imports: [
    CommonModule,
    LoadingComponent
  ],
  template: `
    <div *ngIf="isLoading" class="validation-container">
      <app-loading></app-loading>
    </div>
    
    <div *ngIf="!isLoading && !isAuthenticated" class="validation-container">
      <div class="validation-error">
        <h2>Token no válido</h2>
        <p>El token proporcionado no es válido o ha expirado.</p>
        <button (click)="redirectToAuthError()">Ver Detalles del Error</button>
      </div>
    </div>
    
    <div *ngIf="!isLoading && isAuthenticated" class="validation-container">
      <div class="validation-success">
        <h2>¡Acceso Autorizado!</h2>
        <p>Token validado correctamente. Redirigiendo...</p>
        <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .validation-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .validation-error, .validation-success {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .validation-error h2 {
      color: #f44336;
      margin-bottom: 16px;
    }

    .validation-success h2 {
      color: #4caf50;
      margin-bottom: 16px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #4caf50;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 16px auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class TokenValidatorComponent implements OnInit {
  isLoading = true;
  isAuthenticated = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.validateToken();
  }

  /**
   * Valida el token y redirige según el resultado
   */
  private validateToken(): void {
    const token = this.getTokenFromUrl();
    
    if (!token) {
      console.error('❌ No se encontró token en la URL');
      this.redirectToAuthError();
      return;
    }

    console.log('🔐 Validando token:', token.substring(0, 10) + '...');

    // Intentar autenticar con el token
    this.authService.authenticateWithGLPI(token);

    // Suscribirse al estado de autenticación
    const subscription = this.authService.isAuthenticated$.subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          console.log('✅ Token válido, redirigiendo...');
          this.isAuthenticated = true;
          this.isLoading = false;
          
          // Redirigir a la página principal después de un breve delay
          setTimeout(() => {
            this.router.navigate(['/credits']);
          }, 1500);
        } else {
          // Verificar si hay error
          setTimeout(() => {
            const error = this.authService.error();
            if (error) {
              console.error('❌ Error de autenticación:', error);
              this.isLoading = false;
              // El error se manejará en la suscripción de error
            }
          }, 2000);
        }
      },
      error: (error) => {
        console.error('❌ Error validando token:', error);
        this.isLoading = false;
        this.redirectToAuthError();
      }
    });

    // Timeout de 10 segundos
    setTimeout(() => {
      subscription.unsubscribe();
      if (this.isLoading) {
        console.error('❌ Timeout validando token');
        this.isLoading = false;
        this.redirectToAuthError();
      }
    }, 10000);
  }

  /**
   * Obtiene el token desde la URL
   */
  private getTokenFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || urlParams.get('glpi_token') || null;
  }

  /**
   * Redirige a la página de error de autenticación
   */
  private redirectToAuthError(): void {
    this.router.navigate(['/auth-error']);
  }
}
