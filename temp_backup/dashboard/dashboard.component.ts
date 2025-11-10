import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

interface DashboardCard {
  title: string;
  icon: string;
  value: number;
  color: string;
  route: string;
  permissions: string[];
}

interface QuickAction {
  title: string;
  icon: string;
  route: string;
  permissions: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatChipsModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1 class="dashboard-title">Dashboard</h1>
        <p class="dashboard-subtitle">
          Bienvenido, {{ getUserFullName() }} - {{ getUserRoleDisplay() }}
        </p>
      </div>

      <!-- Tarjetas de Resumen -->
      <div class="dashboard-cards">
        <mat-card *ngFor="let card of dashboardCards" 
                  class="dashboard-card"
                  [class.hidden]="!canShowCard(card)"
                  (click)="navigateTo(card.route)">
          <mat-card-content>
            <div class="card-icon" [style.background-color]="card.color">
              <mat-icon>{{ card.icon }}</mat-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ card.value }}</div>
              <div class="card-title">{{ card.title }}</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Acciones Rápidas -->
      <div class="quick-actions">
        <h2 class="section-title">Acciones Rápidas</h2>
        <div class="actions-grid">
          <button *ngFor="let action of quickActions"
                  mat-raised-button
                  [class.hidden]="!canShowAction(action)"
                  (click)="navigateTo(action.route)"
                  class="action-button">
            <mat-icon>{{ action.icon }}</mat-icon>
            <span>{{ action.title }}</span>
          </button>
        </div>
      </div>

      <!-- Información del Usuario -->
      <div class="user-info-section">
        <mat-card class="user-info-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>person</mat-icon>
              Información Personal
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="user-details">
              <div class="user-detail">
                <span class="detail-label">Nombre:</span>
                <span class="detail-value">{{ getUserFullName() }}</span>
              </div>
              <div class="user-detail">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ getUserEmail() }}</span>
              </div>
              <div class="user-detail">
                <span class="detail-label">Rol:</span>
                <mat-chip class="role-chip">{{ getUserRoleDisplay() }}</mat-chip>
              </div>
              <div class="user-detail">
                <span class="detail-label">Último acceso:</span>
                <span class="detail-value">{{ getCurrentDate() }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Notificaciones Recientes -->
      <div class="notifications-section" *ngIf="canShowNotifications()">
        <mat-card class="notifications-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>notifications</mat-icon>
              Notificaciones Recientes
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="recentNotifications.length === 0" class="no-notifications">
              <mat-icon>notifications_none</mat-icon>
              <p>No tienes notificaciones recientes</p>
            </div>
            <div *ngFor="let notification of recentNotifications" 
                 class="notification-item">
              <mat-icon class="notification-icon">{{ getNotificationIcon(notification.type) }}</mat-icon>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-date">{{ formatDate(notification.createdAt) }}</div>
              </div>
            </div>
            <button mat-button color="primary" (click)="viewAllNotifications()">
              Ver todas las notificaciones
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .dashboard-header {
      margin-bottom: 32px;
    }

    .dashboard-title {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .dashboard-subtitle {
      font-size: 1.1rem;
      color: #7f8c8d;
      margin: 0;
    }

    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .dashboard-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 12px;
      overflow: hidden;
    }

    .dashboard-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .dashboard-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 24px;
    }

    .card-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
    }

    .card-icon mat-icon {
      color: white;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .card-content {
      flex: 1;
    }

    .card-value {
      font-size: 2rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .card-title {
      font-size: 14px;
      color: #7f8c8d;
      font-weight: 500;
    }

    .quick-actions {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 500;
      color: #2c3e50;
      margin-bottom: 20px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .action-button {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 500;
      border-radius: 8px;
    }

    .action-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .user-info-section,
    .notifications-section {
      margin-bottom: 32px;
    }

    .user-info-card,
    .notifications-card {
      border-radius: 12px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .user-detail {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .detail-label {
      font-weight: 500;
      color: #7f8c8d;
      min-width: 120px;
    }

    .detail-value {
      color: #2c3e50;
    }

    .role-chip {
      background: #3498db;
      color: white;
    }

    .no-notifications {
      text-align: center;
      padding: 40px 20px;
      color: #7f8c8d;
    }

    .no-notifications mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .notification-item {
      display: flex;
      padding: 16px 0;
      border-bottom: 1px solid #f1f3f4;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-icon {
      margin-right: 12px;
      margin-top: 4px;
      color: #3498db;
    }

    .notification-content {
      flex: 1;
    }

    .notification-title {
      font-size: 14px;
      font-weight: 500;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .notification-message {
      font-size: 13px;
      color: #7f8c8d;
      margin-bottom: 8px;
    }

    .notification-date {
      font-size: 11px;
      color: #95a5a6;
    }

    .hidden {
      display: none !important;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }
      
      .dashboard-title {
        font-size: 2rem;
      }
      
      .dashboard-cards {
        grid-template-columns: 1fr;
      }
      
      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  dashboardCards: DashboardCard[] = [];
  quickActions: QuickAction[] = [];
  recentNotifications: any[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupDashboardCards();
    this.setupQuickActions();
    this.loadRecentNotifications();
  }

  /**
   * Configura las tarjetas del dashboard
   */
  private setupDashboardCards(): void {
    const allCards: DashboardCard[] = [
      {
        title: 'Mis Tickets',
        icon: 'support',
        value: 0, // Se cargará dinámicamente
        color: '#e74c3c',
        route: '/tickets',
        permissions: ['tickets.read', 'tickets.create']
      },
      {
        title: 'Mis Reservas',
        icon: 'event',
        value: 0, // Se cargará dinámicamente
        color: '#3498db',
        route: '/reservations',
        permissions: ['reservations.read', 'reservations.create']
      },
      {
        title: 'Días de Vacaciones',
        icon: 'beach_access',
        value: 0, // Se cargará dinámicamente
        color: '#f39c12',
        route: '/vacations',
        permissions: ['vacations.read']
      },
      {
        title: 'Mis Créditos',
        icon: 'account_balance',
        value: 0, // Se cargará dinámicamente
        color: '#27ae60',
        route: '/credits',
        permissions: ['credits.read']
      },
      {
        title: 'Usuarios Totales',
        icon: 'people',
        value: 0, // Se cargará dinámicamente
        color: '#9b59b6',
        route: '/users',
        permissions: ['users.read']
      },
      {
        title: 'Tickets Abiertos',
        icon: 'assignment',
        value: 0, // Se cargará dinámicamente
        color: '#e67e22',
        route: '/tickets',
        permissions: ['tickets.read']
      }
    ];

    this.dashboardCards = allCards.filter(card => this.canShowCard(card));
    this.loadDashboardData();
  }

  /**
   * Configura las acciones rápidas
   */
  private setupQuickActions(): void {
    const allActions: QuickAction[] = [
      {
        title: 'Nuevo Ticket',
        icon: 'add',
        route: '/tickets/new',
        permissions: ['tickets.create']
      },
      {
        title: 'Nueva Reserva',
        icon: 'event_available',
        route: '/reservations/new',
        permissions: ['reservations.create']
      },
      {
        title: 'Solicitar Vacaciones',
        icon: 'beach_access',
        route: '/vacations/request',
        permissions: ['vacations.create']
      },
      {
        title: 'Solicitar Crédito',
        icon: 'account_balance_wallet',
        route: '/credits/new',
        permissions: ['credits.create']
      },
      {
        title: 'Crear Usuario',
        icon: 'person_add',
        route: '/users/new',
        permissions: ['users.create']
      },
      {
        title: 'Ver Auditoría',
        icon: 'history',
        route: '/audit',
        permissions: ['*']
      }
    ];

    this.quickActions = allActions.filter(action => this.canShowAction(action));
  }

  /**
   * Carga los datos del dashboard
   */
  private loadDashboardData(): void {
    // Cargar tickets del usuario
    if (this.authService.hasAnyPermission(['tickets.read', 'tickets.create'])) {
      this.apiService.getTickets().subscribe({
        next: (tickets) => {
          const myTicketsCard = this.dashboardCards.find(card => card.title === 'Mis Tickets');
          if (myTicketsCard) {
            myTicketsCard.value = tickets.length;
          }
        },
        error: (error) => console.error('Error cargando tickets:', error)
      });
    }

    // Cargar reservas del usuario
    if (this.authService.hasAnyPermission(['reservations.read', 'reservations.create'])) {
      this.apiService.getReservations().subscribe({
        next: (reservations) => {
          const myReservationsCard = this.dashboardCards.find(card => card.title === 'Mis Reservas');
          if (myReservationsCard) {
            myReservationsCard.value = reservations.length;
          }
        },
        error: (error) => console.error('Error cargando reservas:', error)
      });
    }

    // Cargar días de vacaciones
    if (this.authService.hasAnyPermission(['vacations.read'])) {
      this.apiService.getVacationDays().subscribe({
        next: (vacationDays) => {
          const vacationCard = this.dashboardCards.find(card => card.title === 'Días de Vacaciones');
          if (vacationCard) {
            vacationCard.value = vacationDays.totalDays - vacationDays.usedDays;
          }
        },
        error: (error) => console.error('Error cargando vacaciones:', error)
      });
    }

    // Cargar créditos del usuario
    if (this.authService.hasAnyPermission(['credits.read'])) {
      this.apiService.getCredits().subscribe({
        next: (credits) => {
          const creditsCard = this.dashboardCards.find(card => card.title === 'Mis Créditos');
          if (creditsCard) {
            creditsCard.value = credits.length;
          }
        },
        error: (error) => console.error('Error cargando créditos:', error)
      });
    }

    // Cargar usuarios totales (solo admin)
    if (this.authService.hasAnyPermission(['users.read'])) {
      this.apiService.getUsers().subscribe({
        next: (users) => {
          const usersCard = this.dashboardCards.find(card => card.title === 'Usuarios Totales');
          if (usersCard) {
            usersCard.value = users.length;
          }
        },
        error: (error) => console.error('Error cargando usuarios:', error)
      });
    }
  }

  /**
   * Carga las notificaciones recientes
   */
  private loadRecentNotifications(): void {
    if (this.canShowNotifications()) {
      this.apiService.getNotifications().subscribe({
        next: (notifications) => {
          this.recentNotifications = notifications.slice(0, 5); // Últimas 5
        },
        error: (error) => console.error('Error cargando notificaciones:', error)
      });
    }
  }

  /**
   * Verifica si el usuario puede ver una tarjeta
   */
  canShowCard(card: DashboardCard): boolean {
    return this.authService.hasAnyPermission(card.permissions);
  }

  /**
   * Verifica si el usuario puede ver una acción
   */
  canShowAction(action: QuickAction): boolean {
    return this.authService.hasAnyPermission(action.permissions);
  }

  /**
   * Verifica si el usuario puede ver notificaciones
   */
  canShowNotifications(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Navega a una ruta específica
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  getUserFullName(): string {
    return this.authService.getUserFullName();
  }

  /**
   * Obtiene el email del usuario
   */
  getUserEmail(): string {
    return this.authService.getUserEmail();
  }

  /**
   * Obtiene el rol del usuario para mostrar
   */
  getUserRoleDisplay(): string {
    const role = this.authService.getUserRole();
    const roleMap: { [key: string]: string } = {
      'superadmin': 'Super Administrador',
      'admin': 'Administrador',
      'technology': 'Soporte Técnico',
      'user': 'Usuario'
    };
    return roleMap[role] || 'Usuario';
  }

  /**
   * Obtiene la fecha actual
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el icono para el tipo de notificación
   */
  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'info': 'info',
      'success': 'check_circle',
      'warning': 'warning',
      'error': 'error'
    };
    return iconMap[type] || 'info';
  }

  /**
   * Formatea la fecha de la notificación
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Ve todas las notificaciones
   */
  viewAllNotifications(): void {
    // Implementar navegación a notificaciones
    console.log('Ver todas las notificaciones');
  }
}
