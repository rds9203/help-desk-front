import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <div class="login-content">
        <div class="login-header">
          <h1 class="login-title">Help Desk</h1>
          <p class="login-subtitle">Sistema de Gestión Interna</p>
        </div>

        <mat-card class="login-card">
          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput 
                       type="email" 
                       formControlName="email"
                       placeholder="usuario@empresa.com"
                       autocomplete="email">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                  El email es requerido
                </mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                  Ingrese un email válido
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Contraseña</mat-label>
                <input matInput 
                       [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password"
                       placeholder="Ingrese su contraseña"
                       autocomplete="current-password">
                <button mat-icon-button matSuffix 
                        type="button"
                        (click)="hidePassword = !hidePassword"
                        [attr.aria-label]="'Ocultar contraseña'"
                        [attr.aria-pressed]="hidePassword">
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  La contraseña es requerida
                </mat-error>
                <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                  La contraseña debe tener al menos 6 caracteres
                </mat-error>
              </mat-form-field>

              <button mat-raised-button 
                      color="primary" 
                      type="submit"
                      class="full-width login-button"
                      [disabled]="loginForm.invalid || isLoading">
                <mat-spinner *ngIf="isLoading" diameter="20" class="button-spinner"></mat-spinner>
                <span *ngIf="!isLoading">Iniciar Sesión</span>
                <span *ngIf="isLoading">Iniciando sesión...</span>
              </button>

              <div *ngIf="errorMessage" class="error-message">
                <mat-icon>error</mat-icon>
                {{ errorMessage }}
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <div class="login-footer">
          <p class="footer-text">
            <mat-icon>business</mat-icon>
            Sistema de gestión interna de Sectorial S.A.S
          </p>
          <p class="footer-note">
            Acceso autorizado
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-content {
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
      color: white;
    }

    .login-title {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .login-subtitle {
      font-size: 1rem;
      margin: 0;
      opacity: 0.9;
    }

    .login-card {
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border-radius: 12px;
      overflow: hidden;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .full-width {
      width: 100%;
    }

    .login-button {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      margin-top: 8px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background: #ffebee;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
    }

    .login-footer {
      text-align: center;
      margin-top: 32px;
      color: white;
    }

    .footer-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 0 0 8px 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .footer-note {
      margin: 0;
      font-size: 12px;
      opacity: 0.7;
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 16px;
      }
      
      .login-title {
        font-size: 2rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Validador personalizado para el dominio de email
   */

  /**
   * Maneja el envío del formulario de login
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('¡Bienvenido!', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Redirigir según el rol del usuario
          this.redirectByRole(response.user.role);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.error || 'Error de autenticación';
          console.error('Error en login:', error);
        }
      });
    }
  }

  /**
   * Redirige al usuario según su rol
   */
  private redirectByRole(role: string | { id: string | number; name: string; description?: string }): void {
    const roleName = typeof role === 'string' ? role : role.name;
    switch (roleName) {
      case 'superadmin':
      case 'admin':
        this.router.navigate(['/dashboard']);
        break;
      case 'technology':
        this.router.navigate(['/tickets']);
        break;
      case 'user':
      default:
        this.router.navigate(['/credits']);
        break;
    }
  }

  /**
   * Limpia el mensaje de error
   */
  clearError(): void {
    this.errorMessage = '';
  }
}

