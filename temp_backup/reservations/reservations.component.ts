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
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

interface Reservation {
  id: number;
  userId: number;
  resourceId: number;
  startDate: string;
  endDate: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  resource: {
    id: number;
    name: string;
    description?: string;
    type: string;
    location?: string;
    capacity?: number;
  };
}

interface Resource {
  id: number;
  name: string;
  description?: string;
  type: string;
  location?: string;
  capacity?: number;
  isActive: boolean;
}

@Component({
  selector: 'app-reservations',
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
    MatNativeDateModule
  ],
  template: `
    <div class="reservations-container">
      <div class="reservations-header">
        <h1 class="reservations-title">Reservas</h1>
        <p class="reservations-subtitle">Gestión de reservas de recursos y salas</p>
      </div>

      <!-- Filtros -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline">
              <mat-label>Recurso</mat-label>
              <mat-select [(ngModel)]="selectedResource" (selectionChange)="filterReservations()">
                <mat-option value="">Todos</mat-option>
                <mat-option *ngFor="let resource of resources" [value]="resource.id">
                  {{ resource.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="filterReservations()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="confirmed">Confirmada</mat-option>
                <mat-option value="cancelled">Cancelada</mat-option>
                <mat-option value="completed">Completada</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon>
              Nueva Reserva
            </button>

            <button mat-raised-button color="accent" (click)="openCalendarView()">
              <mat-icon>calendar_today</mat-icon>
              Ver Calendario
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de Reservas -->
      <mat-card class="reservations-table-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="filteredReservations" class="reservations-table">
              <!-- Título -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Título</th>
                <td mat-cell *matCellDef="let reservation">
                  <div class="reservation-title">
                    <span class="title-text">{{ reservation.title }}</span>
                    <span class="reservation-id">#{{ reservation.id }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Recurso -->
              <ng-container matColumnDef="resource">
                <th mat-header-cell *matHeaderCellDef>Recurso</th>
                <td mat-cell *matCellDef="let reservation">
                  <div class="resource-info">
                    <span class="resource-name">{{ reservation.resource.name }}</span>
                    <span class="resource-location">{{ reservation.resource.location }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Fecha y Hora -->
              <ng-container matColumnDef="datetime">
                <th mat-header-cell *matHeaderCellDef>Fecha y Hora</th>
                <td mat-cell *matCellDef="let reservation">
                  <div class="datetime-info">
                    <span class="date">{{ formatDate(reservation.startDate) }}</span>
                    <span class="time">{{ formatTime(reservation.startDate) }} - {{ formatTime(reservation.endDate) }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Usuario -->
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>Usuario</th>
                <td mat-cell *matCellDef="let reservation">
                  {{ reservation.user.firstName }} {{ reservation.user.lastName }}
                </td>
              </ng-container>

              <!-- Estado -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let reservation">
                  <mat-chip [class]="'status-' + reservation.status">
                    {{ getStatusDisplay(reservation.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Capacidad -->
              <ng-container matColumnDef="capacity">
                <th mat-header-cell *matHeaderCellDef>Capacidad</th>
                <td mat-cell *matCellDef="let reservation">
                  <span *ngIf="reservation.resource.capacity">{{ reservation.resource.capacity }} personas</span>
                  <span *ngIf="!reservation.resource.capacity">-</span>
                </td>
              </ng-container>

              <!-- Acciones -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let reservation">
                  <button mat-icon-button 
                          matTooltip="Ver detalles"
                          (click)="viewReservation(reservation)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button 
                          *ngIf="canEditReservation(reservation)"
                          matTooltip="Editar"
                          (click)="editReservation(reservation)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          *ngIf="canCancelReservation(reservation)"
                          matTooltip="Cancelar"
                          (click)="cancelReservation(reservation)">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div *ngIf="filteredReservations.length === 0" class="no-reservations">
              <mat-icon>event_busy</mat-icon>
              <p>No hay reservas que coincidan con los filtros</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Dialog para crear/editar reserva -->
    <ng-template #reservationDialog>
      <div class="reservation-dialog">
        <h2 mat-dialog-title>{{ isEditing ? 'Editar Reserva' : 'Nueva Reserva' }}</h2>
        <mat-dialog-content>
          <form [formGroup]="reservationForm" class="reservation-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Título de la reserva</mat-label>
              <input matInput formControlName="title" placeholder="Ej: Reunión de equipo">
              <mat-error *ngIf="reservationForm.get('title')?.hasError('required')">
                El título es requerido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción (opcional)</mat-label>
              <textarea matInput 
                        formControlName="description" 
                        rows="3"
                        placeholder="Descripción de la reserva">
              </textarea>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Recurso</mat-label>
                <mat-select formControlName="resourceId" (selectionChange)="onResourceChange()">
                  <mat-option *ngFor="let resource of availableResources" [value]="resource.id">
                    {{ resource.name }} - {{ resource.location }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="reservationForm.get('resourceId')?.hasError('required')">
                  El recurso es requerido
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" *ngIf="selectedResourceInfo">
                <mat-label>Capacidad</mat-label>
                <input matInput [value]="selectedResourceInfo.capacity + ' personas'" readonly>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Fecha de inicio</mat-label>
                <input matInput 
                       [matDatepicker]="startPicker" 
                       formControlName="startDate"
                       (dateChange)="onStartDateChange()">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error *ngIf="reservationForm.get('startDate')?.hasError('required')">
                  La fecha de inicio es requerida
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hora de inicio</mat-label>
                <input matInput 
                       type="time" 
                       formControlName="startTime"
                       (change)="onTimeChange()">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Fecha de fin</mat-label>
                <input matInput 
                       [matDatepicker]="endPicker" 
                       formControlName="endDate"
                       (dateChange)="onEndDateChange()">
                <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
                <mat-error *ngIf="reservationForm.get('endDate')?.hasError('required')">
                  La fecha de fin es requerida
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hora de fin</mat-label>
                <input matInput 
                       type="time" 
                       formControlName="endTime"
                       (change)="onTimeChange()">
              </mat-form-field>
            </div>

            <div *ngIf="availabilityMessage" class="availability-message" [class.error]="!isAvailable">
              <mat-icon>{{ isAvailable ? 'check_circle' : 'error' }}</mat-icon>
              {{ availabilityMessage }}
            </div>
          </form>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeDialog()">Cancelar</button>
          <button mat-raised-button 
                  color="primary" 
                  (click)="saveReservation()"
                  [disabled]="reservationForm.invalid || !isAvailable">
            {{ isEditing ? 'Actualizar' : 'Crear' }}
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>

    <!-- Dialog para ver detalles de la reserva -->
    <ng-template #reservationDetailsDialog>
      <div class="reservation-details-dialog">
        <h2 mat-dialog-title>
          <span class="reservation-title">{{ selectedReservation?.title }}</span>
          <span class="reservation-id">#{{ selectedReservation?.id }}</span>
        </h2>
        <mat-dialog-content>
          <div class="reservation-details">
            <div class="reservation-info">
              <div class="info-row">
                <span class="info-label">Recurso:</span>
                <span>{{ selectedReservation?.resource.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Ubicación:</span>
                <span>{{ selectedReservation?.resource.location }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Capacidad:</span>
                <span>{{ selectedReservation?.resource.capacity || 'No especificada' }} personas</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span>{{ formatDate(selectedReservation?.startDate || '') }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Horario:</span>
                <span>{{ formatTime(selectedReservation?.startDate || '') }} - {{ formatTime(selectedReservation?.endDate || '') }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Duración:</span>
                <span>{{ getDuration(selectedReservation?.startDate || '', selectedReservation?.endDate || '') }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Usuario:</span>
                <span>{{ selectedReservation?.user.firstName }} {{ selectedReservation?.user.lastName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Estado:</span>
                <mat-chip [class]="'status-' + selectedReservation?.status">
                  {{ getStatusDisplay(selectedReservation?.status || '') }}
                </mat-chip>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de creación:</span>
                <span>{{ formatDate(selectedReservation?.createdAt || '') }}</span>
              </div>
            </div>

            <div *ngIf="selectedReservation?.description" class="reservation-description">
              <h4>Descripción</h4>
              <p>{{ selectedReservation.description }}</p>
            </div>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeDetailsDialog()">Cerrar</button>
          <button *ngIf="canEditReservation(selectedReservation!)" 
                  mat-raised-button 
                  color="primary" 
                  (click)="editReservation(selectedReservation!)">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
          <button *ngIf="canCancelReservation(selectedReservation!)" 
                  mat-raised-button 
                  color="warn" 
                  (click)="cancelReservation(selectedReservation!)">
            <mat-icon>cancel</mat-icon>
            Cancelar
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>

    <!-- Dialog de vista de calendario -->
    <ng-template #calendarDialog>
      <div class="calendar-dialog">
        <h2 mat-dialog-title>Vista de Calendario</h2>
        <mat-dialog-content>
          <div class="calendar-view">
            <div class="calendar-header">
              <button mat-icon-button (click)="previousMonth()">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <h3>{{ getCurrentMonthYear() }}</h3>
              <button mat-icon-button (click)="nextMonth()">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
            
            <div class="calendar-grid">
              <div class="calendar-day" 
                   *ngFor="let day of calendarDays" 
                   [class.other-month]="!day.isCurrentMonth"
                   [class.has-reservations]="day.reservations.length > 0"
                   (click)="selectDay(day)">
                <div class="day-number">{{ day.day }}</div>
                <div class="day-reservations">
                  <div *ngFor="let reservation of day.reservations.slice(0, 2)" 
                       class="reservation-dot"
                       [title]="reservation.title">
                  </div>
                  <div *ngIf="day.reservations.length > 2" class="more-reservations">
                    +{{ day.reservations.length - 2 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeCalendarDialog()">Cerrar</button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .reservations-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .reservations-header {
      margin-bottom: 24px;
    }

    .reservations-title {
      font-size: 2rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .reservations-subtitle {
      color: #7f8c8d;
      margin: 0;
    }

    .filters-card {
      margin-bottom: 24px;
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

    .reservations-table-card {
      margin-bottom: 24px;
    }

    .table-container {
      overflow-x: auto;
    }

    .reservations-table {
      width: 100%;
    }

    .reservation-title {
      display: flex;
      flex-direction: column;
    }

    .title-text {
      font-weight: 500;
      color: #2c3e50;
    }

    .reservation-id {
      font-size: 12px;
      color: #7f8c8d;
    }

    .resource-info {
      display: flex;
      flex-direction: column;
    }

    .resource-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .resource-location {
      font-size: 12px;
      color: #7f8c8d;
    }

    .datetime-info {
      display: flex;
      flex-direction: column;
    }

    .date {
      font-weight: 500;
      color: #2c3e50;
    }

    .time {
      font-size: 12px;
      color: #7f8c8d;
    }

    .status-confirmed { background: #27ae60; color: white; }
    .status-cancelled { background: #e74c3c; color: white; }
    .status-completed { background: #95a5a6; color: white; }

    .no-reservations {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .no-reservations mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .reservation-dialog {
      min-width: 600px;
    }

    .reservation-form {
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

    .availability-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .availability-message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .reservation-details-dialog {
      min-width: 600px;
      max-width: 800px;
    }

    .reservation-details {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .reservation-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .info-label {
      font-weight: 500;
      color: #2c3e50;
      min-width: 120px;
    }

    .reservation-description h4 {
      color: #2c3e50;
      margin: 0 0 12px 0;
    }

    .reservation-description p {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin: 0;
      line-height: 1.6;
    }

    .calendar-dialog {
      min-width: 800px;
      max-width: 1000px;
    }

    .calendar-view {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: #e9ecef;
      border: 1px solid #e9ecef;
    }

    .calendar-day {
      background: white;
      min-height: 100px;
      padding: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .calendar-day:hover {
      background: #f8f9fa;
    }

    .calendar-day.other-month {
      background: #f8f9fa;
      color: #adb5bd;
    }

    .calendar-day.has-reservations {
      background: #e3f2fd;
    }

    .day-number {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .day-reservations {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .reservation-dot {
      width: 8px;
      height: 8px;
      background: #2196f3;
      border-radius: 50%;
    }

    .more-reservations {
      font-size: 10px;
      color: #666;
    }

    @media (max-width: 768px) {
      .reservations-container {
        padding: 16px;
      }
      
      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }
      
      .form-row {
        flex-direction: column;
      }
      
      .reservation-dialog,
      .reservation-details-dialog,
      .calendar-dialog {
        min-width: auto;
        width: 90vw;
      }
    }
  `]
})
export class ReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  resources: Resource[] = [];
  availableResources: Resource[] = [];
  selectedReservation: Reservation | null = null;
  selectedResourceInfo: Resource | null = null;
  
  // Filtros
  selectedResource = '';
  selectedStatus = '';
  
  // Formulario
  reservationForm: FormGroup;
  isEditing = false;
  currentReservationId: number | null = null;
  
  // Disponibilidad
  availabilityMessage = '';
  isAvailable = true;
  
  // Calendario
  currentDate = new Date();
  calendarDays: any[] = [];
  
  displayedColumns = ['title', 'resource', 'datetime', 'user', 'status', 'capacity', 'actions'];

  @ViewChild('reservationDialog') reservationDialog: any;
  @ViewChild('reservationDetailsDialog') reservationDetailsDialog: any;
  @ViewChild('calendarDialog') calendarDialog: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.reservationForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      resourceId: ['', Validators.required],
      startDate: ['', Validators.required],
      startTime: ['09:00', Validators.required],
      endDate: ['', Validators.required],
      endTime: ['10:00', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadReservations();
    this.loadResources();
  }

  /**
   * Carga todas las reservas
   */
  loadReservations(): void {
    this.apiService.getReservations().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.filterReservations();
        this.generateCalendarDays();
      },
      error: (error) => {
        console.error('Error cargando reservas:', error);
        this.snackBar.open('Error cargando reservas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Carga todos los recursos disponibles
   */
  loadResources(): void {
    this.apiService.getResources().subscribe({
      next: (resources) => {
        this.resources = resources;
        this.availableResources = resources.filter(r => r.isActive);
      },
      error: (error) => {
        console.error('Error cargando recursos:', error);
        this.snackBar.open('Error cargando recursos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Filtra las reservas según los criterios seleccionados
   */
  filterReservations(): void {
    this.filteredReservations = this.reservations.filter(reservation => {
      const resourceMatch = !this.selectedResource || reservation.resourceId === parseInt(this.selectedResource);
      const statusMatch = !this.selectedStatus || reservation.status === this.selectedStatus;
      
      return resourceMatch && statusMatch;
    });
  }

  /**
   * Abre el dialog para crear una nueva reserva
   */
  openCreateDialog(): void {
    this.isEditing = false;
    this.currentReservationId = null;
    this.availabilityMessage = '';
    this.isAvailable = true;
    
    this.reservationForm.reset({
      title: '',
      description: '',
      resourceId: '',
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '10:00'
    });
    
    this.dialog.open(this.reservationDialog, {
      width: '700px',
      maxWidth: '90vw'
    });
  }

  /**
   * Abre el dialog para ver los detalles de la reserva
   */
  viewReservation(reservation: Reservation): void {
    this.selectedReservation = reservation;
    
    this.dialog.open(this.reservationDetailsDialog, {
      width: '700px',
      maxWidth: '90vw'
    });
  }

  /**
   * Abre el dialog para editar una reserva
   */
  editReservation(reservation: Reservation): void {
    this.isEditing = true;
    this.currentReservationId = reservation.id;
    this.selectedReservation = reservation;
    
    // Parsear fechas y horas
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    
    this.reservationForm.patchValue({
      title: reservation.title,
      description: reservation.description || '',
      resourceId: reservation.resourceId,
      startDate: startDate,
      startTime: this.formatTimeForInput(startDate),
      endDate: endDate,
      endTime: this.formatTimeForInput(endDate)
    });
    
    this.onResourceChange();
    this.checkAvailability();
    
    this.dialog.open(this.reservationDialog, {
      width: '700px',
      maxWidth: '90vw'
    });
  }

  /**
   * Guarda la reserva (crear o actualizar)
   */
  saveReservation(): void {
    if (this.reservationForm.valid && this.isAvailable) {
      const formValue = this.reservationForm.value;
      
      // Combinar fecha y hora
      const startDateTime = this.combineDateAndTime(formValue.startDate, formValue.startTime);
      const endDateTime = this.combineDateAndTime(formValue.endDate, formValue.endTime);
      
      const reservationData = {
        title: formValue.title,
        description: formValue.description,
        resourceId: formValue.resourceId,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString()
      };
      
      if (this.isEditing && this.currentReservationId) {
        // Actualizar reserva existente
        this.apiService.updateReservation(this.currentReservationId, reservationData).subscribe({
          next: (updatedReservation) => {
            this.snackBar.open('Reserva actualizada correctamente', 'Cerrar', { duration: 3000 });
            this.loadReservations();
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error actualizando reserva:', error);
            this.snackBar.open('Error actualizando reserva', 'Cerrar', { duration: 3000 });
          }
        });
      } else {
        // Crear nueva reserva
        this.apiService.createReservation(reservationData).subscribe({
          next: (newReservation) => {
            this.snackBar.open('Reserva creada correctamente', 'Cerrar', { duration: 3000 });
            this.loadReservations();
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error creando reserva:', error);
            this.snackBar.open('Error creando reserva', 'Cerrar', { duration: 3000 });
          }
        });
      }
    }
  }

  /**
   * Cancela una reserva
   */
  cancelReservation(reservation: Reservation): void {
    if (confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      this.apiService.updateReservation(reservation.id, { status: 'cancelled' }).subscribe({
        next: (updatedReservation) => {
          this.snackBar.open('Reserva cancelada correctamente', 'Cerrar', { duration: 3000 });
          this.loadReservations();
          this.closeDetailsDialog();
        },
        error: (error) => {
          console.error('Error cancelando reserva:', error);
          this.snackBar.open('Error cancelando reserva', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  /**
   * Maneja el cambio de recurso
   */
  onResourceChange(): void {
    const resourceId = this.reservationForm.get('resourceId')?.value;
    this.selectedResourceInfo = this.resources.find(r => r.id === resourceId) || null;
    
    if (this.isEditing || this.reservationForm.get('startDate')?.value) {
      this.checkAvailability();
    }
  }

  /**
   * Maneja el cambio de fecha de inicio
   */
  onStartDateChange(): void {
    const startDate = this.reservationForm.get('startDate')?.value;
    if (startDate) {
      // Establecer fecha de fin como la misma fecha si no está definida
      if (!this.reservationForm.get('endDate')?.value) {
        this.reservationForm.patchValue({ endDate: startDate });
      }
      this.checkAvailability();
    }
  }

  /**
   * Maneja el cambio de fecha de fin
   */
  onEndDateChange(): void {
    this.checkAvailability();
  }

  /**
   * Maneja el cambio de hora
   */
  onTimeChange(): void {
    this.checkAvailability();
  }

  /**
   * Verifica la disponibilidad del recurso
   */
  checkAvailability(): void {
    const formValue = this.reservationForm.value;
    
    if (!formValue.resourceId || !formValue.startDate || !formValue.endDate || 
        !formValue.startTime || !formValue.endTime) {
      this.availabilityMessage = '';
      this.isAvailable = true;
      return;
    }
    
    const startDateTime = this.combineDateAndTime(formValue.startDate, formValue.startTime);
    const endDateTime = this.combineDateAndTime(formValue.endDate, formValue.endTime);
    
    // Validar que la fecha de fin no sea anterior a la de inicio
    if (endDateTime <= startDateTime) {
      this.availabilityMessage = 'La fecha de fin debe ser posterior a la fecha de inicio';
      this.isAvailable = false;
      return;
    }
    
    // Verificar conflictos con otras reservas
    const conflictingReservation = this.reservations.find(reservation => {
      if (this.isEditing && reservation.id === this.currentReservationId) {
        return false; // Excluir la reserva actual si estamos editando
      }
      
      if (reservation.resourceId !== formValue.resourceId || reservation.status === 'cancelled') {
        return false;
      }
      
      const existingStart = new Date(reservation.startDate);
      const existingEnd = new Date(reservation.endDate);
      
      return (startDateTime < existingEnd && endDateTime > existingStart);
    });
    
    if (conflictingReservation) {
      this.availabilityMessage = 'El recurso no está disponible en ese horario';
      this.isAvailable = false;
    } else {
      this.availabilityMessage = 'El recurso está disponible';
      this.isAvailable = true;
    }
  }

  /**
   * Abre la vista de calendario
   */
  openCalendarView(): void {
    this.generateCalendarDays();
    this.dialog.open(this.calendarDialog, {
      width: '900px',
      maxWidth: '95vw'
    });
  }

  /**
   * Genera los días del calendario
   */
  generateCalendarDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayReservations = this.reservations.filter(reservation => {
        const reservationDate = new Date(reservation.startDate);
        return reservationDate.toDateString() === date.toDateString();
      });
      
      this.calendarDays.push({
        day: date.getDate(),
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        reservations: dayReservations
      });
    }
  }

  /**
   * Navega al mes anterior
   */
  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendarDays();
  }

  /**
   * Navega al mes siguiente
   */
  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
  }

  /**
   * Selecciona un día del calendario
   */
  selectDay(day: any): void {
    if (day.reservations.length > 0) {
      // Mostrar las reservas del día
      console.log('Reservas del día:', day.reservations);
    }
  }

  /**
   * Obtiene el texto del mes y año actual
   */
  getCurrentMonthYear(): string {
    return this.currentDate.toLocaleDateString('es-CO', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  /**
   * Cierra el dialog de reserva
   */
  closeDialog(): void {
    this.dialog.closeAll();
  }

  /**
   * Cierra el dialog de detalles
   */
  closeDetailsDialog(): void {
    this.dialog.closeAll();
  }

  /**
   * Cierra el dialog de calendario
   */
  closeCalendarDialog(): void {
    this.dialog.closeAll();
  }

  /**
   * Verifica si el usuario puede editar una reserva
   */
  canEditReservation(reservation: Reservation): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Admin puede editar todas
    if (this.authService.isAdmin()) return true;
    
    // Usuario puede editar solo sus propias reservas si están confirmadas
    return reservation.userId === currentUser.id && reservation.status === 'confirmed';
  }

  /**
   * Verifica si el usuario puede cancelar una reserva
   */
  canCancelReservation(reservation: Reservation): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Admin puede cancelar todas
    if (this.authService.isAdmin()) return true;
    
    // Usuario puede cancelar solo sus propias reservas si están confirmadas
    return reservation.userId === currentUser.id && reservation.status === 'confirmed';
  }

  /**
   * Obtiene el texto de estado para mostrar
   */
  getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'confirmed': 'Confirmada',
      'cancelled': 'Cancelada',
      'completed': 'Completada'
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

  /**
   * Formatea la hora para mostrar
   */
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea la hora para input time
   */
  formatTimeForInput(date: Date): string {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Obtiene la duración entre dos fechas
   */
  getDuration(startDateString: string, endDateString: string): string {
    const start = new Date(startDateString);
    const end = new Date(endDateString);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes} minutos`;
    } else if (diffHours === 1) {
      return '1 hora';
    } else {
      return `${diffHours} horas`;
    }
  }

  /**
   * Combina fecha y hora en un objeto Date
   */
  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }
}
