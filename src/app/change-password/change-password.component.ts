import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="change-password-dialog">
      <mat-card class="dialog-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>lock</mat-icon>
            Cambiar Contraseña
          </mat-card-title>
          <mat-card-subtitle>
            Debes cambiar tu contraseña por defecto
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form (ngSubmit)="onSubmit()" class="change-password-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña actual</mat-label>
              <input matInput 
                     [type]="hideCurrentPassword ? 'password' : 'text'"
                     [(ngModel)]="currentPassword"
                     name="currentPassword"
                     placeholder="Ingresa tu contraseña actual"
                     required>
              <button mat-icon-button matSuffix 
                      type="button"
                      (click)="hideCurrentPassword = !hideCurrentPassword"
                      [attr.aria-label]="'Ocultar contraseña actual'">
                <mat-icon>{{hideCurrentPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nueva contraseña</mat-label>
              <input matInput 
                     [type]="hideNewPassword ? 'password' : 'text'"
                     [(ngModel)]="newPassword"
                     name="newPassword"
                     placeholder="Ingresa tu nueva contraseña"
                     required
                     minlength="6">
              <button mat-icon-button matSuffix 
                      type="button"
                      (click)="hideNewPassword = !hideNewPassword"
                      [attr.aria-label]="'Ocultar nueva contraseña'">
                <mat-icon>{{hideNewPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar nueva contraseña</mat-label>
              <input matInput 
                     [type]="hideConfirmPassword ? 'password' : 'text'"
                     [(ngModel)]="confirmPassword"
                     name="confirmPassword"
                     placeholder="Confirma tu nueva contraseña"
                     required>
              <button mat-icon-button matSuffix 
                      type="button"
                      (click)="hideConfirmPassword = !hideConfirmPassword"
                      [attr.aria-label]="'Ocultar confirmación de contraseña'">
                <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>

            <div *ngIf="errorMessage" class="error-message">
              <mat-icon>error</mat-icon>
              {{ errorMessage }}
            </div>

            <div class="dialog-actions">
              <button mat-button 
                      type="button" 
                      (click)="onCancel()"
                      [disabled]="isLoading">
                Cancelar
              </button>
              <button mat-raised-button 
                      color="primary" 
                      type="submit"
                      [disabled]="!isFormValid() || isLoading">
                <mat-icon *ngIf="isLoading">refresh</mat-icon>
                {{ isLoading ? 'Cambiando...' : 'Cambiar Contraseña' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .change-password-dialog {
      padding: 20px;
      min-width: 400px;
    }

    .dialog-card {
      max-width: 500px;
      margin: 0 auto;
    }

    .change-password-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
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

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-card-subtitle {
      color: #666;
      margin-top: 8px;
    }

    mat-icon {
      vertical-align: middle;
    }
  `]
})
export class ChangePasswordComponent {
  @Input() currentPassword: string = '';
  @Output() passwordChanged = new EventEmitter<{current: string, new: string}>();
  @Output() cancelled = new EventEmitter<void>();

  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  
  hideCurrentPassword: boolean = true;
  hideNewPassword: boolean = true;
  hideConfirmPassword: boolean = true;

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordComponent>
  ) {}

  isFormValid(): boolean {
    return !!(
      this.currentPassword &&
      this.newPassword &&
      this.confirmPassword &&
      this.newPassword === this.confirmPassword &&
      this.newPassword.length >= 6
    );
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    if (this.newPassword === this.currentPassword) {
      this.errorMessage = 'La nueva contraseña debe ser diferente a la actual';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simular cambio de contraseña
    setTimeout(() => {
      this.isLoading = false;
      this.passwordChanged.emit({
        current: this.currentPassword,
        new: this.newPassword
      });
      this.dialogRef.close();
    }, 1000);
  }

  onCancel() {
    this.cancelled.emit();
    this.dialogRef.close();
  }
}

