import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-simple-app',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="app-container">
      <mat-card class="activation-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>person_add</mat-icon>
            Activación de Usuario
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>¡Bienvenido al sistema Help Desk!</p>
          <p>Tu cuenta ha sido creada exitosamente.</p>
          <p>Para activar tu cuenta y comenzar a usar el sistema, por favor inicia sesión con tus credenciales.</p>
          <div class="info-box">
            <mat-icon>info</mat-icon>
            <span>Contraseña inicial: <strong>123</strong></span>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" routerLink="/login">
            <mat-icon>login</mat-icon>
            Ir a Login
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .activation-card {
      max-width: 500px;
      text-align: center;
    }
    .info-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 16px 0;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 8px;
      color: #1976d2;
    }
    .info-box mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class SimpleAppComponent {}

