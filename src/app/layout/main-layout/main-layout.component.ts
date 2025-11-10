import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
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
    <div class="main-container">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <mat-icon class="logo-icon">business</mat-icon>
          <span class="app-title">Help Desk</span>
        </div>
        
        <mat-nav-list class="nav-list">
          <a mat-list-item 
             *ngFor="let item of menuItems" 
             [routerLink]="item.route"
             routerLinkActive="active"
             [class.hidden]="!canShowMenuItem(item)"
             class="nav-item">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.title }}</span>
            <mat-icon *ngIf="item.badge && item.badge > 0" 
                      matListItemMeta 
                      [matBadge]="item.badge"
                      matBadgeColor="warn"
                      matBadgeSize="small">notifications</mat-icon>
          </a>
        </mat-nav-list>
      </div>

      <!-- Contenido Principal -->
      <div class="main-content">
        <!-- Header -->
        <mat-toolbar color="primary" class="toolbar">
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
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
            <mat-icon>account_circle</mat-icon>
            <span class="user-info-header">
              <span class="user-name">{{ getUserFullName() }}</span>
              <span class="user-role">{{ getUserRoleDisplay() }}</span>
            </span>
            <mat-icon>arrow_drop_down</mat-icon>
          </button>
        </mat-toolbar>

        <!-- Contenido de la Página -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>

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
    .main-container {
      height: 100vh;
      display: flex;
    }

    .sidebar {
      width: 250px;
      background-color: #f5f5f5;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 16px;
      background-color: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .app-title {
      font-size: 18px;
      font-weight: 500;
    }

    .nav-list {
      flex: 1;
      padding: 0;
    }

    .nav-item {
      color: #333;
      text-decoration: none;
    }

    .nav-item:hover {
      background-color: #e3f2fd;
    }

    .nav-item.active {
      background-color: #1976d2;
      color: white;
    }

    .nav-item.active mat-icon {
      color: white;
    }

    .nav-item.hidden {
      display: none;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
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

    .user-menu-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.1);
      transition: background 0.3s ease;
    }

    .user-menu-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .user-info-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: white;
      line-height: 1.2;
    }

    .user-role {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      font-weight: 400;
      line-height: 1.2;
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
      .page-content {
        padding: 16px;
      }
      
      .notifications-panel {
        width: calc(100vw - 40px);
        right: 20px;
        left: 20px;
      }

      .user-menu-button {
        padding: 6px 12px;
      }

      .user-info-header {
        display: none; /* Ocultar en móvil para ahorrar espacio */
      }

      .user-name {
        font-size: 12px;
      }

      .user-role {
        font-size: 10px;
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
    console.log('🔍 MainLayoutComponent ngOnInit - Verificando autenticación');
    
    // Verificar autenticación usando validación de token
    this.authService.validateToken().subscribe({
      next: (isValid) => {
        if (isValid) {
          console.log('✅ Usuario autenticado, continuando con la inicialización');
          this.initializeComponent();
        } else {
          console.log('🔒 Usuario no autenticado, redirigiendo al login');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('❌ Error verificando autenticación:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  private initializeComponent(): void {
    // Obtener usuario actual
    this.currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario actual establecido:', this.currentUser);
    
    // Configurar menú según permisos
    this.setupMenu();
    console.log('📋 Menú configurado');
    
    // Cargar notificaciones si tiene permisos
    // TEMPORALMENTE DESHABILITADO - El backend simple no tiene notificaciones
    // if (this.canShowNotifications()) {
    //   this.loadNotifications();
    //   this.loadUnreadNotificationsCount();
    // }

    // Suscribirse a cambios de autenticación
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        console.log('🔄 Cambio en currentUser$:', user);
        this.currentUser = user;
        this.setupMenu();
        
        // Si el usuario se desloguea, redirigir al login
        if (!user) {
          console.log('🔒 Usuario deslogueado, redirigiendo al login');
          this.router.navigate(['/login']);
        }
      })
    );

    // Suscribirse a cambios de ruta para actualizar título
    this.subscriptions.push(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          console.log('🔄 Navegación a:', event.url);
          // Actualizar título de página si es necesario
        }
      })
    );
    
    console.log('✅ MainLayoutComponent inicializado completamente');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Configura el menú según los permisos del usuario
   */
  private setupMenu(): void {
    console.log('🔧 setupMenu() llamado con usuario:', this.currentUser);
    
    const allMenuItems: MenuItem[] = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        route: '/app/dashboard',
        permissions: []
      },
      {
        id: 'tickets',
        title: 'Tickets',
        icon: 'confirmation_number',
        route: '/app/tickets',
        permissions: []
      },
      {
        id: 'reservations',
        title: 'Reservas',
        icon: 'event',
        route: '/app/reservations',
        permissions: []
      },
      {
        id: 'vacations',
        title: 'Vacaciones',
        icon: 'beach_access',
        route: '/app/vacations',
        permissions: []
      },
      {
        id: 'credits',
        title: 'Créditos',
        icon: 'account_balance',
        route: '/app/credits',
        permissions: []
      },
      {
        id: 'users',
        title: 'Usuarios',
        icon: 'people',
        route: '/app/users',
        permissions: ['admin', 'superadmin']
      },
      {
        id: 'audit',
        title: 'Auditoría',
        icon: 'history',
        route: '/app/audit',
        permissions: []
      }
    ];

    this.menuItems = allMenuItems;
    console.log('📋 Menú configurado con', this.menuItems.length, 'elementos');
  }

  /**
   * Verifica si el usuario puede ver un elemento del menú
   */
  canShowMenuItem(item: MenuItem): boolean {
    console.log('🔍 canShowMenuItem() - Verificando item:', item.title, 'con permisos:', item.permissions);
    
    // Si no hay permisos específicos, mostrar para todos los usuarios autenticados
    if (item.permissions.length === 0) {
      const canShow = this.authService.isAuthenticated();
      console.log('🔍 canShowMenuItem() - Sin permisos específicos, autenticado:', canShow);
      return canShow;
    }
    
    const hasPermission = this.authService.hasAnyPermission(item.permissions);
    console.log('🔍 canShowMenuItem() - Con permisos específicos, tiene acceso:', hasPermission);
    return hasPermission;
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
