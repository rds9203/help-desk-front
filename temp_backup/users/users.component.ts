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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    name: string;
    description: string;
  };
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

@Component({
  selector: 'app-users',
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
    MatSlideToggleModule,
    MatPaginatorModule
  ],
  template: `
    <div class="users-container">
      <div class="users-header">
        <h1 class="users-title">Gestión de Usuarios</h1>
        <p class="users-subtitle">Administración de usuarios del sistema</p>
      </div>

      <!-- Filtros y búsqueda -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline">
              <mat-label>Buscar usuario</mat-label>
              <input matInput 
                     [(ngModel)]="searchTerm" 
                     (input)="filterUsers()"
                     placeholder="Nombre, email o posición">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Rol</mat-label>
              <mat-select [(ngModel)]="selectedRole" (selectionChange)="filterUsers()">
                <mat-option value="">Todos</mat-option>
                <mat-option *ngFor="let role of roles" [value]="role.name">
                  {{ role.description }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="filterUsers()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="active">Activos</mat-option>
                <mat-option value="inactive">Inactivos</mat-option>
                <mat-option value="pending">Pendientes de aprobación</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>person_add</mat-icon>
              Nuevo Usuario
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de usuarios -->
      <mat-card class="users-table-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="paginatedUsers" class="users-table">
              <!-- Nombre -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let user">
                  <div class="user-info">
                    <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Posición -->
              <ng-container matColumnDef="position">
                <th mat-header-cell *matHeaderCellDef>Posición</th>
                <td mat-cell *matCellDef="let user">
                  {{ user.position || 'Sin especificar' }}
                </td>
              </ng-container>

              <!-- Rol -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Rol</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [class]="'role-' + user.role.name">
                    {{ getRoleDisplay(user.role.name) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Estado -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let user">
                  <div class="status-container">
                    <mat-chip [class]="'status-' + (user.isActive ? 'active' : 'inactive')">
                      {{ user.isActive ? 'Activo' : 'Inactivo' }}
                    </mat-chip>
                    <mat-chip *ngIf="!user.isApproved" class="status-pending">
                      Pendiente
                    </mat-chip>
                  </div>
                </td>
              </ng-container>

              <!-- Fecha de creación -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Fecha de registro</th>
                <td mat-cell *matCellDef="let user">
                  {{ formatDate(user.createdAt) }}
                </td>
              </ng-container>

              <!-- Acciones -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-icon-button 
                          matTooltip="Ver detalles"
                          (click)="viewUser(user)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button 
                          matTooltip="Editar"
                          (click)="editUser(user)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          *ngIf="!user.isApproved"
                          matTooltip="Aprobar usuario"
                          (click)="approveUser(user)">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator #paginator
                           [length]="filteredUsers.length"
                           [pageSize]="10"
                           [pageSizeOptions]="[5, 10, 25, 100]"
                           showFirstLastButtons>
            </mat-paginator>

            <div *ngIf="filteredUsers.length === 0" class="no-users">
              <mat-icon>people_outline</mat-icon>
              <p>No hay usuarios que coincidan con los filtros</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Dialog para crear/editar usuario -->
    <ng-template #userDialog>
      <div class="user-dialog">
        <h2 mat-dialog-title>{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
        <mat-dialog-content>
          <form [formGroup]="userForm" class="user-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="firstName" placeholder="Nombre del usuario">
                <mat-error *ngIf="userForm.get('firstName')?.hasError('required')">
                  El nombre es requerido
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Apellido</mat-label>
                <input matInput formControlName="lastName" placeholder="Apellido del usuario">
                <mat-error *ngIf="userForm.get('lastName')?.hasError('required')">
                  El apellido es requerido
                </mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email" 
                     formControlName="email" 
                     placeholder="usuario@sectorial.co"
                     [readonly]="isEditing">
              <mat-error *ngIf="userForm.get('email')?.hasError('required')">
                El email es requerido
              </mat-error>
              <mat-error *ngIf="userForm.get('email')?.hasError('email')">
                Ingrese un email válido
              </mat-error>
              <mat-error *ngIf="userForm.get('email')?.hasError('domain')">
                Solo se permiten emails del dominio @sectorial.co
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Posición</mat-label>
              <input matInput formControlName="position" placeholder="Cargo en la empresa">
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Rol</mat-label>
                <mat-select formControlName="roleId">
                  <mat-option *ngFor="let role of availableRoles" [value]="role.id">
                    {{ role.description }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="userForm.get('roleId')?.hasError('required')">
                  El rol es requerido
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" *ngIf="!isEditing">
                <mat-label>Contraseña</mat-label>
                <input matInput 
                       type="password" 
                       formControlName="password" 
                       placeholder="Contraseña inicial">
                <mat-error *ngIf="userForm.get('password')?.hasError('required')">
                  La contraseña es requerida
                </mat-error>
                <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">
                  La contraseña debe tener al menos 6 caracteres
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row" *ngIf="isEditing">
              <mat-slide-toggle formControlName="isActive">
                Usuario activo
              </mat-slide-toggle>
              <mat-slide-toggle formControlName="isApproved">
                Usuario aprobado
              </mat-slide-toggle>
            </div>

            <div *ngIf="userForm.get('roleId')?.value" class="role-info">
              <h4>Permisos del rol seleccionado:</h4>
              <div class="permissions-list">
                <mat-chip *ngFor="let permission of getRolePermissions()" class="permission-chip">
                  {{ permission }}
                </mat-chip>
              </div>
            </div>
          </form>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeDialog()">Cancelar</button>
          <button mat-raised-button 
                  color="primary" 
                  (click)="saveUser()"
                  [disabled]="userForm.invalid">
            {{ isEditing ? 'Actualizar' : 'Crear' }}
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>

    <!-- Dialog para ver detalles del usuario -->
    <ng-template #userDetailsDialog>
      <div class="user-details-dialog">
        <h2 mat-dialog-title>
          {{ selectedUser?.firstName }} {{ selectedUser?.lastName }}
        </h2>
        <mat-dialog-content>
          <div class="user-details">
            <div class="user-info">
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span>{{ selectedUser?.email }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Posición:</span>
                <span>{{ selectedUser?.position || 'Sin especificar' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Rol:</span>
                <mat-chip [class]="'role-' + selectedUser?.role.name">
                  {{ getRoleDisplay(selectedUser?.role.name || '') }}
                </mat-chip>
              </div>
              <div class="info-row">
                <span class="info-label">Estado:</span>
                <div class="status-container">
                  <mat-chip [class]="'status-' + (selectedUser?.isActive ? 'active' : 'inactive')">
                    {{ selectedUser?.isActive ? 'Activo' : 'Inactivo' }}
                  </mat-chip>
                  <mat-chip *ngIf="!selectedUser?.isApproved" class="status-pending">
                    Pendiente de aprobación
                  </mat-chip>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de registro:</span>
                <span>{{ formatDate(selectedUser?.createdAt || '') }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Última actualización:</span>
                <span>{{ formatDate(selectedUser?.updatedAt || '') }}</span>
              </div>
            </div>

            <div *ngIf="selectedUser?.role" class="role-permissions">
              <h4>Permisos del rol</h4>
              <div class="permissions-list">
                <mat-chip *ngFor="let permission of getSelectedUserRolePermissions()" class="permission-chip">
                  {{ permission }}
                </mat-chip>
              </div>
            </div>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeDetailsDialog()">Cerrar</button>
          <button mat-raised-button color="primary" (click)="editUser(selectedUser!)">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
          <button *ngIf="!selectedUser?.isApproved" 
                  mat-raised-button 
                  color="accent" 
                  (click)="approveUser(selectedUser!)">
            <mat-icon>check_circle</mat-icon>
            Aprobar
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .users-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .users-header {
      margin-bottom: 24px;
    }

    .users-title {
      font-size: 2rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .users-subtitle {
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
      min-width: 200px;
    }

    .users-table-card {
      margin-bottom: 24px;
    }

    .table-container {
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
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

    .status-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .role-superadmin { background: #8e24aa; color: white; }
    .role-admin { background: #f57c00; color: white; }
    .role-technology { background: #1976d2; color: white; }
    .role-user { background: #388e3c; color: white; }

    .status-active { background: #27ae60; color: white; }
    .status-inactive { background: #95a5a6; color: white; }
    .status-pending { background: #f39c12; color: white; }

    .no-users {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .no-users mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .user-dialog {
      min-width: 600px;
    }

    .user-form {
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

    .role-info {
      margin-top: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .role-info h4 {
      margin: 0 0 12px 0;
      color: #2c3e50;
    }

    .permissions-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .permission-chip {
      background: #e3f2fd;
      color: #1976d2;
      font-size: 12px;
    }

    .user-details-dialog {
      min-width: 600px;
      max-width: 800px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .user-info {
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
      min-width: 150px;
    }

    .role-permissions {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .role-permissions h4 {
      margin: 0 0 12px 0;
      color: #2c3e50;
    }

    @media (max-width: 768px) {
      .users-container {
        padding: 16px;
      }
      
      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }
      
      .form-row {
        flex-direction: column;
      }
      
      .user-dialog,
      .user-details-dialog {
        min-width: auto;
        width: 90vw;
      }
    }
  `]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  roles: Role[] = [];
  availableRoles: Role[] = [];
  selectedUser: User | null = null;
  
  // Filtros
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';
  
  // Formulario
  userForm: FormGroup;
  isEditing = false;
  currentUserId: number | null = null;
  
  displayedColumns = ['name', 'position', 'role', 'status', 'createdAt', 'actions'];

  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('userDialog') userDialog: any;
  @ViewChild('userDetailsDialog') userDetailsDialog: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email, this.domainValidator]],
      position: [''],
      roleId: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      isActive: [true],
      isApproved: [false]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  /**
   * Carga todos los usuarios
   */
  loadUsers(): void {
    this.apiService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filterUsers();
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.snackBar.open('Error cargando usuarios', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Carga todos los roles disponibles
   */
  loadRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        // Filtrar roles disponibles según permisos del usuario actual
        this.availableRoles = roles.filter(role => {
          if (this.authService.isSuperAdmin()) return true;
          if (this.authService.isAdmin()) return role.name !== 'superadmin';
          return false;
        });
      },
      error: (error) => {
        console.error('Error cargando roles:', error);
        this.snackBar.open('Error cargando roles', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Filtra los usuarios según los criterios seleccionados
   */
  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const searchMatch = !this.searchTerm || 
        `${user.firstName} ${user.lastName} ${user.email} ${user.position || ''}`.toLowerCase()
          .includes(this.searchTerm.toLowerCase());
      
      const roleMatch = !this.selectedRole || user.role.name === this.selectedRole;
      
      let statusMatch = true;
      if (this.selectedStatus === 'active') {
        statusMatch = user.isActive;
      } else if (this.selectedStatus === 'inactive') {
        statusMatch = !user.isActive;
      } else if (this.selectedStatus === 'pending') {
        statusMatch = !user.isApproved;
      }
      
      return searchMatch && roleMatch && statusMatch;
    });
    
    this.updatePaginatedUsers();
  }

  /**
   * Actualiza la lista paginada de usuarios
   */
  updatePaginatedUsers(): void {
    const startIndex = this.paginator?.pageIndex || 0;
    const pageSize = this.paginator?.pageSize || 10;
    const endIndex = startIndex * pageSize + pageSize;
    
    this.paginatedUsers = this.filteredUsers.slice(startIndex * pageSize, endIndex);
  }

  /**
   * Abre el dialog para crear un nuevo usuario
   */
  openCreateDialog(): void {
    this.isEditing = false;
    this.currentUserId = null;
    
    this.userForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      position: '',
      roleId: '',
      password: '',
      isActive: true,
      isApproved: false
    });
    
    // Mostrar campo de contraseña para nuevos usuarios
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    
    this.dialog.open(this.userDialog, {
      width: '700px',
      maxWidth: '90vw'
    });
  }

  /**
   * Abre el dialog para ver los detalles del usuario
   */
  viewUser(user: User): void {
    this.selectedUser = user;
    this.dialog.open(this.userDetailsDialog, {
      width: '700px',
      maxWidth: '90vw'
    });
  }

  /**
   * Abre el dialog para editar un usuario
   */
  editUser(user: User): void {
    this.isEditing = true;
    this.currentUserId = user.id;
    this.selectedUser = user;
    
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      position: user.position || '',
      roleId: user.role.id,
      isActive: user.isActive,
      isApproved: user.isApproved
    });
    
    // Ocultar campo de contraseña para edición
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.dialog.open(this.userDialog, {
      width: '700px',
      maxWidth: '90vw'
    });
  }

  /**
   * Guarda el usuario (crear o actualizar)
   */
  saveUser(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      
      if (this.isEditing && this.currentUserId) {
        // Actualizar usuario existente
        const updateData = {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          position: formValue.position,
          roleId: formValue.roleId,
          isActive: formValue.isActive,
          isApproved: formValue.isApproved
        };
        
        this.apiService.updateUser(this.currentUserId, updateData).subscribe({
          next: (updatedUser) => {
            this.snackBar.open('Usuario actualizado correctamente', 'Cerrar', { duration: 3000 });
            this.loadUsers();
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error actualizando usuario:', error);
            this.snackBar.open('Error actualizando usuario', 'Cerrar', { duration: 3000 });
          }
        });
      } else {
        // Crear nuevo usuario
        const createData = {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          position: formValue.position,
          roleId: formValue.roleId,
          password: formValue.password,
          isActive: formValue.isActive,
          isApproved: formValue.isApproved
        };
        
        this.apiService.createUser(createData).subscribe({
          next: (newUser) => {
            this.snackBar.open('Usuario creado correctamente', 'Cerrar', { duration: 3000 });
            this.loadUsers();
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error creando usuario:', error);
            this.snackBar.open('Error creando usuario', 'Cerrar', { duration: 3000 });
          }
        });
      }
    }
  }

  /**
   * Aprueba un usuario
   */
  approveUser(user: User): void {
    if (confirm(`¿Estás seguro de que quieres aprobar al usuario ${user.firstName} ${user.lastName}?`)) {
      this.apiService.approveUser(user.id).subscribe({
        next: (approvedUser) => {
          this.snackBar.open('Usuario aprobado correctamente', 'Cerrar', { duration: 3000 });
          this.loadUsers();
          this.closeDetailsDialog();
        },
        error: (error) => {
          console.error('Error aprobando usuario:', error);
          this.snackBar.open('Error aprobando usuario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  /**
   * Cierra el dialog de usuario
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
   * Validador personalizado para el dominio de email
   */
  private domainValidator(control: any) {
    const email = control.value;
    if (email && !email.endsWith('@sectorial.co')) {
      return { domain: true };
    }
    return null;
  }

  /**
   * Obtiene los permisos del rol seleccionado
   */
  getRolePermissions(): string[] {
    const roleId = this.userForm.get('roleId')?.value;
    const role = this.roles.find(r => r.id === roleId);
    return role?.permissions || [];
  }

  /**
   * Obtiene los permisos del rol del usuario seleccionado
   */
  getSelectedUserRolePermissions(): string[] {
    return this.selectedUser?.role ? 
      this.roles.find(r => r.id === this.selectedUser!.role.id)?.permissions || [] : [];
  }

  /**
   * Obtiene el texto de rol para mostrar
   */
  getRoleDisplay(roleName: string): string {
    const roleMap: { [key: string]: string } = {
      'superadmin': 'Super Administrador',
      'admin': 'Administrador',
      'technology': 'Soporte Técnico',
      'user': 'Usuario'
    };
    return roleMap[roleName] || roleName;
  }

  /**
   * Formatea la fecha para mostrar
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
   * Maneja el evento de paginación
   */
  onPageChange(): void {
    this.updatePaginatedUsers();
  }
}
