import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './services/auth.service';
import { ChangePasswordComponent } from './change-password/change-password.component';

@Component({
  selector: 'app-simple-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Iniciar Sesión</h2>
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="email" 
              required
              placeholder="usuario@empresa.com">
          </div>
          <div class="form-group">
            <label for="password">Contraseña:</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="password" 
              required
              placeholder="Ingresa tu contraseña (123 por defecto)">
          </div>
          <button type="submit" class="login-button" [disabled]="!email || !password || isLoading">
            <span *ngIf="!isLoading">Iniciar Sesión</span>
            <span *ngIf="isLoading">Iniciando sesión...</span>
          </button>
        </form>
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    .login-card h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #2c3e50;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #2c3e50;
      font-weight: 500;
    }
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }
    .login-button {
      width: 100%;
      padding: 12px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s;
    }
    .login-button:hover:not(:disabled) {
      background: #2980b9;
    }
    .login-button:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }
    .error-message {
      margin-top: 1rem;
      padding: 12px;
      background: #e74c3c;
      color: white;
      border-radius: 8px;
      text-align: center;
    }
  `]
})
export class SimpleLoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  onSubmit() {
    console.log('🚀 SimpleLoginComponent: onSubmit llamado');
    
    // Validación simple
    if (!this.email || !this.password) {
      this.errorMessage = 'Email y contraseña son requeridos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('🔍 Enviando credenciales al AuthService:', {
      email: this.email,
      password: this.password
    });

    // Usar el AuthService para hacer login
    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso desde SimpleLoginComponent:', response);
        this.isLoading = false;
        
        // TEMPORALMENTE DESHABILITADO - Verificar si debe cambiar contraseña
        // if (response.user.mustChangePassword) {
        //   console.log('🔒 Usuario debe cambiar contraseña, mostrando diálogo');
        //   this.showChangePasswordDialog(response.user);
        // } else {
        //   // Redirigir al dashboard
        //       this.router.navigate(['/app/dashboard']);
        // }
        
        // Redirigir directamente al dashboard (sin verificar cambio de contraseña)
        this.router.navigate(['/app/dashboard']);
      },
      error: (error) => {
        console.error('❌ Error en login desde SimpleLoginComponent:', error);
        this.isLoading = false;
        this.errorMessage = error.message || 'Error de autenticación';
      }
    });
  }

  /**
   * Muestra el diálogo para cambiar contraseña
   */
  private showChangePasswordDialog(user: any) {
    const dialogRef = this.dialog.open(ChangePasswordComponent, {
      width: '500px',
      disableClose: true, // No permitir cerrar hasta cambiar contraseña
      data: {
        currentPassword: this.password,
        user: user
      }
    });

    dialogRef.componentInstance.passwordChanged.subscribe((passwordData: any) => {
      console.log('🔑 Usuario cambió contraseña:', passwordData);
      
      // Simular actualización de contraseña
      this.authService.changePassword(passwordData.current, passwordData.new).subscribe({
        next: () => {
          console.log('✅ Contraseña cambiada exitosamente');
          dialogRef.close();
          
          // Mostrar mensaje de éxito y permitir login con nueva contraseña
          alert('¡Contraseña cambiada exitosamente!\nAhora puedes iniciar sesión con tu nueva contraseña.');
          
          // Limpiar formulario para permitir login con nueva contraseña
          this.password = '';
          this.errorMessage = '';
          
          // Actualizar placeholder para indicar que use nueva contraseña
          console.log('🔑 Puede hacer login con la nueva contraseña');
        },
        error: (error) => {
          console.error('❌ Error cambiando contraseña:', error);
          dialogRef.componentInstance.errorMessage = 'Error al cambiar la contraseña';
        }
      });
    });

    dialogRef.componentInstance.cancelled.subscribe(() => {
      console.log('❌ Usuario canceló cambio de contraseña');
      // Cerrar sesión si cancela
      this.authService.logout();
      this.router.navigate(['/login']);
    });
  }
}

