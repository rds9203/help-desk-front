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
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdById: number;
  assignedTo?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  comments: TicketComment[];
}

interface TicketComment {
  id: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

@Component({
  selector: 'app-tickets',
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
    MatSnackBarModule
  ],
  template: `
    <div class="tickets-container">
      <div class="tickets-header">
        <h1 class="tickets-title">Soporte Tecnológico</h1>
        <p class="tickets-subtitle">Gestión de tickets de soporte técnico</p>
      </div>

      <!-- Filtros -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="filterTickets()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="open">Abierto</mat-option>
                <mat-option value="in_progress">En Progreso</mat-option>
                <mat-option value="resolved">Resuelto</mat-option>
                <mat-option value="closed">Cerrado</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Prioridad</mat-label>
              <mat-select [(ngModel)]="selectedPriority" (selectionChange)="filterTickets()">
                <mat-option value="">Todas</mat-option>
                <mat-option value="low">Baja</mat-option>
                <mat-option value="medium">Media</mat-option>
                <mat-option value="high">Alta</mat-option>
                <mat-option value="urgent">Urgente</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Categoría</mat-label>
              <mat-select [(ngModel)]="selectedCategory" (selectionChange)="filterTickets()">
                <mat-option value="">Todas</mat-option>
                <mat-option value="hardware">Hardware</mat-option>
                <mat-option value="software">Software</mat-option>
                <mat-option value="network">Red</mat-option>
                <mat-option value="other">Otro</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon>
              Nuevo Ticket
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de Tickets -->
      <mat-card class="tickets-table-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="filteredTickets" class="tickets-table">
              <!-- Título -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Título</th>
                <td mat-cell *matCellDef="let ticket">
                  <div class="ticket-title">
                    <span class="title-text">{{ ticket.title }}</span>
                    <span class="ticket-id">#{{ ticket.id }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Estado -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let ticket">
                  <mat-chip [class]="'status-' + ticket.status">
                    {{ getStatusDisplay(ticket.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Prioridad -->
              <ng-container matColumnDef="priority">
                <th mat-header-cell *matHeaderCellDef>Prioridad</th>
                <td mat-cell *matCellDef="let ticket">
                  <mat-chip [class]="'priority-' + ticket.priority">
                    {{ getPriorityDisplay(ticket.priority) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Categoría -->
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Categoría</th>
                <td mat-cell *matCellDef="let ticket">
                  {{ getCategoryDisplay(ticket.category) }}
                </td>
              </ng-container>

              <!-- Creado por -->
              <ng-container matColumnDef="createdBy">
                <th mat-header-cell *matHeaderCellDef>Creado por</th>
                <td mat-cell *matCellDef="let ticket">
                  {{ ticket.createdBy.firstName }} {{ ticket.createdBy.lastName }}
                </td>
              </ng-container>

              <!-- Asignado a -->
              <ng-container matColumnDef="assignedTo">
                <th mat-header-cell *matHeaderCellDef>Asignado a</th>
                <td mat-cell *matCellDef="let ticket">
                  <span *ngIf="ticket.assignedUser">
                    {{ ticket.assignedUser.firstName }} {{ ticket.assignedUser.lastName }}
                  </span>
                  <span *ngIf="!ticket.assignedUser" class="not-assigned">Sin asignar</span>
                </td>
              </ng-container>

              <!-- Fecha -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let ticket">
                  {{ formatDate(ticket.createdAt) }}
                </td>
              </ng-container>

              <!-- Acciones -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let ticket">
                  <button mat-icon-button 
                          matTooltip="Ver detalles"
                          (click)="viewTicket(ticket)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button 
                          *ngIf="canEditTicket(ticket)"
                          matTooltip="Editar"
                          (click)="editTicket(ticket)">
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div *ngIf="filteredTickets.length === 0" class="no-tickets">
              <mat-icon>support_agent</mat-icon>
              <p>No hay tickets que coincidan con los filtros</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Dialog para crear/editar ticket -->
    <ng-template #ticketDialog>
      <div class="ticket-dialog">
        <h2 mat-dialog-title>{{ isEditing ? 'Editar Ticket' : 'Nuevo Ticket' }}</h2>
        <mat-dialog-content>
          <form [formGroup]="ticketForm" class="ticket-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Título</mat-label>
              <input matInput formControlName="title" placeholder="Título del ticket">
              <mat-error *ngIf="ticketForm.get('title')?.hasError('required')">
                El título es requerido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput 
                        formControlName="description" 
                        rows="4"
                        placeholder="Describe el problema o solicitud">
              </textarea>
              <mat-error *ngIf="ticketForm.get('description')?.hasError('required')">
                La descripción es requerida
              </mat-error>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Prioridad</mat-label>
                <mat-select formControlName="priority">
                  <mat-option value="low">Baja</mat-option>
                  <mat-option value="medium">Media</mat-option>
                  <mat-option value="high">Alta</mat-option>
                  <mat-option value="urgent">Urgente</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Categoría</mat-label>
                <mat-select formControlName="category">
                  <mat-option value="hardware">Hardware</mat-option>
                  <mat-option value="software">Software</mat-option>
                  <mat-option value="network">Red</mat-option>
                  <mat-option value="other">Otro</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div *ngIf="canAssignTickets()" class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Asignar a</mat-label>
                <mat-select formControlName="assignedTo">
                  <mat-option value="">Sin asignar</mat-option>
                  <mat-option *ngFor="let user of techUsers" [value]="user.id">
                    {{ user.firstName }} {{ user.lastName }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="open">Abierto</mat-option>
                  <mat-option value="in_progress">En Progreso</mat-option>
                  <mat-option value="resolved">Resuelto</mat-option>
                  <mat-option value="closed">Cerrado</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </form>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeDialog()">Cancelar</button>
          <button mat-raised-button 
                  color="primary" 
                  (click)="saveTicket()"
                  [disabled]="ticketForm.invalid">
            {{ isEditing ? 'Actualizar' : 'Crear' }}
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>

    <!-- Dialog para ver detalles del ticket -->
    <ng-template #ticketDetailsDialog>
      <div class="ticket-details-dialog">
        <h2 mat-dialog-title>
          <span class="ticket-title">{{ selectedTicket?.title }}</span>
          <span class="ticket-id">#{{ selectedTicket?.id }}</span>
        </h2>
        <mat-dialog-content>
          <div class="ticket-details">
            <div class="ticket-info">
              <div class="info-row">
                <span class="info-label">Estado:</span>
                <mat-chip [class]="'status-' + selectedTicket?.status">
                  {{ getStatusDisplay(selectedTicket?.status || '') }}
                </mat-chip>
              </div>
              <div class="info-row">
                <span class="info-label">Prioridad:</span>
                <mat-chip [class]="'priority-' + selectedTicket?.priority">
                  {{ getPriorityDisplay(selectedTicket?.priority || '') }}
                </mat-chip>
              </div>
              <div class="info-row">
                <span class="info-label">Categoría:</span>
                <span>{{ getCategoryDisplay(selectedTicket?.category || '') }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Creado por:</span>
                <span>{{ selectedTicket?.createdBy.firstName }} {{ selectedTicket?.createdBy.lastName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Asignado a:</span>
                <span *ngIf="selectedTicket?.assignedUser">
                  {{ selectedTicket.assignedUser.firstName }} {{ selectedTicket.assignedUser.lastName }}
                </span>
                <span *ngIf="!selectedTicket?.assignedUser" class="not-assigned">Sin asignar</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de creación:</span>
                <span>{{ formatDate(selectedTicket?.createdAt || '') }}</span>
              </div>
            </div>

            <div class="ticket-description">
              <h4>Descripción</h4>
              <p>{{ selectedTicket?.description }}</p>
            </div>

            <!-- Comentarios -->
            <div class="ticket-comments">
              <h4>Comentarios ({{ selectedTicket?.comments.length || 0 }})</h4>
              
              <div class="comment-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Agregar comentario</mat-label>
                  <textarea matInput 
                            [(ngModel)]="newComment"
                            rows="3"
                            placeholder="Escribe tu comentario aquí...">
                  </textarea>
                </mat-form-field>
                <button mat-raised-button 
                        color="primary" 
                        (click)="addComment()"
                        [disabled]="!newComment?.trim()">
                  <mat-icon>comment</mat-icon>
                  Agregar Comentario
                </button>
              </div>

              <div class="comments-list">
                <div *ngFor="let comment of selectedTicket?.comments" class="comment-item">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.user.firstName }} {{ comment.user.lastName }}</span>
                    <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                  <div class="comment-content">{{ comment.comment }}</div>
                </div>
              </div>
            </div>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions>
          <button mat-button (click)="closeDetailsDialog()">Cerrar</button>
          <button *ngIf="canEditTicket(selectedTicket!)" 
                  mat-raised-button 
                  color="primary" 
                  (click)="editTicket(selectedTicket!)">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .tickets-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .tickets-header {
      margin-bottom: 24px;
    }

    .tickets-title {
      font-size: 2rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .tickets-subtitle {
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

    .tickets-table-card {
      margin-bottom: 24px;
    }

    .table-container {
      overflow-x: auto;
    }

    .tickets-table {
      width: 100%;
    }

    .ticket-title {
      display: flex;
      flex-direction: column;
    }

    .title-text {
      font-weight: 500;
      color: #2c3e50;
    }

    .ticket-id {
      font-size: 12px;
      color: #7f8c8d;
    }

    .status-open { background: #f39c12; color: white; }
    .status-in_progress { background: #3498db; color: white; }
    .status-resolved { background: #27ae60; color: white; }
    .status-closed { background: #95a5a6; color: white; }

    .priority-low { background: #27ae60; color: white; }
    .priority-medium { background: #f39c12; color: white; }
    .priority-high { background: #e67e22; color: white; }
    .priority-urgent { background: #e74c3c; color: white; }

    .not-assigned {
      color: #7f8c8d;
      font-style: italic;
    }

    .no-tickets {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .no-tickets mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .ticket-dialog {
      min-width: 600px;
    }

    .ticket-form {
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

    .ticket-details-dialog {
      min-width: 700px;
      max-width: 900px;
    }

    .ticket-details {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .ticket-info {
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

    .ticket-description h4,
    .ticket-comments h4 {
      color: #2c3e50;
      margin: 0 0 12px 0;
    }

    .ticket-description p {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin: 0;
      line-height: 1.6;
    }

    .comment-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 16px;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .comment-author {
      font-weight: 500;
      color: #2c3e50;
    }

    .comment-date {
      font-size: 12px;
      color: #7f8c8d;
    }

    .comment-content {
      color: #34495e;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .tickets-container {
        padding: 16px;
      }
      
      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }
      
      .form-row {
        flex-direction: column;
      }
      
      .ticket-dialog,
      .ticket-details-dialog {
        min-width: auto;
        width: 90vw;
      }
    }
  `]
})
export class TicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  techUsers: any[] = [];
  selectedTicket: Ticket | null = null;
  
  // Filtros
  selectedStatus = '';
  selectedPriority = '';
  selectedCategory = '';
  
  // Formulario
  ticketForm: FormGroup;
  isEditing = false;
  currentTicketId: number | null = null;
  
  // Comentarios
  newComment = '';
  
  displayedColumns = ['title', 'status', 'priority', 'category', 'createdBy', 'assignedTo', 'createdAt', 'actions'];

  @ViewChild('ticketDialog') ticketDialog: any;
  @ViewChild('ticketDetailsDialog') ticketDetailsDialog: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['medium', Validators.required],
      category: ['other', Validators.required],
      status: ['open'],
      assignedTo: ['']
    });
  }

  ngOnInit(): void {
    this.loadTickets();
    this.loadTechUsers();
  }

  /**
   * Carga todos los tickets
   */
  loadTickets(): void {
    this.apiService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.filterTickets();
      },
      error: (error) => {
        console.error('Error cargando tickets:', error);
        this.snackBar.open('Error cargando tickets', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Carga usuarios de tecnología para asignación
   */
  loadTechUsers(): void {
    if (this.canAssignTickets()) {
      this.apiService.getAllUsers().subscribe({
        next: (users) => {
          this.techUsers = users.filter(user => 
            user.role.name === 'technology' || user.role.name === 'admin' || user.role.name === 'superadmin'
          );
        },
        error: (error) => {
          console.error('Error cargando usuarios:', error);
        }
      });
    }
  }

  /**
   * Filtra los tickets según los criterios seleccionados
   */
  filterTickets(): void {
    this.filteredTickets = this.tickets.filter(ticket => {
      const statusMatch = !this.selectedStatus || ticket.status === this.selectedStatus;
      const priorityMatch = !this.selectedPriority || ticket.priority === this.selectedPriority;
      const categoryMatch = !this.selectedCategory || ticket.category === this.selectedCategory;
      
      return statusMatch && priorityMatch && categoryMatch;
    });
  }

  /**
   * Abre el dialog para crear un nuevo ticket
   */
  openCreateDialog(): void {
    this.isEditing = false;
    this.currentTicketId = null;
    this.ticketForm.reset({
      title: '',
      description: '',
      priority: 'medium',
      category: 'other',
      status: 'open',
      assignedTo: ''
    });
    
    this.dialog.open(this.ticketDialog, {
      width: '600px',
      maxWidth: '90vw'
    });
  }

  /**
   * Abre el dialog para ver los detalles del ticket
   */
  viewTicket(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.newComment = '';
    
    this.dialog.open(this.ticketDetailsDialog, {
      width: '800px',
      maxWidth: '90vw'
    });
  }

  /**
   * Abre el dialog para editar un ticket
   */
  editTicket(ticket: Ticket): void {
    this.isEditing = true;
    this.currentTicketId = ticket.id;
    this.selectedTicket = ticket;
    
    this.ticketForm.patchValue({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      status: ticket.status,
      assignedTo: ticket.assignedTo || ''
    });
    
    this.dialog.open(this.ticketDialog, {
      width: '600px',
      maxWidth: '90vw'
    });
  }

  /**
   * Guarda el ticket (crear o actualizar)
   */
  saveTicket(): void {
    if (this.ticketForm.valid) {
      const ticketData = this.ticketForm.value;
      
      if (this.isEditing && this.currentTicketId) {
        // Actualizar ticket existente
        this.apiService.updateTicket(this.currentTicketId, ticketData).subscribe({
          next: (updatedTicket) => {
            this.snackBar.open('Ticket actualizado correctamente', 'Cerrar', { duration: 3000 });
            this.loadTickets();
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error actualizando ticket:', error);
            this.snackBar.open('Error actualizando ticket', 'Cerrar', { duration: 3000 });
          }
        });
      } else {
        // Crear nuevo ticket
        this.apiService.createTicket(ticketData).subscribe({
          next: (newTicket) => {
            this.snackBar.open('Ticket creado correctamente', 'Cerrar', { duration: 3000 });
            this.loadTickets();
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error creando ticket:', error);
            this.snackBar.open('Error creando ticket', 'Cerrar', { duration: 3000 });
          }
        });
      }
    }
  }

  /**
   * Agrega un comentario al ticket
   */
  addComment(): void {
    if (this.newComment.trim() && this.selectedTicket) {
      this.apiService.addTicketComment(this.selectedTicket.id, this.newComment.trim()).subscribe({
        next: (comment) => {
          this.snackBar.open('Comentario agregado', 'Cerrar', { duration: 3000 });
          this.newComment = '';
          this.loadTickets(); // Recargar para obtener el comentario
          
          // Actualizar el ticket seleccionado
          const updatedTicket = this.tickets.find(t => t.id === this.selectedTicket!.id);
          if (updatedTicket) {
            this.selectedTicket = updatedTicket;
          }
        },
        error: (error) => {
          console.error('Error agregando comentario:', error);
          this.snackBar.open('Error agregando comentario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  /**
   * Cierra el dialog de ticket
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
   * Verifica si el usuario puede editar un ticket
   */
  canEditTicket(ticket: Ticket): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Superadmin y admin pueden editar todos
    if (this.authService.isAdmin()) return true;
    
    // Technology puede editar si está asignado a él
    if (this.authService.isTechnology() && ticket.assignedTo === currentUser.id) return true;
    
    // Usuario puede editar solo sus propios tickets si están abiertos
    if (ticket.createdById === currentUser.id && ticket.status === 'open') return true;
    
    return false;
  }

  /**
   * Verifica si el usuario puede asignar tickets
   */
  canAssignTickets(): boolean {
    return this.authService.isAdmin() || this.authService.isTechnology();
  }

  /**
   * Obtiene el texto de estado para mostrar
   */
  getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'open': 'Abierto',
      'in_progress': 'En Progreso',
      'resolved': 'Resuelto',
      'closed': 'Cerrado'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtiene el texto de prioridad para mostrar
   */
  getPriorityDisplay(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return priorityMap[priority] || priority;
  }

  /**
   * Obtiene el texto de categoría para mostrar
   */
  getCategoryDisplay(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'hardware': 'Hardware',
      'software': 'Software',
      'network': 'Red',
      'other': 'Otro'
    };
    return categoryMap[category] || category;
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
}
