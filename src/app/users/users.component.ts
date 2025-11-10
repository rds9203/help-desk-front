import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService, User } from '../services/auth.service';

export interface UserForm {
  id?: string | number;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber?: string;
  birthDate?: string;
  position?: string;
  salary?: number;
  hasDebt?: boolean;
  debtAmount?: number; // Cuánto debe
  paidAmount?: number; // Cuánto ha pagado
  installmentAmount?: number; // De cuánto es la cuota
  interestRate?: number; // El interés
  startDate?: string;
  role: string;
  contractType?: string;
  password?: string;
  mustChangePassword?: boolean; // Todos deben cambiar contraseña
}

export interface ContractType {
  id: string;
  name: string;
  description: string;
}

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatToolbarModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule
  ],
  template: `
    <div class="users-container">
      <!-- Header -->
      <div class="users-header">
        <div class="header-info">
          <h1>Gestión de Usuarios</h1>
          <p>Administra los usuarios del sistema</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button 
                  color="primary" 
                  (click)="openCreateDialog()"
                  *ngIf="canManageUsers()"
                  class="create-btn">
            <mat-icon>person_add</mat-icon>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-container">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar usuario</mat-label>
              <input matInput 
                     [(ngModel)]="searchTerm"
                     (ngModelChange)="onSearchChange()"
                     placeholder="Nombre, email, cargo, documento...">
              <mat-icon matPrefix>search</mat-icon>
              <button mat-icon-button 
                      matSuffix 
                      *ngIf="searchTerm"
                      (click)="clearSearch()"
                      matTooltip="Limpiar búsqueda">
                <mat-icon>clear</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Filtrar por rol</mat-label>
              <mat-select [(ngModel)]="roleFilter" (ngModelChange)="onSearchChange()">
                <mat-option value="all">Todos</mat-option>
                <mat-option value="superadmin">Super Admin</mat-option>
                <mat-option value="admin">Administrador</mat-option>
                <mat-option value="technology">Soporte Técnico</mat-option>
                <mat-option value="user">Usuario</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button 
                    [matMenuTriggerFor]="columnsMenu"
                    class="columns-btn">
              <mat-icon>view_column</mat-icon>
              Columnas
            </button>

            <mat-menu #columnsMenu="matMenu">
              <div class="columns-menu-content" (click)="$event.stopPropagation()">
                <h3>Mostrar/Ocultar Columnas</h3>
                <div class="column-checkbox" *ngFor="let column of columnConfigs">
                  <mat-checkbox 
                    [(ngModel)]="column.visible"
                    (ngModelChange)="updateDisplayedColumns()"
                    [disabled]="column.key === 'name' || column.key === 'actions'">
                    {{ column.label }}
                  </mat-checkbox>
                </div>
              </div>
            </mat-menu>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Users Table -->
      <mat-card class="users-table-card">
        <mat-card-content>
          <div class="table-header">
            <h3>
              Lista de Usuarios
              <span class="results-count" *ngIf="searchTerm || roleFilter !== 'all'">
                ({{ filteredUsers().length }} resultado{{ filteredUsers().length !== 1 ? 's' : '' }})
              </span>
            </h3>
            <div class="table-actions">
              <button mat-icon-button 
                      matTooltip="Actualizar lista"
                      (click)="loadUsers()">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
          </div>

          <div class="table-container">
            <table mat-table [dataSource]="filteredUsers()" class="users-table">
              <!-- Select Column -->
              <ng-container matColumnDef="select">
                <th mat-header-cell *matHeaderCellDef>
                  <mat-checkbox (change)="toggleAllSelection($event)"
                                [checked]="allSelected()"
                                [indeterminate]="someSelected()">
                  </mat-checkbox>
                </th>
                <td mat-cell *matCellDef="let user">
                  <mat-checkbox [checked]="isUserSelected(user)"
                                (change)="toggleUserSelection(user)">
                  </mat-checkbox>
                </td>
              </ng-container>

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let user">
                  <div class="user-name">
                    <div class="name">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="email">{{ user.email }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Document Column -->
              <ng-container matColumnDef="document">
                <th mat-header-cell *matHeaderCellDef>Documento</th>
                <td mat-cell *matCellDef="let user">{{ user.documentNumber || 'N/A' }}</td>
              </ng-container>

              <!-- Position Column -->
              <ng-container matColumnDef="position">
                <th mat-header-cell *matHeaderCellDef>Cargo</th>
                <td mat-cell *matCellDef="let user">{{ user.position || 'N/A' }}</td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Rol</th>
                <td mat-cell *matCellDef="let user">
                  <span class="role-badge" [class]="getRoleClass(user.role)">
                    {{ getRoleDisplay(user.role) }}
                  </span>
                </td>
              </ng-container>

              <!-- Contract Type Column -->
              <ng-container matColumnDef="contractType">
                <th mat-header-cell *matHeaderCellDef>Tipo de Contrato</th>
                <td mat-cell *matCellDef="let user">
                  <span class="contract-badge" [class]="getContractClass(user.contractType)">
                    {{ getContractDisplay(user.contractType) }}
                  </span>
                </td>
              </ng-container>

              <!-- Salary Column -->
              <ng-container matColumnDef="salary">
                <th mat-header-cell *matHeaderCellDef>Salario</th>
                <td mat-cell *matCellDef="let user">
                  {{ formatCurrency(user.salary) }}
                </td>
              </ng-container>

              <!-- Debt Column -->
              <ng-container matColumnDef="debt">
                <th mat-header-cell *matHeaderCellDef>Tiene Deuda</th>
                <td mat-cell *matCellDef="let user">
                  <div class="debt-cell">
                    <mat-icon [class]="user.hasDebt ? 'has-debt' : 'no-debt'">
                      {{ user.hasDebt ? 'warning' : 'check_circle' }}
                    </mat-icon>
                    <span [class]="user.hasDebt ? 'has-debt' : 'no-debt'">
                      {{ user.hasDebt ? 'Sí' : 'No' }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <!-- Debt Amount Column -->
              <ng-container matColumnDef="debtAmount">
                <th mat-header-cell *matHeaderCellDef>Monto Deuda</th>
                <td mat-cell *matCellDef="let user">
                  {{ user.hasDebt && user.debtAmount ? formatCurrency(user.debtAmount) : '-' }}
                </td>
              </ng-container>

              <!-- Paid Amount Column -->
              <ng-container matColumnDef="paidAmount">
                <th mat-header-cell *matHeaderCellDef>Pagado</th>
                <td mat-cell *matCellDef="let user">
                  {{ user.hasDebt && user.paidAmount ? formatCurrency(user.paidAmount) : '-' }}
                </td>
              </ng-container>

              <!-- Installment Amount Column -->
              <ng-container matColumnDef="installmentAmount">
                <th mat-header-cell *matHeaderCellDef>Cuota</th>
                <td mat-cell *matCellDef="let user">
                  {{ user.hasDebt && user.installmentAmount ? formatCurrency(user.installmentAmount) : '-' }}
                </td>
              </ng-container>

              <!-- Interest Rate Column -->
              <ng-container matColumnDef="interestRate">
                <th mat-header-cell *matHeaderCellDef>Interés</th>
                <td mat-cell *matCellDef="let user">
                  {{ user.hasDebt && user.interestRate ? user.interestRate + '%' : '-' }}
                </td>
              </ng-container>

              <!-- Start Date Column -->
              <ng-container matColumnDef="startDate">
                <th mat-header-cell *matHeaderCellDef>Fecha Ingreso</th>
                <td mat-cell *matCellDef="let user">
                  {{ formatDate(user.startDate) }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let user">
                  <div class="action-buttons">
                    <button mat-icon-button 
                            matTooltip="Editar usuario"
                            (click)="editUser(user)"
                            *ngIf="canManageUsers()">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button 
                            matTooltip="Eliminar usuario"
                            (click)="deleteUser(user)"
                            *ngIf="canDeleteUser(user)"
                            class="delete-btn">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns();" 
                  [class.selected]="isUserSelected(row)">
              </tr>
            </table>
          </div>

          <!-- No Results -->
          <div class="no-results" *ngIf="filteredUsers().length === 0">
            <mat-icon>search_off</mat-icon>
            <p>No se encontraron usuarios con los criterios de búsqueda</p>
            <button mat-button (click)="clearAllFilters()">Limpiar filtros</button>
          </div>

          <!-- Bulk Actions -->
          <div class="bulk-actions" *ngIf="selectedUsers().length > 0">
            <span>{{ selectedUsers().length }} usuario(s) seleccionado(s)</span>
            <div class="bulk-buttons">
              <button mat-button color="warn" (click)="bulkDelete()" *ngIf="canManageUsers()">
                <mat-icon>delete</mat-icon>
                Eliminar
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Create/Edit User Dialog -->
    <div class="dialog-overlay" *ngIf="showDialog" (click)="closeDialog()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
          <button mat-icon-button (click)="closeDialog()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <form class="user-form" (ngSubmit)="saveUser()" #formRef="ngForm">
          <!-- Información Personal -->
          <h3>Información Personal</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nombres</mat-label>
              <input matInput 
                     [(ngModel)]="userForm.firstName" 
                     name="firstName" 
                     required>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Apellidos</mat-label>
              <input matInput 
                     [(ngModel)]="userForm.lastName" 
                     name="lastName" 
                     required>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Número de Documento</mat-label>
              <input matInput 
                     [(ngModel)]="userForm.documentNumber" 
                     name="documentNumber">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Fecha de Nacimiento</mat-label>
              <input matInput 
                     type="date"
                     [(ngModel)]="userForm.birthDate" 
                     name="birthDate">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email"
                     [(ngModel)]="userForm.email" 
                     name="email" 
                     required>
            </mat-form-field>
          </div>

          <!-- Información Laboral -->
          <h3>Información Laboral</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Cargo</mat-label>
              <input matInput 
                     [(ngModel)]="userForm.position" 
                     name="position">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Salario</mat-label>
              <input matInput 
                     type="number"
                     [(ngModel)]="userForm.salary" 
                     name="salary">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Fecha de Ingreso</mat-label>
              <input matInput 
                     type="date"
                     [(ngModel)]="userForm.startDate" 
                     name="startDate">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Tipo de Contrato</mat-label>
              <mat-select [(ngModel)]="userForm.contractType" name="contractType">
                <mat-option *ngFor="let contract of contractTypes" [value]="contract.id">
                  {{ contract.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Rol en el Sistema</mat-label>
              <mat-select [(ngModel)]="userForm.role" name="role" required>
                <mat-option value="user">Usuario</mat-option>
                <mat-option value="admin" *ngIf="canManageUsers()">Administrador</mat-option>
                <mat-option value="superadmin" *ngIf="authService.isSuperAdmin()">Super Administrador</mat-option>
                <mat-option value="technology">Soporte Técnico</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Estado y Configuración -->
          <h3>Estado y Configuración</h3>
          <div class="form-row">
            <div class="checkbox-group">
              <mat-checkbox [(ngModel)]="userForm.hasDebt" name="hasDebt">
                Tiene deuda
              </mat-checkbox>
            </div>
          </div>

          <!-- Campos de Deuda (solo si tiene deuda) -->
          <div class="debt-section" *ngIf="userForm.hasDebt">
            <h3>Información de Deuda</h3>
            <div class="form-row">
              <mat-form-field>
                <mat-label>Cuánto debe</mat-label>
                <input matInput type="number" [(ngModel)]="userForm.debtAmount" name="debtAmount" placeholder="0">
                <span matSuffix>COP</span>
              </mat-form-field>
              <mat-form-field>
                <mat-label>Cuánto ha pagado</mat-label>
                <input matInput type="number" [(ngModel)]="userForm.paidAmount" name="paidAmount" placeholder="0">
                <span matSuffix>COP</span>
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field>
                <mat-label>De cuánto es la cuota</mat-label>
                <input matInput type="number" [(ngModel)]="userForm.installmentAmount" name="installmentAmount" placeholder="0">
                <span matSuffix>COP</span>
              </mat-form-field>
              <mat-form-field>
                <mat-label>Interés</mat-label>
                <input matInput type="number" [(ngModel)]="userForm.interestRate" name="interestRate" placeholder="0" step="0.1">
                <span matSuffix>%</span>
              </mat-form-field>
            </div>
          </div>

          <!-- Contraseña (solo para nuevos usuarios) -->
          <div class="form-row" *ngIf="!isEditing">
            <div class="password-info">
              <mat-icon>info</mat-icon>
              <p>Todos los usuarios nuevos tendrán la contraseña por defecto "123" y deberán cambiarla en su primer inicio de sesión.</p>
            </div>
          </div>

          <div class="dialog-actions">
            <button mat-button type="button" (click)="closeDialog()">
              Cancelar
            </button>
            <button mat-raised-button 
                    color="primary" 
                    type="submit"
                    [disabled]="!formRef.form.valid">
              {{ isEditing ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-info h1 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 28px;
    }

    .header-info p {
      margin: 0;
      color: #7f8c8d;
      font-size: 16px;
    }

    .create-btn {
      background-color: #27ae60;
      color: white;
    }

    .filters-card {
      margin-bottom: 16px;
    }

    .filters-container {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-field {
      flex: 2;
      min-width: 250px;
    }

    .filter-field {
      flex: 1;
      min-width: 150px;
    }

    .columns-btn {
      white-space: nowrap;
    }

    .columns-menu-content {
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    }

    .columns-menu-content h3 {
      margin: 0 0 12px 0;
      color: #2c3e50;
      font-size: 14px;
      font-weight: 600;
    }

    .column-checkbox {
      padding: 8px 0;
    }

    .users-table-card {
      margin-top: 16px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .table-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .results-count {
      color: #7f8c8d;
      font-size: 14px;
      font-weight: normal;
      margin-left: 8px;
    }

    .table-container {
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      background: white;
    }

    .users-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e0e0e0;
      white-space: nowrap;
    }

    .users-table td {
      border-bottom: 1px solid #f0f0f0;
      padding: 12px 8px;
    }

    .users-table tr:hover {
      background-color: #f8f9fa;
    }

    .users-table tr.selected {
      background-color: #e3f2fd;
    }

    .users-table tr.inactive {
      opacity: 0.6;
    }

    .users-table tr.pending {
      background-color: #fff3e0;
    }

    .user-name .name {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .user-name .email {
      font-size: 12px;
      color: #666;
    }

    .role-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .role-badge.admin {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .role-badge.superadmin {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .role-badge.technology {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .role-badge.user {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .contract-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .contract-badge.fijo {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .contract-badge.indefinido {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .contract-badge.practicas {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .contract-badge.prestacion_servicios {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
    }

    .status-badge.active {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-badge.inactive {
      background-color: #ffebee;
      color: #c62828;
    }

    .status-badge.pending {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .debt-cell {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .has-debt {
      color: #f44336;
    }

    .no-debt {
      color: #4caf50;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .delete-btn {
      color: #f44336;
    }

    .activate-btn {
      color: #ff9800;
    }

    .no-results {
      text-align: center;
      padding: 48px 24px;
      color: #7f8c8d;
    }

    .no-results mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-results p {
      margin: 0 0 16px 0;
      font-size: 16px;
    }

    .bulk-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      margin-top: 16px;
    }

    .bulk-buttons {
      display: flex;
      gap: 8px;
    }

    .password-info {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .password-info mat-icon {
      color: #2196f3;
      flex-shrink: 0;
    }

    .password-info p {
      margin: 0;
      font-size: 14px;
      color: #1976d2;
      line-height: 1.5;
    }

    .user-form h3 {
      color: #2c3e50;
      margin: 24px 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 8px;
    }

    .user-form h3:first-child {
      margin-top: 0;
    }

    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
    }

    .dialog-header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .user-form {
      padding: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row:has(.password-info) {
      grid-template-columns: 1fr;
    }

    .form-row:has(mat-form-field[name="email"]) {
      grid-template-columns: 1fr;
    }

    .form-row:has(mat-form-field[name="role"]) {
      grid-template-columns: 1fr;
    }

    .form-row:has(mat-form-field[name="password"]) {
      grid-template-columns: 1fr;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      grid-column: 1 / -1;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding: 16px 24px 24px 24px;
      position: sticky;
      bottom: 0;
      background: white;
      border-top: 1px solid #e0e0e0;
    }

    @media (max-width: 768px) {
      .users-container {
        padding: 16px;
      }

      .users-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filters-container {
        flex-direction: column;
      }

      .search-field,
      .filter-field {
        width: 100%;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .bulk-actions {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .bulk-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  selectedUsers = signal<User[]>([]);
  
  // Filtros
  searchTerm: string = '';
  roleFilter: string = 'all';
  
  // Configuración de columnas
  columnConfigs: ColumnConfig[] = [
    { key: 'select', label: 'Selección', visible: true },
    { key: 'name', label: 'Nombre', visible: true },
    { key: 'document', label: 'Documento', visible: true },
    { key: 'position', label: 'Cargo', visible: true },
    { key: 'role', label: 'Rol', visible: true },
    { key: 'contractType', label: 'Tipo Contrato', visible: true },
    { key: 'salary', label: 'Salario', visible: false },
    { key: 'debt', label: 'Tiene Deuda', visible: true },
    { key: 'debtAmount', label: 'Monto Deuda', visible: false },
    { key: 'paidAmount', label: 'Pagado', visible: false },
    { key: 'installmentAmount', label: 'Cuota', visible: false },
    { key: 'interestRate', label: 'Interés', visible: false },
    { key: 'startDate', label: 'Fecha Ingreso', visible: false },
    { key: 'actions', label: 'Acciones', visible: true }
  ];

  displayedColumns = computed(() => 
    this.columnConfigs
      .filter(col => col.visible)
      .map(col => col.key)
  );

  // Usuarios filtrados
  filteredUsers = computed(() => {
    let filtered = this.users();

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.documentNumber && user.documentNumber.toLowerCase().includes(term)) ||
        (user.position && user.position.toLowerCase().includes(term))
      );
    }

    // Filtrar por rol
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        const role = typeof user.role === 'string' ? user.role : user.role.name;
        return role === this.roleFilter;
      });
    }

    return filtered;
  });
  
  showDialog = false;
  isEditing = false;
  userForm: UserForm = this.getEmptyUserForm();

  // Tabla de tipos de contrato
  contractTypes: ContractType[] = [
    { id: 'fijo', name: 'Término Fijo', description: 'Contrato por tiempo determinado' },
    { id: 'indefinido', name: 'Término Indefinido', description: 'Contrato por tiempo indefinido' },
    { id: 'practicas', name: 'Prácticas', description: 'Contrato de práctica profesional' },
    { id: 'prestacion_servicios', name: 'Prestación de Servicios', description: 'Contrato de prestación de servicios' }
  ];

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  ngOnInit() {
    console.log('🔍 UsersComponent ngOnInit - Verificando autenticación');
    
    if (this.authService.isAuthenticated()) {
      console.log('✅ Sesión ya autenticada, iniciando módulo de usuarios');
      this.initializeUsersModule();
      return;
    }
    
    console.log('🔄 Autenticación no confirmada, validando token...');
    this.authService.validateToken().subscribe({
      next: (isValid) => {
        if (isValid) {
          console.log('✅ Token válido, iniciando módulo de usuarios');
          this.initializeUsersModule();
        } else {
          console.log('❌ Token inválido, redirigiendo al login');
          this.redirectToLogin();
        }
      },
      error: (error) => {
        console.error('❌ Error validando token en UsersComponent:', error);
        this.redirectToLogin();
      }
    });
  }

  /**
   * Inicializa el módulo de usuarios una vez confirmada la autenticación
   */
  private initializeUsersModule(): void {
    const currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario actual en UsersComponent:', currentUser);
    
    if (!this.canManageUsers()) {
      console.log('❌ Usuario sin permisos para gestionar usuarios');
      alert('No tienes permisos para acceder a este módulo');
      window.location.href = '/app/dashboard';
      return;
    }
    
    console.log('✅ Usuario autenticado con permisos, cargando usuarios');
    this.loadUsers();
  }

  /**
   * Redirige al login cuando el usuario no está autenticado
   */
  private redirectToLogin(): void {
    window.location.href = '/login';
  }

  /**
   * Formulario de usuario vacío
   */
  private getEmptyUserForm(): UserForm {
    return {
      firstName: '',
      lastName: '',
      email: '',
      documentNumber: '',
      birthDate: '',
      position: '',
      salary: 0,
      hasDebt: false,
      debtAmount: 0,
      paidAmount: 0,
      installmentAmount: 0,
      interestRate: 0,
      startDate: new Date().toISOString().split('T')[0],
      role: 'user',
      contractType: 'indefinido',
      password: '123', // Contraseña por defecto
      mustChangePassword: true // Todos deben cambiar contraseña
    };
  }

  /**
   * Carga la lista de usuarios
   */
  loadUsers() {
    // Datos mockados por ahora - En producción esto vendría del API
    const mockUsers: User[] = [
      {
        id: 1,
        firstName: 'Pedro',
        lastName: 'García',
        email: 'pedro.garcia@helpdesk.com',
        documentNumber: '12345678',
        birthDate: '1990-05-15',
        position: 'Desarrollador',
        startDate: '2024-01-15',
        salary: 3500000,
        hasDebt: true,
        debtAmount: 5000000, // Debe 5 millones
        paidAmount: 1500000, // Ha pagado 1.5 millones
        installmentAmount: 250000, // Cuota de 250 mil
        interestRate: 2.5, // Interés del 2.5%
        role: 'user',
        contractType: 'indefinido',
        mustChangePassword: true
      },
      {
        id: 5,
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@helpdesk.com',
        documentNumber: '99887766',
        birthDate: '1980-11-25',
        position: 'Administrador',
        startDate: '2020-01-01',
        salary: 8000000,
        hasDebt: false,
        role: 'admin',
        contractType: 'indefinido',
      },
      {
        id: 9,
        firstName: 'Richard',
        lastName: 'Administrador',
        email: 'richy9.13@gmail.com',
        documentNumber: '1000000002',
        birthDate: '1990-01-01',
        position: 'Super Administrador',
        startDate: '2024-01-01',
        salary: 10000000,
        hasDebt: false,
        role: 'superadmin',
        contractType: 'indefinido',
      }
    ];

    this.users.set(mockUsers);
  }

  /**
   * Verifica si el usuario actual puede gestionar usuarios
   */
  canManageUsers(): boolean {
    const currentUser = this.authService.getCurrentUser();
    console.log('🔍 canManageUsers() - Usuario actual:', currentUser);
    
    if (!currentUser) {
      console.log('❌ canManageUsers() - No hay usuario actual');
      return false;
    }
    
    const role = typeof currentUser.role === 'string' ? currentUser.role : currentUser.role.name;
    console.log('🔍 canManageUsers() - Rol del usuario:', role);
    
    const canManage = role === 'admin' || role === 'superadmin';
    console.log('🔍 canManageUsers() - Puede gestionar usuarios:', canManage);
    
    return canManage;
  }

  /**
   * Verifica si el usuario actual puede eliminar un usuario específico
   */
  canDeleteUser(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    const currentRole = typeof currentUser.role === 'string' ? currentUser.role : currentUser.role.name;
    const targetRole = typeof user.role === 'string' ? user.role : user.role.name;
    
    // Superadmin puede eliminar a cualquiera
    if (currentRole === 'superadmin') return true;
    
    // Admin puede eliminar usuarios normales y otros admins (pero no superadmins)
    if (currentRole === 'admin') {
      return targetRole !== 'superadmin';
    }
    
    return false;
  }

  /**
   * Actualiza las columnas mostradas
   */
  updateDisplayedColumns() {
    // Trigger para que el computed se actualice
    this.columnConfigs = [...this.columnConfigs];
  }

  /**
   * Maneja los cambios en la búsqueda
   */
  onSearchChange() {
    // El computed filteredUsers se actualizará automáticamente
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch() {
    this.searchTerm = '';
  }

  /**
   * Limpia todos los filtros
   */
  clearAllFilters() {
    this.searchTerm = '';
    this.roleFilter = 'all';
  }

  /**
   * Abre el diálogo para crear un nuevo usuario
   */
  openCreateDialog() {
    if (!this.canManageUsers()) return;
    
    this.isEditing = false;
    this.userForm = this.getEmptyUserForm();
    this.showDialog = true;
  }

  /**
   * Abre el diálogo para editar un usuario existente
   */
  editUser(user: User) {
    if (!this.canManageUsers()) return;
    
    this.isEditing = true;
    this.userForm = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      documentNumber: user.documentNumber || '',
      birthDate: user.birthDate || '',
      position: user.position || '',
      salary: user.salary || 0,
      hasDebt: user.hasDebt || false,
      startDate: typeof user.startDate === 'string' ? user.startDate : (user.startDate ? user.startDate.toISOString().split('T')[0] : ''),
      role: typeof user.role === 'string' ? user.role : user.role.name,
      contractType: user.contractType || 'indefinido',
      mustChangePassword: this.userForm.mustChangePassword || true
    };
    this.showDialog = true;
  }

  /**
   * Cierra el diálogo
   */
  closeDialog() {
    this.showDialog = false;
    this.userForm = this.getEmptyUserForm();
  }

  /**
   * Guarda el usuario (crear o actualizar)
   */
  saveUser() {
    if (!this.canManageUsers()) return;
    
    if (this.isEditing) {
      // Actualizar usuario existente
      const userIndex = this.users().findIndex(u => u.id === this.userForm.id);
      if (userIndex !== -1) {
        const updatedUsers = [...this.users()];
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          firstName: this.userForm.firstName,
          lastName: this.userForm.lastName,
          email: this.userForm.email,
          documentNumber: this.userForm.documentNumber,
          birthDate: this.userForm.birthDate,
          position: this.userForm.position,
          salary: this.userForm.salary,
          hasDebt: this.userForm.hasDebt,
          startDate: this.userForm.startDate,
          role: this.userForm.role,
          contractType: this.userForm.contractType,
          mustChangePassword: this.userForm.mustChangePassword
        };
        this.users.set(updatedUsers);
        alert('Usuario actualizado correctamente');
      }
    } else {
      // Crear nuevo usuario usando el backend real
      const userData = {
        firstName: this.userForm.firstName,
        lastName: this.userForm.lastName,
        email: this.userForm.email,
        documentNumber: this.userForm.documentNumber,
        birthDate: this.userForm.birthDate,
        position: this.userForm.position,
        salary: this.userForm.salary,
        hasDebt: this.userForm.hasDebt,
        startDate: this.userForm.startDate,
        role: this.userForm.role,
        contractType: this.userForm.contractType,
        debtAmount: this.userForm.hasDebt ? this.userForm.debtAmount : null,
        paidAmount: this.userForm.hasDebt ? this.userForm.paidAmount : null,
        installmentAmount: this.userForm.hasDebt ? this.userForm.installmentAmount : null,
        interestRate: this.userForm.hasDebt ? this.userForm.interestRate : null
      };

      this.http.post('http://localhost:3001/api/create-user', userData).subscribe({
        next: (response: any) => {
          console.log('✅ Usuario creado exitosamente en backend:', response);
          
          // Agregar el usuario a la lista local
          const newUser: User = {
            id: response.user.id,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            email: response.user.email,
            documentNumber: response.user.documentNumber,
            birthDate: response.user.birthDate,
            position: response.user.position,
            salary: response.user.salary,
            hasDebt: response.user.hasDebt,
            startDate: response.user.startDate,
            role: response.user.role,
            contractType: response.user.contractType,
            mustChangePassword: response.user.mustChangePassword
          };
          
          this.users.set([...this.users(), newUser]);
          
          alert(`Usuario creado correctamente.\nContraseña inicial: ${response.defaultPassword}\nEl usuario deberá cambiarla en su primer login.`);
        },
        error: (error) => {
          console.error('❌ Error creando usuario:', error);
          let errorMessage = 'Error al crear el usuario';
          
          if (error.error?.error) {
            errorMessage = error.error.error;
          }
          
          alert(errorMessage);
        }
      });
    }
    
    this.closeDialog();
  }

  /**
   * Elimina un usuario
   */
  deleteUser(user: User) {
    if (!this.canDeleteUser(user)) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar a ${user.firstName} ${user.lastName}?`)) {
      const updatedUsers = this.users().filter(u => u.id !== user.id);
      this.users.set(updatedUsers);
      alert('Usuario eliminado correctamente');
    }
  }

  /**
   * Elimina múltiples usuarios seleccionados
   */
  bulkDelete() {
    if (!this.canManageUsers()) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar ${this.selectedUsers().length} usuario(s)?`)) {
      const selectedIds = this.selectedUsers().map(u => u.id);
      const updatedUsers = this.users().filter(u => !selectedIds.includes(u.id));
      this.users.set(updatedUsers);
      this.selectedUsers.set([]);
      alert('Usuarios eliminados correctamente');
    }
  }

  /**
   * Alterna la selección de un usuario
   */
  toggleUserSelection(user: User) {
    const selected = this.selectedUsers();
    const index = selected.findIndex(u => u.id === user.id);
    
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(user);
    }
    
    this.selectedUsers.set([...selected]);
  }

  /**
   * Verifica si un usuario está seleccionado
   */
  isUserSelected(user: User): boolean {
    return this.selectedUsers().some(u => u.id === user.id);
  }

  /**
   * Alterna la selección de todos los usuarios
   */
  toggleAllSelection(event: any) {
    if (event.checked) {
      this.selectedUsers.set([...this.filteredUsers()]);
    } else {
      this.selectedUsers.set([]);
    }
  }

  /**
   * Verifica si todos los usuarios están seleccionados
   */
  allSelected(): boolean {
    return this.filteredUsers().length > 0 && 
           this.selectedUsers().length === this.filteredUsers().length;
  }

  /**
   * Verifica si algunos usuarios están seleccionados
   */
  someSelected(): boolean {
    return this.selectedUsers().length > 0 && 
           this.selectedUsers().length < this.filteredUsers().length;
  }

  /**
   * Obtiene la clase CSS para el rol
   */
  getRoleClass(role: string | { id: string | number; name: string; description?: string }): string {
    const roleName = typeof role === 'string' ? role : role.name;
    return roleName.toLowerCase();
  }

  /**
   * Obtiene el texto a mostrar para el rol
   */
  getRoleDisplay(role: string | { id: string | number; name: string; description?: string }): string {
    const roleName = typeof role === 'string' ? role : role.name;
    const roleMap: { [key: string]: string } = {
      'superadmin': 'Super Admin',
      'admin': 'Administrador',
      'technology': 'Soporte Técnico',
      'user': 'Usuario'
    };
    return roleMap[roleName] || 'Usuario';
  }

  /**
   * Formatea el salario como moneda
   */
  formatCurrency(amount: number | undefined): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formatea una fecha
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-CO');
  }

  /**
   * Obtiene la clase CSS para el tipo de contrato
   */
  getContractClass(contractType: string | undefined): string {
    if (!contractType) return '';
    return contractType.toLowerCase().replace(' ', '_');
  }

  /**
   * Obtiene el texto a mostrar para el tipo de contrato
   */
  getContractDisplay(contractType: string | undefined): string {
    if (!contractType) return 'N/A';
    const contract = this.contractTypes.find(c => c.id === contractType);
    return contract ? contract.name : contractType;
  }

}
