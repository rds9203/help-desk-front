import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber?: string;
  birthDate?: string;
  position?: string;
  role: string | { id: string | number; name: string; description?: string };
  permissions?: string[];
  salary?: number;
  hasDebt?: boolean;
  debtAmount?: number; // Cuánto debe
  paidAmount?: number; // Cuánto ha pagado
  installmentAmount?: number; // De cuánto es la cuota
  interestRate?: number; // El interés
  startDate?: string | Date;
  roleId?: string | number;
  contractType?: string;
  mustChangePassword?: boolean; // Todos deben cambiar contraseña
  isActive?: boolean; // Estado activo del usuario
  defaultPassword?: string; // Contraseña por defecto
  pendingActivation?: boolean; // Pendiente de activación
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3001/api';
  private readonly TOKEN_KEY = 'helpdesk_token';
  private readonly USER_KEY = 'helpdesk_user';
  
  // Signals para el estado de autenticación
  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  
  // BehaviorSubjects para compatibilidad con observables
  private userSubject = new BehaviorSubject<User | null>(null);
  private authSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Inicializa la autenticación verificando si hay un token guardado
   */
  private initializeAuth(): void {
    console.log('🚀 INICIALIZANDO AUTENTICACIÓN');
    
    const token = localStorage.getItem(this.TOKEN_KEY);
    const storedUser = localStorage.getItem(this.USER_KEY);
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        this._currentUser.set(parsedUser);
        this.userSubject.next(parsedUser);
        
        if (token) {
          this._isAuthenticated.set(true);
          this.authSubject.next(true);
        }
      } catch (error) {
        console.warn('⚠️ Error parseando usuario almacenado, limpiando registro:', error);
        localStorage.removeItem(this.USER_KEY);
      }
    }
    
    if (token) {
      console.log('🔍 Token encontrado, validando con backend...');
      
      // Validar token con el backend
      this.validateToken().subscribe({
        next: (isValid) => {
          if (isValid) {
            console.log('✅ Token válido, usuario autenticado');
          } else {
            console.log('❌ Token inválido, limpiando sesión');
          }
        },
        error: (error) => {
          console.error('❌ Error validando token:', error);
          this.clearAuth();
        }
      });
    } else {
      console.log('🔧 NO HAY TOKEN - REQUIERE LOGIN MANUAL');
      this._currentUser.set(null);
      this._isAuthenticated.set(false);
      this.userSubject.next(null);
      this.authSubject.next(false);
    }
  }

  /**
   * Auto-login del superadmin para desarrollo (ELIMINADO COMPLETAMENTE)
   */
  private autoLoginSuperAdmin(): void {
    // ELIMINADO: No hacer auto-login automático
    console.log('🔧 Auto-login ELIMINADO - se requiere login manual obligatorio');
    return;
  }

  /**
   * Lista de usuarios registrados en el sistema
   */
  private getRegisteredUsers(): string[] {
    return [
      'superadmin@sectorial.co',
      'richy9.13@gmail.com',
      'pedro.garcia@sectorial.co',
      'maria.lopez@sectorial.co',
      'carlos.martinez@sectorial.co',
      'ana.sanchez@sectorial.co',
      'luis.rodriguez@sectorial.co',
      'laura.gonzalez@sectorial.co',
      'roberto.fernandez@sectorial.co',
      'sofia.ramirez@sectorial.co',
      'juan.perez@sectorial.co'
    ];
  }

  /**
   * Verifica si un usuario está registrado en el sistema
   */
  private isUserRegistered(email: string): boolean {
    const registeredUsers = this.getRegisteredUsers();
    return registeredUsers.includes(email.toLowerCase());
  }

  /**
   * Realiza el login del usuario
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    console.log('🔍 Intentando login con backend real:', {
      email: credentials.email,
      password: credentials.password
    });

    // Usar el endpoint real del backend
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        console.log('✅ Login exitoso desde backend:', response.user);
        
        // Guardar token y usuario
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        
        // Actualizar estado
        this._currentUser.set(response.user);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
        this.userSubject.next(response.user);
        this.authSubject.next(true);
      }),
      catchError(error => {
        let errorMessage = 'Error de autenticación';
        
        // Manejo de errores específicos del backend
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.status === 401) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para acceder';
        }

        this._error.set(errorMessage);
        this._isLoading.set(false);
        this._isAuthenticated.set(false);
        this.userSubject.next(null);
        this.authSubject.next(false);
        
        console.error('❌ Error en login:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Obtiene usuarios mock para validación de login
   */
  private getMockUsers(): User[] {
    return [
      {
        id: 1,
        firstName: 'Super',
        lastName: 'Administrador',
        email: 'superadmin@sectorial.co',
        documentNumber: '12345678',
        role: 'superadmin',
        isActive: true,
        pendingActivation: false,
        mustChangePassword: false, // Ya cambió contraseña
        defaultPassword: '123'
      },
      {
        id: 9,
        firstName: 'Richard',
        lastName: 'Administrador',
        email: 'richy9.13@gmail.com',
        documentNumber: '1000000002',
        role: 'superadmin',
        isActive: true,
        pendingActivation: false,
        mustChangePassword: false, // Ya cambió contraseña
        defaultPassword: '123'
      },
      {
        id: 2,
        firstName: 'Pedro',
        lastName: 'García',
        email: 'pedro.garcia@sectorial.co',
        documentNumber: '22334455',
        role: 'user',
        isActive: true,
        pendingActivation: false,
        mustChangePassword: false, // Ya cambió contraseña
        defaultPassword: '123'
      },
      {
        id: 3,
        firstName: 'María',
        lastName: 'López',
        email: 'maria.lopez@sectorial.co',
        documentNumber: '33445566',
        role: 'user',
        isActive: true,
        pendingActivation: false,
        mustChangePassword: false, // Ya cambió contraseña
        defaultPassword: '123'
      },
      {
        id: 4,
        firstName: 'Carlos',
        lastName: 'Martínez',
        email: 'carlos.martinez@sectorial.co',
        documentNumber: '44556677',
        role: 'admin',
        isActive: true,
        pendingActivation: false,
        mustChangePassword: false, // Ya cambió contraseña
        defaultPassword: '123'
      },
      {
        id: 5,
        firstName: 'Ana',
        lastName: 'Sánchez',
        email: 'ana.sanchez@sectorial.co',
        documentNumber: '55667788',
        role: 'user',
        isActive: false,
        pendingActivation: false,
        mustChangePassword: false,
        defaultPassword: '123'
      },
      {
        id: 6,
        firstName: 'Luis',
        lastName: 'Rodríguez',
        email: 'luis.rodriguez@sectorial.co',
        documentNumber: '66778899',
        role: 'technology',
        isActive: true,
        pendingActivation: false,
        mustChangePassword: false, // Ya cambió contraseña
        defaultPassword: '123'
      },
      {
        id: 7,
        firstName: 'Laura',
        lastName: 'González',
        email: 'laura.gonzalez@sectorial.co',
        documentNumber: '77889900',
        role: 'user',
        isActive: true,
        pendingActivation: true,
        mustChangePassword: true, // Debe cambiar contraseña en primer login
        defaultPassword: '123'
      },
      {
        id: 8,
        firstName: 'Roberto',
        lastName: 'Fernández',
        email: 'roberto.fernandez@sectorial.co',
        documentNumber: '88990011',
        role: 'user',
        isActive: true,
        pendingActivation: true,
        mustChangePassword: true, // Debe cambiar contraseña en primer login
        defaultPassword: '123'
      },
      {
        id: 10,
        firstName: 'Sofía',
        lastName: 'Ramírez',
        email: 'sofia.ramirez@sectorial.co',
        documentNumber: '99001122',
        role: 'admin',
        isActive: true,
        pendingActivation: false,
        mustChangePassword: false, // Ya cambió contraseña
        defaultPassword: '123'
      },
      {
        id: 11,
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@sectorial.co',
        documentNumber: '10111213',
        role: 'user',
        isActive: true,
        pendingActivation: false,
        mustChangePassword: true, // Debe cambiar contraseña en primer login
        defaultPassword: '123'
      }
    ];
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    console.log('🚪 Cerrando sesión...');
    
    // Limpiar datos de autenticación
    this.clearAuth();
    
    // Redirigir al login usando window.location para evitar problemas con el botón atrás
    window.location.href = '/login';
    
    console.log('✅ Sesión cerrada completamente');
  }

  /**
   * Limpia la autenticación
   */
  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Limpiar completamente el localStorage para evitar datos corruptos
    localStorage.clear();
    
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this._error.set(null);
    this.userSubject.next(null);
    this.authSubject.next(false);
    
    console.log('🧹 localStorage completamente limpiado');
  }

  /**
   * Obtiene el token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Cambia la contraseña del usuario
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const currentUser = this._currentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }

    console.log('🔑 Cambiando contraseña para:', currentUser.email);

    // Usar el endpoint real del backend
    const changePasswordData = {
      email: currentUser.email,
      currentPassword: currentPassword,
      newPassword: newPassword
    };

    return this.http.put(`${this.API_URL}/change-password`, changePasswordData).pipe(
      tap(response => {
        console.log('✅ Contraseña cambiada exitosamente desde backend:', response);
        
        // Actualizar usuario en localStorage con los nuevos datos
        const updatedUser = {
          ...currentUser,
          mustChangePassword: false, // Ya no debe cambiar contraseña
          pendingActivation: false, // Ya no está pendiente de activación
        };

        localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
        
        // Actualizar estado del servicio
        this._currentUser.set(updatedUser);
        this.userSubject.next(updatedUser);
        
        console.log('✅ Estado del usuario actualizado localmente');
      }),
      catchError(error => {
        let errorMessage = 'Error al cambiar la contraseña';
        
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        console.error('❌ Error cambiando contraseña:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Actualiza la contraseña de un usuario en los datos mock
   */
  private updateMockUserPassword(email: string, newPassword: string): void {
    console.log('🔄 Actualizando contraseña en datos mock para:', email);
    
    // Obtener usuarios mock actuales
    const mockUsers = this.getMockUsers();
    
    // Encontrar y actualizar el usuario
    const userIndex = mockUsers.findIndex(user => user.email === email);
    if (userIndex !== -1) {
      mockUsers[userIndex].defaultPassword = newPassword;
      mockUsers[userIndex].mustChangePassword = false;
      mockUsers[userIndex].pendingActivation = false;
      
      console.log('✅ Usuario actualizado en datos mock:', mockUsers[userIndex]);
    } else {
      console.warn('⚠️ Usuario no encontrado en datos mock:', email);
    }
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(permission: string): boolean {
    const user = this._currentUser();
    if (!user) {
      console.log('❌ hasPermission() - No hay usuario actual');
      return false;
    }
    
    // Obtener el rol del usuario
    const role = typeof user.role === 'string' ? user.role : user.role.name;
    console.log('🔍 hasPermission() - Usuario rol:', role, 'permission solicitada:', permission);
    
    // Si es superadmin, tiene todos los permisos
    if (role === 'superadmin') {
      console.log('✅ hasPermission() - Superadmin tiene todos los permisos');
      return true;
    }
    
    // Si es admin, tiene permisos de admin
    if (role === 'admin' && (permission === 'admin' || permission === 'superadmin')) {
      console.log('✅ hasPermission() - Admin tiene permisos de admin');
      return true;
    }
    
    // Si el permiso coincide exactamente con el rol
    const hasExactMatch = role === permission;
    console.log('🔍 hasPermission() - Coincidencia exacta:', hasExactMatch);
    return hasExactMatch;
  }

  /**
   * Verifica si el usuario tiene alguno de los permisos especificados
   */
  hasAnyPermission(permissions: string[]): boolean {
    console.log('🔍 hasAnyPermission() - Verificando permisos:', permissions);
    const result = permissions.some(permission => this.hasPermission(permission));
    console.log('🔍 hasAnyPermission() - Resultado:', result);
    return result;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this._currentUser();
    if (!user) return false;
    const userRole = typeof user.role === 'string' ? user.role : user.role.name;
    return userRole === role;
  }

  /**
   * Verifica si el usuario es administrador (admin o superadmin)
   */
  isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('superadmin');
  }

  /**
   * Verifica si el usuario es superadmin
   */
  isSuperAdmin(): boolean {
    return this.hasRole('superadmin');
  }

  /**
   * Verifica si el usuario es de tecnología
   */
  isTechnology(): boolean {
    return this.hasRole('technology');
  }

  /**
   * Verifica si el usuario puede ver todos los tickets
   */
  canViewAllTickets(): boolean {
    return this.isAdmin() || this.isTechnology();
  }

  /**
   * Verifica si el usuario puede gestionar usuarios
   */
  canManageUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Verifica si el usuario puede ver logs de auditoría
   */
  canViewAuditLogs(): boolean {
    return this.isSuperAdmin();
  }

  /**
   * Obtiene los headers con autenticación para las peticiones HTTP
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Valida el token con el backend
   */
  validateToken(): Observable<boolean> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    if (!token) {
      return of(false);
    }

    console.log('🔍 Validando token con backend...');

    return this.http.get(`${this.API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      map((response: any) => {
        const user = response?.user ?? response;
        
        if (!user) {
          throw new Error('Usuario no encontrado en la respuesta de validación');
        }
        
        console.log('✅ Token válido:', user);
        
        // Actualizar usuario en localStorage
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        
        // Actualizar estado del servicio
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
        this.userSubject.next(user);
        this.authSubject.next(true);
        
        return true;
      }),
      catchError(error => {
        console.log('❌ Token inválido:', error.error?.error || 'Error de validación');
        
        // Limpiar datos inválidos
        this.clearAuth();
        
        return of(false);
      })
    );
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this._isAuthenticated();
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this._currentUser();
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  getUserFullName(): string {
    const user = this._currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  /**
   * Obtiene el email del usuario
   */
  getUserEmail(): string {
    const user = this._currentUser();
    return user?.email || '';
  }

  /**
   * Obtiene el rol del usuario
   */
  getUserRole(): string {
    const user = this._currentUser();
    if (!user) return '';
    return typeof user.role === 'string' ? user.role : user.role.name;
  }

  // Getters para signals
  get currentUser() { return this._currentUser.asReadonly(); }
  get isAuthenticatedSignal() { return this._isAuthenticated.asReadonly(); }
  get isLoading() { return this._isLoading.asReadonly(); }
  get error() { return this._error.asReadonly(); }

  // Getters para observables (compatibilidad)
  get currentUser$() { return this.userSubject.asObservable(); }
  get isAuthenticated$() { return this.authSubject.asObservable(); }
}