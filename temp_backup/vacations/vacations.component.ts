import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

interface VacationDay {
  id: number;
  userId: number;
  year: number;
  totalDays: number;
  usedDays: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
  };
  vacationRequests: VacationRequest[];
}

interface VacationRequest {
  id: number;
  userId: number;
  vacationDayId: number;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  approvedBy?: number;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  approvedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

@Component({
  selector: 'app-vacations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule
  ],
  template: `
    <div class="vacations-container">
      <div class="vacations-header">
        <h1 class="vacations-title">Vacaciones</h1>
        <p class="vacations-subtitle">Gestión de días de vacaciones y solicitudes</p>
      </div>

      <!-- Resumen de días de vacaciones (solo para usuarios normales) -->
      <div *ngIf="!isAdmin()" class="vacation-summary">
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>beach_access</mat-icon>
              Mis Días de Vacaciones {{ currentYear }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-content">
              <div class="summary-item">
                <div class="summary-label">Días Totales</div>
                <div class="summary-value total">{{ userVacationDays?.totalDays || 0 }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Días Usados</div>
                <div class="summary-value used">{{ userVacationDays?.usedDays || 0 }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Días Disponibles</div>
                <div class="summary-value available">{{ getAvailableDays() }}</div>
              </div>
            </div>
            
            <div class="progress-section">
              <div class="progress-label">
                Progreso de vacaciones utilizadas
                <span class="progress-text">{{ getProgressPercentage() }}%</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="getProgressPercentage()"
                [color]="getProgressColor()">
              </mat-progress-bar>
            </div>

            <div class="summary-actions">
              <button mat-raised-button color="primary" (click)="openRequestDialog()">
                <mat-icon>add</mat-icon>
                Solicitar Vacaciones
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filtros (solo para admin) -->
      <div *ngIf="isAdmin()" class="filters-section">
        <mat-card class="filters-card">
          <mat-card-content>
            <div class="filters-row">
              <mat-form-field appearance="outline">
                <mat-label>Año</mat-label>
                <mat-select [(ngModel)]="selectedYear" (selectionChange)="loadVacationDays()">
                  <mat-option *ngFor="let year of availableYears" [value]="year">
                    {{ year }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Buscar empleado</mat-label>
                <input matInput 
                       [(ngModel)]="searchTerm" 
                       (input)="filterVacationDays()"
                       placeholder="Nombre del empleado">
              </mat-form-field>

              <button mat-raised-button color="accent" (click)="exportVacationReport()">
                <mat-icon>download</mat-icon>
                Exportar Reporte
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabla de vacaciones -->
      <div class="vacation-table-section">
        <mat-card class="vacation-table-card">
          <mat-card-header>
            <mat-card-title>
              {{ isAdmin() ? 'Vacaciones de Empleados' : 'Mis Solicitudes de Vacaciones' }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="table-container">
              <!-- Vista para usuarios normales -->
              <div *ngIf="!isAdmin()" class="user-requests">
                <div *ngIf="userRequests.length === 0" class="no-requests">
                  <mat-icon>beach_access</mat-icon>
                  <p>No tienes solicitudes de vacaciones</p>
                  <button mat-raised-button color="primary" (click)="openRequestDialog()">
                    <mat-icon>add</mat-icon>
                    Nueva Solicitud
                  </button>
                </div>

                <div *ngFor="let request of userRequests" class="request-item">
                  <div class="request-header">
                    <div class="request-info">
                      <span class="request-dates">
                        {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
                      </span>
                      <span class="request-days">{{ request.days }} día{{ request.days > 1 ? 's' : '' }}</span>
                    </div>
                    <mat-chip [class]="'status-' + request.status">
                      {{ getStatusDisplay(request.status) }}
                    </mat-chip>
                  </div>
                  
                  <div *ngIf="request.reason" class="request-reason">
                    <strong>Motivo:</strong> {{ request.reason }}
                  </div>
                  
                  <div class="request-meta">
                    <span class="request-date">
                      Solicitud creada: {{ formatDate(request.createdAt) }}
                    </span>
                    <span *ngIf="request.approvedAt" class="request-approved">
                      Aprobada: {{ formatDate(request.approvedAt) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Vista para admin -->
              <table *ngIf="isAdmin()" mat-table [dataSource]="filteredVacationDays" class="vacation-table">
                <!-- Empleado -->
                <ng-container matColumnDef="employee">
                  <th mat-header-cell *matHeaderCellDef>Empleado</th>
                  <td mat-cell *matCellDef="let vacation">
                    <div class="employee-info">
                      <span class="employee-name">{{ vacation.user.firstName }} {{ vacation.user.lastName }}</span>
                      <span class="employee-position">{{ vacation.user.position || 'Sin cargo' }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Días Totales -->
                <ng-container matColumnDef="totalDays">
                  <th mat-header-cell *matHeaderCellDef>Días Totales</th>
                  <td mat-cell *matCellDef="let vacation">
                    <span class="total-days">{{ vacation.totalDays }}</span>
                  </td>
                </ng-container>

                <!-- Días Usados -->
                <ng-container matColumnDef="usedDays">
                  <th mat-header-cell *matHeaderCellDef>Días Usados</th>
                  <td mat-cell *matCellDef="let vacation">
                    <span class="used-days">{{ vacation.usedDays }}</span>
                  </td>
                </ng-container>

                <!-- Días Disponibles -->
                <ng-container matColumnDef="availableDays">
                  <th mat-header-cell *matHeaderCellDef>Días Disponibles</th>
                  <td mat-cell *matCellDef="let vacation">
                    <span class="available-days">{{ vacation.totalDays - vacation.usedDays }}</span>
                  </td>
                </ng-container>

                <!-- Progreso -->
                <ng-container matColumnDef="progress">
                  <th mat-header-cell *matHeaderCellDef>Progreso</th>
                  <td mat-cell *matCellDef="let vacation">
                    <div class="progress-container">
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="getVacationProgress(vacation)"
                        [color]="getVacationProgressColor(vacation)">
                      </mat-progress-bar>
                      <span class="progress-text">{{ getVacationProgress(vacation) }}%</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Solicitudes -->
                <ng-container matColumnDef="requests">
                  <th mat-header-cell *matHeaderCellDef>Solicitudes</th>
                  <td mat-cell *matCellDef="let vacation">
                    <button mat-icon-button 
                            matTooltip="Ver solicitudes"
                            (click)="viewRequests(vacation)">
                      <mat-icon>list</mat-icon>
                      <span class="request-count">{{ vacation.vacationRequests.length }}</span>
                    </button>
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let vacation">
                    <button mat-icon-button 
                            matTooltip="Editar días"
                            (click)="editVacationDays(vacation)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button 
                            matTooltip="Ver historial"
                            (click)="viewHistory(vacation)">
                      <mat-icon>history</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="adminDisplayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: adminDisplayedColumns;"></tr>
              </table>

              <div *ngIf="isAdmin() && filteredVacationDays.length === 0" class="no-data">
                <mat-icon>people_outline</mat-icon>
                <p>No hay datos de vacaciones para mostrar</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- Dialog para solicitar vacaciones -->
    <ng-template #requestDialog>
      <div class="request-dialog">
        <h2 mat-dialog-title>Solicitar Vacaciones</h2>
        <mat-dialog-content>
          <form [formGroup]="vacationRequestForm" class="request-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Fecha de inicio</mat-label>
                <input matInput 
                       [matDatepicker]="startPicker" 
                       formControlName="startDate"
                       (dateChange)="onStartDateChange()">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error *ngIf="vacationRequestForm.get('startDate')?.hasError('required')">
                  La fecha de inicio es requerida
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha de fin</mat-label>
                <input matInput 
                       [matDatepicker]="endPicker" 
                       formControlName="endDate"
                       (dateChange)="onEndDateChange()">
                <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
                <mat-error *ngIf="vacationRequestForm.get('endDate')?.hasError('required')">
                  La fecha de fin es requerida
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Días solicitados</mat-label>
                <input matInput 
                       formControlName="days" 
                       readonly
                       placeholder="Se calcula automáticamente">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Días disponibles</mat-label>
                <input matInput 
                       [value]="getAvailableDays()" 
                       readonly
                       placeholder="Días restantes">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Motivo (opcional)</mat-label>
              <textarea matInput 
                        formControlName="reason" 
                        rows="3"
                        placeholder="Describe el motivo de tu solicitud de vacaciones">
              </textarea>
            </mat-form-field>

            <div *ngIf="requestMessage" class="request-message" [class.error]="!canRequest">
              <mat-icon>{{ canRequest ? 'info' : 'warning' }}</mat-icon>
              {{ requestMessage }}
            </div>
          </form>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeRequestDialog()">Cancelar</button>
          <button mat-raised-button 
                  color="primary" 
                  (click)="submitVacationRequest()"
                  [disabled]="vacationRequestForm.invalid || !canRequest">
            Enviar Solicitud
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>

    <!-- Dialog para ver solicitudes de un empleado -->
    <ng-template #requestsDialog>
      <div class="requests-dialog">
        <h2 mat-dialog-title>
          Solicitudes de {{ selectedVacation?.user.firstName }} {{ selectedVacation?.user.lastName }}
        </h2>
        <mat-dialog-content>
          <div class="requests-list">
            <div *ngIf="selectedVacation?.vacationRequests.length === 0" class="no-requests">
              <mat-icon>beach_access</mat-icon>
              <p>No hay solicitudes de vacaciones</p>
            </div>

            <div *ngFor="let request of selectedVacation?.vacationRequests" class="request-item">
              <div class="request-header">
                <div class="request-info">
                  <span class="request-dates">
                    {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
                  </span>
                  <span class="request-days">{{ request.days }} día{{ request.days > 1 ? 's' : '' }}</span>
                </div>
                <mat-chip [class]="'status-' + request.status">
                  {{ getStatusDisplay(request.status) }}
                </mat-chip>
              </div>
              
              <div *ngIf="request.reason" class="request-reason">
                <strong>Motivo:</strong> {{ request.reason }}
              </div>
              
              <div class="request-meta">
                <span class="request-date">
                  Solicitud: {{ formatDate(request.createdAt) }}
                </span>
                <span *ngIf="request.approvedAt" class="request-approved">
                  Aprobada: {{ formatDate(request.approvedAt) }}
                </span>
              </div>

              <div class="request-actions">
                <button *ngIf="request.status === 'pending'" 
                        mat-raised-button 
                        color="primary"
                        (click)="approveRequest(request)">
                  <mat-icon>check</mat-icon>
                  Aprobar
                </button>
                <button *ngIf="request.status === 'pending'" 
                        mat-raised-button 
                        color="warn"
                        (click)="rejectRequest(request)">
                  <mat-icon>close</mat-icon>
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeRequestsDialog()">Cerrar</button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .vacations-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .vacations-header {
      margin-bottom: 24px;
    }

    .vacations-title {
      font-size: 2rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .vacations-subtitle {
      color: #7f8c8d;
      margin: 0;
    }

    .vacation-summary {
      margin-bottom: 24px;
    }

    .summary-card {
      border-radius: 12px;
    }

    .summary-content {
      display: flex;
      gap: 32px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 120px;
    }

    .summary-label {
      font-size: 14px;
      color: #7f8c8d;
      margin-bottom: 8px;
    }

    .summary-value {
      font-size: 2rem;
      font-weight: 600;
    }

    .summary-value.total {
      color: #3498db;
    }

    .summary-value.used {
      color: #e67e22;
    }

    .summary-value.available {
      color: #27ae60;
    }

    .progress-section {
      margin-bottom: 24px;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
      color: #2c3e50;
    }

    .progress-text {
      font-weight: 500;
    }

    .summary-actions {
      display: flex;
      justify-content: center;
    }

    .filters-section {
      margin-bottom: 24px;
    }

    .filters-card {
      border-radius: 12px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .filters-row mat-form-field {
      min-width: 150px;
    }

    .vacation-table-section {
      margin-bottom: 24px;
    }

    .vacation-table-card {
      border-radius: 12px;
    }

    .table-container {
      overflow-x: auto;
    }

    .user-requests {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .no-requests,
    .no-data {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .no-requests mat-icon,
    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .request-item {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 16px;
      transition: box-shadow 0.2s;
    }

    .request-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .request-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .request-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .request-dates {
      font-weight: 500;
      color: #2c3e50;
    }

    .request-days {
      font-size: 12px;
      color: #7f8c8d;
    }

    .request-reason {
      margin-bottom: 8px;
      color: #34495e;
    }

    .request-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #7f8c8d;
    }

    .request-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .status-pending { background: #f39c12; color: white; }
    .status-approved { background: #27ae60; color: white; }
    .status-rejected { background: #e74c3c; color: white; }

    .vacation-table {
      width: 100%;
    }

    .employee-info {
      display: flex;
      flex-direction: column;
    }

    .employee-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .employee-position {
      font-size: 12px;
      color: #7f8c8d;
    }

    .total-days { color: #3498db; font-weight: 500; }
    .used-days { color: #e67e22; font-weight: 500; }
    .available-days { color: #27ae60; font-weight: 500; }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-container mat-progress-bar {
      flex: 1;
    }

    .request-count {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
    }

    .request-dialog {
      min-width: 600px;
    }

    .request-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .request-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .request-message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .requests-dialog {
      min-width: 700px;
      max-width: 900px;
    }

    .requests-list {
      max-height: 500px;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .vacations-container {
        padding: 16px;
      }
      
      .summary-content {
        flex-direction: column;
        align-items: center;
      }
      
      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }
      
      .form-row {
        flex-direction: column;
      }
      
      .request-dialog,
      .requests-dialog {
        min-width: auto;
        width: 90vw;
      }
    }
  `]
})
export class VacationsComponent implements OnInit {
  // Datos del usuario actual
  userVacationDays: VacationDay | null = null;
  userRequests: VacationRequest[] = [];
  
