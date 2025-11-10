import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  template: `
    <div class="audit-container">
      <div class="audit-header">
        <h1 class="audit-title">Logs de Auditoría</h1>
        <p class="audit-subtitle">Registro de todas las acciones del sistema</p>
      </div>

      <!-- Filtros -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline">
              <mat-label>Buscar</mat-label>
              <input matInput 
                     [(ngModel)]="searchTerm" 
                     (input)="filterLogs()"
                     placeholder="Usuario, acción o entidad">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Acción</mat-label>
              <mat-select [(ngModel)]="selectedAction" (selectionChange)="filterLogs()">
                <mat-option value="">Todas</mat-option>
                <mat-option value="CREATE">Crear</mat-option>
                <mat-option value="UPDATE">Actualizar</mat-option>
                <mat-option value="DELETE">Eliminar</mat-option>
                <mat-option value="LOGIN">Iniciar sesión</mat-option>
                <mat-option value="LOGOUT">Cerrar sesión</mat-option>
                <mat-option value="APPROVE">Aprobar</mat-option>
                <mat-option value="REJECT">Rechazar</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Entidad</mat-label>
              <mat-select [(ngModel)]="selectedEntity" (selectionChange)="filterLogs()">
                <mat-option value="">Todas</mat-option>
                <mat-option value="User">Usuario</mat-option>
                <mat-option value="Credit">Crédito</mat-option>
                <mat-option value="Ticket">Ticket</mat-option>
                <mat-option value="Reservation">Reserva</mat-option>
                <mat-option value="VacationRequest">Solicitud de Vacaciones</mat-option>
                <mat-option value="Notification">Notificación</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fecha desde</mat-label>
              <input matInput 
                     [matDatepicker]="startDatePicker" 
                     [(ngModel)]="startDate"
                     (dateChange)="filterLogs()">
              <mat-datepicker-toggle matIconSuffix [for]="startDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #startDatePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fecha hasta</mat-label>
              <input matInput 
                     [matDatepicker]="endDatePicker" 
                     [(ngModel)]="endDate"
                     (dateChange)="filterLogs()">
              <mat-datepicker-toggle matIconSuffix [for]="endDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #endDatePicker></mat-datepicker>
            </mat-form-field>

            <button mat-raised-button color="accent" (click)="exportAuditLogs()">
              <mat-icon>download</mat-icon>
              Exportar
            </button>

            <button mat-raised-button color="primary" (click)="refreshLogs()">
              <mat-icon>refresh</mat-icon>
              Actualizar
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Estadísticas -->
      <div class="stats-section">
        <mat-card class="stats-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>analytics</mat-icon>
              Estadísticas de Auditoría
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ totalLogs }}</div>
                <div class="stat-label">Total de Logs</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ todayLogs }}</div>
                <div class="stat-label">Logs de Hoy</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ uniqueUsers }}</div>
                <div class="stat-label">Usuarios Activos</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ mostActiveUser }}</div>
                <div class="stat-label">Usuario Más Activo</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabla de logs -->
      <mat-card class="audit-table-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="paginatedLogs" class="audit-table">
              <!-- Fecha -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Fecha y Hora</th>
                <td mat-cell *matCellDef="let log">
                  <div class="datetime-info">
                    <span class="date">{{ formatDate(log.createdAt) }}</span>
                    <span class="time">{{ formatTime(log.createdAt) }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Usuario -->
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>Usuario</th>
                <td mat-cell *matCellDef="let log">
                  <div class="user-info" *ngIf="log.user">
                    <span class="user-name">{{ log.user.firstName }} {{ log.user.lastName }}</span>
                    <span class="user-email">{{ log.user.email }}</span>
                  </div>
                  <span *ngIf="!log.user" class="system-action">Sistema</span>
                </td>
              </ng-container>

              <!-- Acción -->
              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef>Acción</th>
                <td mat-cell *matCellDef="let log">
                  <mat-chip [class]="'action-' + log.action.toLowerCase()">
                    <mat-icon>{{ getActionIcon(log.action) }}</mat-icon>
                    {{ getActionDisplay(log.action) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Entidad -->
              <ng-container matColumnDef="entity">
                <th mat-header-cell *matHeaderCellDef>Entidad</th>
                <td mat-cell *matCellDef="let log">
                  <div class="entity-info">
                    <span class="entity-type">{{ log.entityType }}</span>
                    <span *ngIf="log.entityId" class="entity-id">ID: {{ log.entityId }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Detalles -->
              <ng-container matColumnDef="details">
                <th mat-header-cell *matHeaderCellDef>Detalles</th>
                <td mat-cell *matCellDef="let log">
                  <button mat-icon-button 
                          matTooltip="Ver detalles"
                          (click)="viewLogDetails(log)">
                    <mat-icon>info</mat-icon>
                  </button>
                </td>
              </ng-container>

              <!-- IP -->
              <ng-container matColumnDef="ipAddress">
                <th mat-header-cell *matHeaderCellDef>IP</th>
                <td mat-cell *matCellDef="let log">
                  <span class="ip-address">{{ log.ipAddress || '-' }}</span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator #paginator
                           [length]="filteredLogs.length"
                           [pageSize]="25"
                           [pageSizeOptions]="[10, 25, 50, 100]"
                           showFirstLastButtons>
            </mat-paginator>

            <div *ngIf="filteredLogs.length === 0" class="no-logs">
              <mat-icon>history</mat-icon>
              <p>No hay logs que coincidan con los filtros</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Dialog para ver detalles del log -->
    <ng-template #logDetailsDialog>
      <div class="log-details-dialog">
        <h2 mat-dialog-title>
          Detalles del Log de Auditoría
        </h2>
        <mat-dialog-content>
          <div class="log-details">
            <div class="detail-section">
              <h4>Información General</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">ID del Log:</span>
                  <span>{{ selectedLog?.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Fecha y Hora:</span>
                  <span>{{ formatFullDateTime(selectedLog?.createdAt || '') }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Usuario:</span>
                  <span *ngIf="selectedLog?.user">
                    {{ selectedLog.user.firstName }} {{ selectedLog.user.lastName }} ({{ selectedLog.user.email }})
                  </span>
                  <span *ngIf="!selectedLog?.user">Sistema</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Acción:</span>
                  <mat-chip [class]="'action-' + selectedLog?.action.toLowerCase()">
                    {{ getActionDisplay(selectedLog?.action || '') }}
                  </mat-chip>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Entidad:</span>
                  <span>{{ selectedLog?.entityType }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">ID de Entidad:</span>
                  <span>{{ selectedLog?.entityId || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Dirección IP:</span>
                  <span>{{ selectedLog?.ipAddress || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section" *ngIf="selectedLog?.oldValues">
              <h4>Valores Anteriores</h4>
              <div class="json-viewer">
                <pre>{{ formatJson(selectedLog.oldValues) }}</pre>
              </div>
            </div>

            <div class="detail-section" *ngIf="selectedLog?.newValues">
              <h4>Valores Nuevos</h4>
              <div class="json-viewer">
                <pre>{{ formatJson(selectedLog.newValues) }}</pre>
              </div>
            </div>

            <div class="detail-section" *ngIf="selectedLog?.userAgent">
              <h4>User Agent</h4>
              <div class="user-agent">
                {{ selectedLog.userAgent }}
              </div>
            </div>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeDetailsDialog()">Cerrar</button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .audit-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .audit-header {
      margin-bottom: 24px;
    }

    .audit-title {
      font-size: 2rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .audit-subtitle {
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

    .stats-section {
      margin-bottom: 24px;
    }

    .stats-card {
      border-radius: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
    }

    .stat-item {
      text-align: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #7f8c8d;
    }

    .audit-table-card {
      margin-bottom: 24px;
    }

    .table-container {
      overflow-x: auto;
    }

    .audit-table {
      width: 100%;
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

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .user-email {
      font-size: 12px;
      color: #7f8c8d;
    }

    .system-action {
      font-style: italic;
      color: #95a5a6;
    }

    .action-create { background: #27ae60; color: white; }
    .action-update { background: #f39c12; color: white; }
    .action-delete { background: #e74c3c; color: white; }
    .action-login { background: #3498db; color: white; }
    .action-logout { background: #95a5a6; color: white; }
    .action-approve { background: #27ae60; color: white; }
    .action-reject { background: #e74c3c; color: white; }

    .entity-info {
      display: flex;
      flex-direction: column;
    }

    .entity-type {
      font-weight: 500;
      color: #2c3e50;
    }

    .entity-id {
      font-size: 12px;
      color: #7f8c8d;
    }

    .ip-address {
      font-family: monospace;
      font-size: 12px;
      color: #7f8c8d;
    }

    .no-logs {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .no-logs mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .log-details-dialog {
      min-width: 800px;
      max-width: 1000px;
    }

    .log-details {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .detail-section {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .detail-section h4 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 8px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 12px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .detail-label {
      font-weight: 500;
      color: #2c3e50;
    }

    .json-viewer {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }

    .json-viewer pre {
      margin: 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
    }

    .user-agent {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      color: #495057;
      word-break: break-all;
    }

    @media (max-width: 768px) {
      .audit-container {
        padding: 16px;
      }
      
      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }
      
      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
      }
      
      .detail-grid {
        grid-template-columns: 1fr;
      }
      
      .log-details-dialog {
        min-width: auto;
        width: 90vw;
      }
    }
  `]
})
export class AuditComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  paginatedLogs: AuditLog[] = [];
  selectedLog: AuditLog | null = null;
  
  // Filtros
  searchTerm = '';
  selectedAction = '';
  selectedEntity = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  
  // Estadísticas
  totalLogs = 0;
  todayLogs = 0;
  uniqueUsers = 0;
  mostActiveUser = '';
  
  displayedColumns = ['createdAt', 'user', 'action', 'entity', 'details', 'ipAddress'];

  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('logDetailsDialog') logDetailsDialog: any;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (!this.authService.canViewAuditLogs()) {
      this.snackBar.open('No tienes permisos para ver los logs de auditoría', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.loadAuditLogs();
  }

  /**
   * Carga los logs de auditoría
   */
  loadAuditLogs(): void {
    const params: any = {};
    
    if (this.startDate) {
      params.startDate = this.startDate.toISOString();
    }
    if (this.endDate) {
      params.endDate = this.endDate.toISOString();
    }
    if (this.selectedAction) {
      params.action = this.selectedAction;
    }
    if (this.selectedEntity) {
      params.entityType = this.selectedEntity;
    }
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    
    this.apiService.getAuditLogs(params).subscribe({
      next: (response) => {
        this.auditLogs = response.logs || response;
        this.calculateStatistics();
        this.filterLogs();
      },
      error: (error) => {
        console.error('Error cargando logs de auditoría:', error);
        this.snackBar.open('Error cargando logs de auditoría', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Calcula las estadísticas de auditoría
   */
  calculateStatistics(): void {
    this.totalLogs = this.auditLogs.length;
    
    // Logs de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.todayLogs = this.auditLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    }).length;
    
    // Usuarios únicos
    const uniqueUserIds = new Set(
      this.auditLogs
        .filter(log => log.user)
        .map(log => log.user!.id)
    );
    this.uniqueUsers = uniqueUserIds.size;
    
    // Usuario más activo
    const userActivity: { [userId: number]: { count: number; name: string } } = {};
    this.auditLogs.forEach(log => {
      if (log.user) {
        if (!userActivity[log.user.id]) {
          userActivity[log.user.id] = {
            count: 0,
            name: `${log.user.firstName} ${log.user.lastName}`
          };
        }
        userActivity[log.user.id].count++;
      }
    });
    
    const mostActive = Object.values(userActivity).reduce((max, user) => 
      user.count > max.count ? user : max, { count: 0, name: 'N/A' }
    );
    this.mostActiveUser = mostActive.name;
  }

  /**
   * Filtra los logs según los criterios
   */
  filterLogs(): void {
    this.filteredLogs = this.auditLogs.filter(log => {
      const searchMatch = !this.searchTerm || 
        `${log.user?.firstName || ''} ${log.user?.lastName || ''} ${log.user?.email || ''} ${log.action} ${log.entityType}`.toLowerCase()
          .includes(this.searchTerm.toLowerCase());
      
      const actionMatch = !this.selectedAction || log.action === this.selectedAction;
      const entityMatch = !this.selectedEntity || log.entityType === this.selectedEntity;
      
      let dateMatch = true;
      if (this.startDate || this.endDate) {
        const logDate = new Date(log.createdAt);
        if (this.startDate) {
          dateMatch = dateMatch && logDate >= this.startDate;
        }
        if (this.endDate) {
          dateMatch = dateMatch && logDate <= this.endDate;
        }
      }
      
      return searchMatch && actionMatch && entityMatch && dateMatch;
    });
    
    this.updatePaginatedLogs();
  }

  /**
   * Actualiza la lista paginada de logs
   */
  updatePaginatedLogs(): void {
    const startIndex = this.paginator?.pageIndex || 0;
    const pageSize = this.paginator?.pageSize || 25;
    
    this.paginatedLogs = this.filteredLogs.slice(startIndex * pageSize, startIndex * pageSize + pageSize);
  }

  /**
   * Ve los detalles de un log
   */
  viewLogDetails(log: AuditLog): void {
    this.selectedLog = log;
    this.dialog.open(this.logDetailsDialog, {
      width: '900px',
      maxWidth: '95vw'
    });
  }

  /**
   * Exporta los logs de auditoría
   */
  exportAuditLogs(): void {
    // Crear CSV
    const headers = ['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID Entidad', 'IP'];
    const csvContent = [
      headers.join(','),
      ...this.filteredLogs.map(log => [
        this.formatFullDateTime(log.createdAt),
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema',
        log.action,
        log.entityType,
        log.entityId || '',
        log.ipAddress || ''
      ].join(','))
    ].join('\n');
    
    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.snackBar.open('Logs exportados correctamente', 'Cerrar', { duration: 3000 });
  }

  /**
   * Actualiza los logs
   */
  refreshLogs(): void {
    this.loadAuditLogs();
    this.snackBar.open('Logs actualizados', 'Cerrar', { duration: 2000 });
  }

  /**
   * Cierra el dialog de detalles
   */
  closeDetailsDialog(): void {
    this.dialog.closeAll();
  }

  /**
   * Obtiene el icono para la acción
   */
  getActionIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      'CREATE': 'add',
      'UPDATE': 'edit',
      'DELETE': 'delete',
      'LOGIN': 'login',
      'LOGOUT': 'logout',
      'APPROVE': 'check',
      'REJECT': 'close'
    };
    return iconMap[action] || 'help';
  }

  /**
   * Obtiene el texto de acción para mostrar
   */
  getActionDisplay(action: string): string {
    const actionMap: { [key: string]: string } = {
      'CREATE': 'Crear',
      'UPDATE': 'Actualizar',
      'DELETE': 'Eliminar',
      'LOGIN': 'Iniciar Sesión',
      'LOGOUT': 'Cerrar Sesión',
      'APPROVE': 'Aprobar',
      'REJECT': 'Rechazar'
    };
    return actionMap[action] || action;
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
   * Formatea la fecha y hora completa
   */
  formatFullDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Formatea JSON para mostrar
   */
  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  /**
   * Maneja el evento de paginación
   */
  onPageChange(): void {
    this.updatePaginatedLogs();
  }
}
