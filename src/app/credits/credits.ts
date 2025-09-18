import { CommonModule } from '@angular/common';
import { Component, ViewChild, signal, TemplateRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService, Credit, User } from '../services/api.service';

interface CreditItem {
  id: number;
  firstName: string;
  lastName: string;
  creditType: string;
  startDate: Date;
  endDate: Date;
  status: string;
  // Admin only fields (hidden by default)
  outstandingAmount: number;
  pendingInstallments: number;
  interestRate: number;
  totalAmount: number;
  installmentAmount: number; // Cuota mensual
  userId: number; // ID del usuario propietario del crédito
  selected: boolean;
  // Optional demo image url for visualization
  detailImageUrl?: string;
}

interface CreditSummaryTop {
  loanAmount: number; // Valor del préstamo
  tna30360: number; // TNA (30/360) en %
  years: number; // Años
  paymentFrequency: string; // Frecuencia de Pago
  equivalentInterest: number; // Interés equivalente en %
  paymentsPerYear: number; // N° de pagos por año
  totalInstallments: number; // N° Total de Cuotas
}

interface AmortizationRow {
  installmentNumber: number; // Número de Cuota
  installmentAmount: number; // CUOTA A PAGAR
  interest: number; // INTERÉS
  capitalAmortized: number; // CAPITAL AMORTIZADO
  capitalAlive: number; // CAPITAL VIVO
}

interface CreditDetailViewModel {
  top: CreditSummaryTop;
  resumen: { loanAmount: number; totalInstallmentsSum: number; totalInterest: number };
  table: AmortizationRow[];
}

@Component({
  selector: 'app-credits',
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatDialogModule,
    MatTooltipModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    HttpClientModule
  ],
  templateUrl: './credits.html',
  styleUrl: './credits.css'
})
export class Credits implements OnInit {
  selectedTab = signal(0);
  searchTerm = signal('');
  allSelected = signal(false);
  isAdmin = signal(false);
  showAdminFields = signal(false);
  currentUser = signal<User | null>(null);
  credits = signal<Credit[]>([]);
  loading = signal(false);

  // Dialog template references
  @ViewChild('viewDialogTpl') viewDialogTpl?: TemplateRef<any>;
  @ViewChild('formDialogTpl') formDialogTpl?: TemplateRef<any>;

  // Local UI state for dialogs
  selectedCredit: CreditItem | null = null;
  editableCredit: any = null;
  isEditMode = false;
  selectedDetail: CreditDetailViewModel | null = null;

  // Datos ahora vienen del backend

  displayedColumns: string[] = ['select', 'name', 'creditType', 'startDate', 'endDate', 'status', 'actions'];
  adminColumns: string[] = ['outstandingAmount', 'pendingInstallments', 'interestRate'];
  userColumns: string[] = ['status', 'startDate', 'endDate', 'installmentAmount', 'outstandingAmount'];
  
  get dataSource() {
    return this.credits();
  }

  isIndeterminate() {
    // Implementar lógica de selección si es necesaria
    return false;
  }

  toggleAllSelection() {
    // Implementar selección múltiple si es necesaria
    this.allSelected.update(v => !v);
  }

  toggleItemSelection(item: Credit) {
    // Implementar selección de elementos si es necesaria
    console.log('Toggle selection for item:', item.id);
  }

  onSearchChange(event: any) {
    this.searchTerm.set(event.target.value);
  }

  searchCredits() {
    // Implement search logic
    console.log('Searching credits:', this.searchTerm());
  }

  viewAllCredits() {
    // Implement logic to view all credits
    console.log('View all credits');
  }

  viewCreditCalendar() {
    // Implement logic to view credit calendar
    console.log('View credit calendar');
  }

  searchAvailableCredits() {
    // Implement logic to search available credits
    console.log('Search available credits');
  }

  processCredit() {
    // Implementar lógica de procesamiento de créditos si es necesaria
    console.log('Processing credits...');
  }