  // Datos para admin
  allVacationDays: VacationDay[] = [];
  filteredVacationDays: VacationDay[] = [];
  selectedVacation: VacationDay | null = null;
  
  // Filtros
  selectedYear = new Date().getFullYear();
  searchTerm = '';
  availableYears: number[] = [];
  
  // Formulario
  vacationRequestForm: FormGroup;
  requestMessage = '';
  canRequest = true;
  
  // Constantes
  currentYear = new Date().getFullYear();
  
  adminDisplayedColumns = ['employee', 'totalDays', 'usedDays', 'availableDays', 'progress', 'requests', 'actions'];

  @ViewChild('requestDialog') requestDialog: any;
  @ViewChild('requestsDialog') requestsDialog: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.vacationRequestForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      days: [0],
      reason: ['']
    });
    
    // Generar años disponibles (últimos 3 años y próximos 2)
    for (let i = this.currentYear - 3; i <= this.currentYear + 2; i++) {
      this.availableYears.push(i);
    }
  }

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.loadVacationDays();
    } else {
      this.loadUserVacationData();
    }
  }

  /**
   * Carga los datos de vacaciones del usuario actual
   */
  loadUserVacationData(): void {
    // Cargar días de vacaciones
    this.apiService.getVacationDays().subscribe({
      next: (vacationDays) => {
        this.userVacationDays = vacationDays;
      },
      error: (error) => {
        console.error('Error cargando días de vacaciones:', error);
        this.snackBar.open('Error cargando días de vacaciones', 'Cerrar', { duration: 3000 });
      }
    });

    // Cargar solicitudes del usuario (simulado por ahora)
    this.loadUserRequests();
  }

  /**
   * Carga todas las vacaciones (admin)
   */
  loadVacationDays(): void {
    this.apiService.getAllVacations().subscribe({
      next: (vacationDays) => {
        this.allVacationDays = vacationDays;
        this.filterVacationDays();
      },
      error: (error) => {
        console.error('Error cargando vacaciones:', error);
        this.snackBar.open('Error cargando vacaciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Carga las solicitudes del usuario (simulado)
   */
  loadUserRequests(): void {
    // Simular solicitudes del usuario
    this.userRequests = [
      {
        id: 1,
        userId: this.authService.getCurrentUser()?.id || 0,
        vacationDayId: 1,
        startDate: '2024-12-23',
        endDate: '2024-12-27',
        days: 5,
        reason: 'Vacaciones de fin de año',
        status: 'approved',
        approvedAt: '2024-12-01',
        createdAt: '2024-11-15',
        updatedAt: '2024-12-01',
        approvedByUser: {
          id: 1,
          firstName: 'Admin',
          lastName: 'Usuario'
        }
      },
      {
        id: 2,
        userId: this.authService.getCurrentUser()?.id || 0,
        vacationDayId: 1,
        startDate: '2024-08-15',
        endDate: '2024-08-16',
        days: 2,
        reason: 'Días personales',
        status: 'pending',
        createdAt: '2024-08-01',
        updatedAt: '2024-08-01'
      }
    ];
  }

  /**
   * Filtra las vacaciones según los criterios
   */
  filterVacationDays(): void {
    this.filteredVacationDays = this.allVacationDays.filter(vacation => {
      const yearMatch = vacation.year === this.selectedYear;
      const searchMatch = !this.searchTerm || 
        `${vacation.user.firstName} ${vacation.user.lastName}`.toLowerCase()
          .includes(this.searchTerm.toLowerCase());
      
      return yearMatch && searchMatch;
    });
  }

  /**
   * Abre el dialog para solicitar vacaciones
   */
  openRequestDialog(): void {
    this.vacationRequestForm.reset({
      startDate: '',
      endDate: '',
      days: 0,
      reason: ''
    });
    this.requestMessage = '';
    this.canRequest = true;
    
    this.dialog.open(this.requestDialog, {
      width: '600px',
      maxWidth: '90vw'
    });
  }

  /**
   * Maneja el cambio de fecha de inicio
   */
  onStartDateChange(): void {
    this.calculateDays();
    this.validateRequest();
  }

  /**
   * Maneja el cambio de fecha de fin
   */
  onEndDateChange(): void {
    this.calculateDays();
    this.validateRequest();
  }

  /**
   * Calcula los días entre las fechas
   */
  calculateDays(): void {
    const startDate = this.vacationRequestForm.get('startDate')?.value;
    const endDate = this.vacationRequestForm.get('endDate')?.value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
      
      this.vacationRequestForm.patchValue({ days: diffDays });
    }
  }

  /**
   * Valida la solicitud de vacaciones
   */
  validateRequest(): void {
    const days = this.vacationRequestForm.get('days')?.value;
    const availableDays = this.getAvailableDays();
    
    if (days > 0) {
      if (days > availableDays) {
        this.requestMessage = `No tienes suficientes días disponibles. Solicitas: ${days}, Disponibles: ${availableDays}`;
        this.canRequest = false;
      } else {
        this.requestMessage = `Solicitud válida. Días solicitados: ${days}, Días restantes: ${availableDays - days}`;
        this.canRequest = true;
      }
    } else {
      this.requestMessage = '';
      this.canRequest = true;
    }
  }

  /**
   * Envía la solicitud de vacaciones
   */
  submitVacationRequest(): void {
    if (this.vacationRequestForm.valid && this.canRequest) {
      const formValue = this.vacationRequestForm.value;
      
      const requestData = {
        startDate: formValue.startDate.toISOString(),
        endDate: formValue.endDate.toISOString(),
        reason: formValue.reason
      };
      
      this.apiService.createVacationRequest(requestData).subscribe({
        next: (newRequest) => {
          this.snackBar.open('Solicitud de vacaciones enviada correctamente', 'Cerrar', { duration: 3000 });
          this.loadUserVacationData();
          this.closeRequestDialog();
        },
        error: (error) => {
          console.error('Error enviando solicitud:', error);
          this.snackBar.open('Error enviando solicitud', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  /**
   * Ve las solicitudes de un empleado
   */
  viewRequests(vacation: VacationDay): void {
    this.selectedVacation = vacation;
    this.dialog.open(this.requestsDialog, {
      width: '800px',
      maxWidth: '90vw'
    });
  }

  /**
   * Aprueba una solicitud de vacaciones
   */
  approveRequest(request: VacationRequest): void {
    if (confirm('¿Estás seguro de que quieres aprobar esta solicitud?')) {
      // Simular aprobación
      request.status = 'approved';
      request.approvedAt = new Date().toISOString();
      
      this.snackBar.open('Solicitud aprobada correctamente', 'Cerrar', { duration: 3000 });
      
      // Aquí se actualizaría en el backend
      // this.apiService.approveVacationRequest(request.id).subscribe(...)
    }
  }

  /**
   * Rechaza una solicitud de vacaciones
   */
  rejectRequest(request: VacationRequest): void {
    if (confirm('¿Estás seguro de que quieres rechazar esta solicitud?')) {
      // Simular rechazo
      request.status = 'rejected';
      
      this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
      
      // Aquí se actualizaría en el backend
      // this.apiService.rejectVacationRequest(request.id).subscribe(...)
    }
  }

  /**
   * Edita los días de vacaciones de un empleado
   */
  editVacationDays(vacation: VacationDay): void {
    // Implementar edición de días de vacaciones
    console.log('Editar días de vacaciones:', vacation);
  }

  /**
   * Ve el historial de vacaciones
   */
  viewHistory(vacation: VacationDay): void {
    // Implementar vista de historial
    console.log('Ver historial:', vacation);
  }

  /**
   * Exporta el reporte de vacaciones
   */
  exportVacationReport(): void {
    // Implementar exportación de reporte
    console.log('Exportar reporte de vacaciones');
  }

  /**
   * Cierra el dialog de solicitud
   */
  closeRequestDialog(): void {
    this.dialog.closeAll();
  }

  /**
   * Cierra el dialog de solicitudes
   */
  closeRequestsDialog(): void {
    this.dialog.closeAll();
  }

  /**
   * Verifica si el usuario es admin
   */
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /**
   * Obtiene los días disponibles del usuario
   */
  getAvailableDays(): number {
    if (!this.userVacationDays) return 0;
    return this.userVacationDays.totalDays - this.userVacationDays.usedDays;
  }

  /**
   * Calcula el porcentaje de progreso de vacaciones
   */
  getProgressPercentage(): number {
    if (!this.userVacationDays || this.userVacationDays.totalDays === 0) return 0;
    return Math.round((this.userVacationDays.usedDays / this.userVacationDays.totalDays) * 100);
  }

  /**
   * Obtiene el color del progreso
   */
  getProgressColor(): string {
    const percentage = this.getProgressPercentage();
    if (percentage < 50) return 'primary';
    if (percentage < 80) return 'accent';
    return 'warn';
  }

  /**
   * Calcula el progreso de vacaciones para un empleado
   */
  getVacationProgress(vacation: VacationDay): number {
    if (vacation.totalDays === 0) return 0;
    return Math.round((vacation.usedDays / vacation.totalDays) * 100);
  }

  /**
   * Obtiene el color del progreso para un empleado
   */
  getVacationProgressColor(vacation: VacationDay): string {
    const percentage = this.getVacationProgress(vacation);
    if (percentage < 50) return 'primary';
    if (percentage < 80) return 'accent';
    return 'warn';
  }

  /**
   * Obtiene el texto de estado para mostrar
   */
  getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada'
    };
    return statusMap[status] || status;
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
