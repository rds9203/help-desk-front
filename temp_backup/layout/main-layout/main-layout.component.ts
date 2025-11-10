import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService, User } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  permissions: string[];
  badge?: number;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <!-- Sidebar -->
      <mat-sidenav #drawer class="sidenav" fixedInViewport
                   [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
                   [mode]="(isHandset$ | async) ? 'over' : 'side'"
                   [opened]="!(isHandset$ | async)">
        
        <!-- Header del Sidebar -->
        <div class="sidebar-header">
          <div class="logo-container">
            <mat-icon class="logo-icon">business</mat-icon>
            <span class="logo-text">Help Desk</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Menú de Navegación -->
        <mat-nav-list class="nav-list">
          <ng-container *ngFor="let item of menuItems">
            <a mat-list-item 
               [routerLink]="item.route"
               routerLinkActive="active"
               [class.hidden]="!canShowMenuItem(item)"
               class="nav-item">
              
              <mat-icon matListItemIcon class="nav-icon">{{ item.icon }}</mat-icon>
              
              <span matListItemTitle class="nav-title">{{ item.title }}</span>
              
              <mat-icon *ngIf="item.badge && item.badge > 0" 
                        matListItemMeta 
                        class="badge-icon">
                <span class="badge-count">{{ item.badge > 99 ? '99+' : item.badge }}</span>
              </mat-icon>
            </a>
          </ng-container>
        </mat-nav-list>

        <!-- Footer del Sidebar -->
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <div class="user-details">
              <div class="user-name">{{ getUserFullName() }}</div>
              <div class="user-role">{{ getUserRoleDisplay() }}</div>
            </div>
          </div>
        </div>
      </mat-sidenav>

      <!-- Contenido Principal -->
      <mat-sidenav-content>
        <!-- Header -->
        <mat-toolbar color="primary" class="toolbar">
          <button type="button" 
                  aria-label="Toggle sidenav" 
                  mat-icon-button 
                  (click)="drawer.toggle()"
                  *ngIf="isHandset$ | async">
            <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
          </button>

          <span class="toolbar-title">{{ getPageTitle() }}</span>

          <span class="toolbar-spacer"></span>

          <!-- Notificaciones -->
          <button mat-icon-button 
                  [matBadge]="unreadNotificationsCount"
                  [matBadgeHidden]="unreadNotificationsCount === 0"
                  matBadgeColor="warn"
                  class="notification-button"
                  (click)="toggleNotifications()"
                  [class.hidden]="!canShowNotifications()">
            <mat-icon>notifications</mat-icon>
          </button>

          <!-- Menú de Usuario -->
          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
            <mat-icon>account_circle</mat-icon>
          </button>
        </mat-toolbar>

        <!-- Contenido de la Página -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>

    <!-- Menú de Usuario -->
    <mat-menu #userMenu="matMenu" class="user-menu">
      <div class="menu-header">
        <div class="menu-user-info">
          <div class="menu-user-name">{{ getUserFullName() }}</div>
          <div class="menu-user-email">{{ getUserEmail() }}</div>
          <div class="menu-user-role">{{ getUserRoleDisplay() }}</div>
        </div>
      </div>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="goToProfile()">
        <mat-icon>person</mat-icon>
        <span>Mi Perfil</span>
      </button>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Cerrar Sesión</span>
      </button>
    </mat-menu>

    <!-- Panel de Notificaciones -->
    <div class="notifications-panel" 
         [class.show]="showNotifications"
         [class.hidden]="!canShowNotifications()">
      <div class="notifications-header">
        <h3>Notificaciones</h3>
        <button mat-icon-button (click)="closeNotifications()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="notifications-content">
        <div *ngIf="notifications.length === 0" class="no-notifications">
          <mat-icon>notifications_none</mat-icon>
          <p>No tienes notificaciones</p>
        </div>
        <div *ngFor="let notification of notifications" 
             class="notification-item"
             [class.unread]="!notification.isRead">
          <mat-icon class="notification-icon">{{ getNotificationIcon(notification.type) }}</mat-icon>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-date">{{ formatDate(notification.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }

    .sidenav {
      width: 280px;
      background: #2c3e50;
      color: white;
    }

    .sidebar-header {
      padding: 20px;
      background: #34495e;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3498db;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 600;
      color: white;
    }

    .nav-list {
      padding: 0;
    }

    .nav-item {
      color: #bdc3c7 !important;
      margin: 4px 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .nav-item:hover {
      background: #34495e !important;
      color: white !important;
    }

    .nav-item.active {
      background: #3498db !important;
      color: white !important;
    }

    .nav-icon {
      color: inherit;
    }

    .nav-title {
      font-size: 14px;
      font-weight: 500;
    }

    .badge-icon {
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    .badge-count {
      font-size: 10px;
      font-weight: bold;
    }

    .sidebar-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      background: #34495e;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3498db;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .user-details {
      flex: 1;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: white;
    }

    .user-role {
      font-size: 12px;
      color: #bdc3c7;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .toolbar-title {
      font-size: 18px;
      font-weight: 500;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .notification-button,
    .user-menu-button {
      color: white;
    }

    .page-content {
      padding: 24px;
      background: #f5f5f5;
      min-height: calc(100vh - 64px);
    }

    .user-menu {
      min-width: 250px;
    }

    .menu-header {
      padding: 16px;
      background: #f8f9fa;
    }

    .menu-user-name {
      font-size: 16px;
      font-weight: 500;
      color: #2c3e50;
    }

    .menu-user-email {
      font-size: 14px;
      color: #7f8c8d;
      margin: 4px 0;
    }

    .menu-user-role {
      font-size: 12px;
      color: #3498db;
      text-transform: uppercase;
      font-weight: 500;
    }

    .notifications-panel {
      position: fixed;
      top: 64px;
      right: 20px;
      width: 350px;
      max-height: 500px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      overflow: hidden;
    }

    .notifications-panel.show {
      transform: translateX(0);
    }

    .notifications-panel.hidden {
      display: none;
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .notifications-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #2c3e50;
    }

    .notifications-content {
      max-height: 400px;
      overflow-y: auto;
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
      padding: 16px;
      border-bottom: 1px solid #f1f3f4;
      transition: background 0.2s ease;
    }

    .notification-item:hover {
      background: #f8f9fa;
    }

    .notification-item.unread {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }

    .notification-icon {
      margin-right: 12px;
      margin-top: 4px;
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
      .sidenav {
        width: 100%;
      }
      
      .page-content {
        padding: 16px;
      }
      
      .notifications-panel {
        width: calc(100vw - 40px);
        right: 20px;
        left: 20px;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  menuItems: MenuItem[] = [];
  unreadNotificationsCount = 0;
  notifications: any[] = [];
  showNotifications = false;
  isHandset$ = false; // Simplificado para este ejemplo

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener usuario actual
    this.currentUser = this.authService.getCurrentUser();
    
    // Configurar menú según permisos
    this.setupMenu();
    
    // Cargar notificaciones si tiene permisos
    if (this.canShowNotifications()) {
      this.loadNotifications();
      this.loadUnreadNotificationsCount();
    }

    // Suscribirse a cambios de autenticación
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.setupMenu();
      })
    );

    // Suscribirse a cambios de ruta para actualizar título
    this.subscriptions.push(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          // Actualizar título de página si es necesario
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Configura el menú según los permisos del usuario
   */
  private setupMenu(): void {
    const allMenuItems: MenuItem[] = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard',
        permissions: ['*']
      },
      {
        id: 'credits',
        title: 'Créditos',
        icon: 'account_balance',
        route: '/credits',
        permissions: ['credits.read']
      },
      {
        id: 'tickets',
        title: 'Soporte Tecnológico',
        icon: 'support',
        route: '/tickets',
        permissions: ['tickets.read', 'tickets.create']
      },
      {
        id: 'reservations',
        title: 'Reservas',
        icon: 'event',
        route: '/reservations',
        permissions: ['reservations.read', 'reservations.create']
      },
      {
        id: 'vacations',
        title: 'Vacaciones',
        icon: 'beach_access',
        route: '/vacations',
        permissions: ['vacations.read', 'vacations.create']
      },
      {
        id: 'users',
        title: 'Usuarios',
        icon: 'people',
        route: '/users',
        permissions: ['users.read']
      },
      {
        id: 'audit',
        title: 'Auditoría',
        icon: 'history',
        route: '/audit',
        permissions: ['*'] // Solo superadmin
      }
    ];

    this.menuItems = allMenuItems.filter(item => 
      this.canShowMenuItem(item)
    );
  }

  /**
   * Verifica si el usuario puede ver un elemento del menú
   */
  canShowMenuItem(item: MenuItem): boolean {
    return this.authService.hasAnyPermission(item.permissions);
  }

  /**
   * Verifica si el usuario puede ver notificaciones
   */
  canShowNotifications(): boolean {
    return this.authService.isAuthenticated();
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
   * Obtiene el título de la página actual
   */
  getPageTitle(): string {
    const url = this.router.url;
    const titleMap: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/credits': 'Créditos',
      '/tickets': 'Soporte Tecnológico',
      '/reservations': 'Reservas',
      '/vacations': 'Vacaciones',
      '/users': 'Usuarios',
      '/audit': 'Auditoría'
    };
    return titleMap[url] || 'Help Desk';
  }

  /**
   * Carga las notificaciones del usuario
   */
  private loadNotifications(): void {
    this.apiService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
      error: (error) => {
        console.error('Error cargando notificaciones:', error);
      }
    });
  }

  /**
   * Carga el contador de notificaciones no leídas
   */
  private loadUnreadNotificationsCount(): void {
    this.apiService.getUnreadNotificationsCount().subscribe({
      next: (response) => {
        this.unreadNotificationsCount = response.count;
      },
      error: (error) => {
        console.error('Error cargando contador de notificaciones:', error);
      }
    });
  }

  /**
   * Alterna la visualización de notificaciones
   */
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  /**
   * Cierra el panel de notificaciones
   */
  closeNotifications(): void {
    this.showNotifications = false;
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
   * Navega al perfil del usuario
   */
  goToProfile(): void {
    // Implementar navegación al perfil
    console.log('Ir al perfil');
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this.authService.logout();
  }
}