  toggleAdminFields() {
    this.showAdminFields.update(v => !v);
    if (this.showAdminFields()) {
      this.displayedColumns = [...this.displayedColumns.slice(0, 6), ...this.adminColumns, 'actions'];
    } else {
      this.displayedColumns = ['select', 'name', 'creditType', 'startDate', 'endDate', 'status', 'actions'];
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currencyDisplay: "narrowSymbol",
      currency: 'COP'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES');
  }

  formatPercentage(value: number): string {
    return `${value}%`;
  }

  constructor(
    private dialog: MatDialog,
    private apiService: ApiService
  ) {
    // Inicializar columnas según el rol
    this.updateDisplayedColumns();
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadCredits();
  }

  async loadCurrentUser() {
    try {
      // En una implementación real, esto vendría del servicio de autenticación
      // Por ahora, simulamos un usuario
      const mockUser: User = {
        id: 1,
        firstName: 'user2',
        lastName: 'Usuario',
        email: 'user2@helpdesk.com',
        birthDate: '1990-01-01',
        position: 'Desarrollador',
        startDate: '2023-01-01',
        hasDebt: false,
        isActive: true,
        roleId: 2,
        role: { id: 2, name: 'user', description: 'Usuario regular' }
      };
      
      this.currentUser.set(mockUser);
      this.isAdmin.set(mockUser.role.name === 'admin');
      this.updateDisplayedColumns();
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  }

  async loadCredits() {
    this.loading.set(true);
    try {
      let credits: Credit[];
      
      if (this.isAdmin()) {
        credits = await firstValueFrom(this.apiService.getCredits());
      } else {
        const currentUser = this.currentUser();
        if (currentUser) {
          credits = await firstValueFrom(this.apiService.getCreditsByUser(currentUser.id));
        } else {
          credits = [];
        }
      }
      
      this.credits.set(credits);
      console.log('Créditos cargados:', credits);
    } catch (error) {
      console.error('Error cargando créditos:', error);
      this.credits.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  // Método para cambiar entre admin y usuario normal (para testing)
  toggleUserRole() {
    this.isAdmin.update(v => !v);
    this.updateDisplayedColumns();
  }

  // Método para actualizar las columnas mostradas según el rol
  updateDisplayedColumns() {
    if (this.isAdmin()) {
      this.displayedColumns = ['select', 'name', 'creditType', 'startDate', 'endDate', 'status', 'actions'];
    } else {
      this.displayedColumns = ['status', 'startDate', 'endDate', 'installmentAmount', 'outstandingAmount'];
    }
  }

  // Método para logout
  logout() {
    // Aquí se implementaría la lógica de logout
    console.log('Usuario deslogueado');
    // Por ejemplo: this.authService.logout();
  }

  // Dialog actions
  openViewDialog(item: Credit) {
    this.selectedCredit = item as any; // Temporal cast
    this.selectedDetail = this.buildMockDetail(item as any);
    if (this.viewDialogTpl) {
      this.dialog.open(this.viewDialogTpl, {
        width: '980px',
        maxWidth: '98vw'
      });
    }
  }

  openCreateDialog() {
    this.isEditMode = false;
    this.editableCredit = {
      creditType: '',
      loanAmount: 0,
      totalMonths: 12
    };
    if (this.formDialogTpl) {
      this.dialog.open(this.formDialogTpl, {
        width: '720px',
        maxWidth: '98vw'
      });
    }
  }

  openEditDialog(item: Credit) {
    this.isEditMode = true;
    this.editableCredit = { ...item };
    if (this.formDialogTpl) {
      this.dialog.open(this.formDialogTpl, {
        width: '720px',
        maxWidth: '98vw'
      });
    }
  }

  async saveForm() {
    if (!this.editableCredit) return;
    
    try {
      const currentUser = this.currentUser();
      if (!currentUser) return;

      if (this.isEditMode) {
        await firstValueFrom(this.apiService.updateCredit(this.editableCredit.id, this.editableCredit));
      } else {
        const newCredit = await firstValueFrom(this.apiService.createCredit({
          ...this.editableCredit,
          userId: currentUser.id
        }));
      }
      
      this.dialog.closeAll();
      this.loadCredits(); // Recargar datos
    } catch (error) {
      console.error('Error guardando crédito:', error);
    }
  }

  cancelDialog() {
    this.dialog.closeAll();
  }

  private buildMockDetail(item: CreditItem): CreditDetailViewModel {
    // Demo data shaped like the provided screenshot
    const loanAmount = 5694200; // Valor del préstamo
    const installmentAmount = 447494; // cuota ejemplo
    const rows: AmortizationRow[] = [];
    let capitalAlive = loanAmount;
    for (let n = 0; n <= 14; n++) {
      if (n === 0) {
        rows.push({
          installmentNumber: 0,
          installmentAmount: 0,
          interest: 0,
          capitalAmortized: 0,
          capitalAlive
        });
      } else {
        const interest = [74025, 69170, 64251, 59269, 54222, 49110, 43931, 38684, 33370, 27986, 22533, 17008, 11412,  5743][n - 1];
        const capitalAmortized = installmentAmount - interest;
        capitalAlive = Math.max(0, capitalAlive - capitalAmortized);
        rows.push({
          installmentNumber: n,
          installmentAmount,
          interest,
          capitalAmortized,
          capitalAlive
        });
      }
    }

    const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
    const totalInstallmentsSum = rows.reduce((s, r) => s + r.installmentAmount, 0);

    return {
      top: {
        loanAmount,
        tna30360: 15.6,
        years: 1,
        paymentFrequency: 'Mensual',
        equivalentInterest: 1.3,
        paymentsPerYear: 12,
        totalInstallments: 14
      },
      resumen: {
        loanAmount,
        totalInstallmentsSum,
        totalInterest
      },
      table: rows
    };
  }
}
