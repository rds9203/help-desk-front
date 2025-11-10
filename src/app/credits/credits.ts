import { CommonModule } from '@angular/common';
import { Component, ViewChild, signal, computed, TemplateRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { AuthService, User } from '../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService, Credit, Notification } from '../services/api.service';

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
  status: 'PAGADO' | 'PENDIENTE';
}

interface CreditDetailViewModel {
  top: CreditSummaryTop;
  resumen: { loanAmount: number; totalInstallmentsSum: number; totalInterest: number };
  table: AmortizationRow[];
  currentInstallmentIndex: number;
  pendingInstallments: number;
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
  isAdmin = signal(false);
  showAdminFields = signal(false);
  currentUser = signal<User | null>(null);
  credits = signal<Credit[]>([]);
  loading = signal(false);
  availableUsers = signal<User[]>([]);
  selectedUserId = signal<number>(1);
  notifications = signal<Notification[]>([]);
  unreadNotificationsCount = signal<number>(0);
  showNotifications = signal<boolean>(false);
  selectedCreditIds = signal<number[]>([]);
  selectedInstallments = signal<number[]>([]);
  showPayControls = signal(false);
  selectedCredits = computed(() =>
    this.credits().filter(credit => this.selectedCreditIds().includes(Number(credit.id)))
  );
  areAllCreditsSelected = computed(() =>
    this.credits().length > 0 && this.selectedCreditIds().length === this.credits().length
  );
  isSelectionIndeterminate = computed(() =>
    this.selectedCreditIds().length > 0 && !this.areAllCreditsSelected()
  );
  detailColumns = computed(() =>
    this.isAdmin()
      ? ['installmentSelect', 'installmentNumber', 'installmentStatus', 'installmentAmount', 'interest', 'capitalAmortized', 'capitalAlive']
      : ['installmentNumber', 'installmentStatus', 'installmentAmount', 'interest', 'capitalAmortized', 'capitalAlive']
  );

  // Dialog template references
  @ViewChild('viewDialogTpl') viewDialogTpl?: TemplateRef<any>;
  @ViewChild('formDialogTpl') formDialogTpl?: TemplateRef<any>;
  @ViewChild('newCreditDialogTpl') newCreditDialogTpl?: TemplateRef<any>;
  @ViewChild('authorizationDialogTpl') authorizationDialogTpl?: TemplateRef<any>;

  // Local UI state for dialogs
  selectedCredit: CreditItem | null = null;
  editableCredit: any = null;
  isEditMode = false;
  selectedDetail: CreditDetailViewModel | null = null;
  
  // New credit form state
  newCreditForm = {
    loanAmount: 0,
    installments: null as number | null
  };
  maxCreditInfo: any = null;
  maxLoanLimit = 0;
  authorizationDocument: any = null;
  acceptTermsChecked = false;

  // Datos ahora vienen del backend

  displayedColumns: string[] = ['select', 'name', 'creditType', 'startDate', 'endDate', 'status', 'actions'];
  adminColumns: string[] = ['outstandingAmount', 'pendingInstallments', 'interestRate'];
  userColumns: string[] = ['status', 'startDate', 'endDate', 'installmentAmount', 'outstandingAmount'];
  
  get dataSource() {
    return this.credits();
  }

  isIndeterminate() {
    return this.isSelectionIndeterminate();
  }

  toggleAllSelection(checked: boolean | undefined) {
    if (checked) {
      const ids = this.credits().map(item => Number(item.id));
      this.selectedCreditIds.set(ids);
    } else {
      this.selectedCreditIds.set([]);
    }
  }

  toggleItemSelection(item: Credit, checked: boolean | undefined) {
    const id = Number(item.id);
    const currentSelection = this.selectedCreditIds();
    const nextSelection = checked
      ? [...currentSelection, id]
      : currentSelection.filter(selectedId => selectedId !== id);
    this.selectedCreditIds.set(nextSelection);
  }

  clearCreditSelection() {
    this.selectedCreditIds.set([]);
  }

  isCreditSelected(item: Credit): boolean {
    return this.selectedCreditIds().includes(Number(item.id));
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


  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES');
  }

  formatPercentage(value: number): string {
    return `${value}%`;
  }

  constructor(
    private dialog: MatDialog,
    private apiService: ApiService,
    public authService: AuthService
  ) {
    // Inicializar con usuario por defecto
    this.selectedUserId.set(1);
    // Inicializar columnas por defecto
    this.displayedColumns = ['creditType', 'startDate', 'endDate', 'installmentAmount', 'outstandingAmount', 'status', 'actions'];
  }

  /**
   * Inicialización del componente
   * Carga todos los datos necesarios al iniciar la aplicación
   */
  ngOnInit() {
    // Cargar el usuario actual desde el AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUser.set(currentUser);
      this.isAdmin.set(this.authService.isAdmin());
      this.updateDisplayedColumns();
    }
    
    // Cargar créditos
    this.loadCredits();
  }

  /**
   * Verifica la autenticación con GLPI y carga datos del usuario
   */
  private checkAuthentication() {
    // Suscribirse al estado de autenticación
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        console.log('✅ Usuario autenticado con GLPI');
        this.loadUserFromGLPI();
      } else {
        console.log('⚠️ Usando datos locales como fallback');
      }
    });

    // Verificar si ya hay un usuario autenticado
    if (this.authService.isAuthenticated()) {
      this.loadUserFromGLPI();
    }
  }

  /**
   * Carga datos del usuario desde GLPI
   */
  private loadUserFromGLPI() {
    const glpiUser = this.authService.currentUser();
    if (glpiUser) {
      console.log('👤 Usuario GLPI cargado:', glpiUser);
      
      // Convertir usuario de GLPI al formato local
      const localUser = this.convertGLPIUserToLocal(glpiUser);
      
      // Actualizar usuario actual
      this.currentUser.set(localUser);
      
      // Determinar si es admin basado en perfiles de GLPI
      this.isAdmin.set(this.authService.isAdmin());
      this.updateDisplayedColumns();
    }
  }

  /**
   * Obtiene el nombre del rol de un usuario
   */
  getRoleName(role: string | { id: string | number; name: string; description?: string }): string {
    return typeof role === 'string' ? role : role.name;
  }

  /**
   * Verifica si un usuario es admin
   */
  isUserAdmin(role: string | { id: string | number; name: string; description?: string }): boolean {
    const roleName = this.getRoleName(role);
    return roleName === 'admin' || roleName === 'superadmin';
  }

  /**
   * Convierte un usuario de GLPI al formato local
   */
  private convertGLPIUserToLocal(glpiUser: any): User {
    return {
      id: glpiUser.id,
      firstName: glpiUser.firstname || glpiUser.name || 'Usuario',
      lastName: glpiUser.realname || 'GLPI',
      email: glpiUser.email || 'usuario@glpi.com',
      position: 'Empleado', // Se puede mapear desde profiles
      startDate: new Date().toISOString().split('T')[0], // Fecha actual como fallback
      salary: 150000, // Salario por defecto, se puede mapear desde campos personalizados
      hasDebt: false,
      role: this.authService.isAdmin() ? 'admin' : 'user'
    };
  }

  /**
   * Carga la lista de todos los usuarios disponibles
   * @returns void
   * @example
   * // Ejemplo de datos que carga:
   * [
   *   {
   *     id: 1,
   *     firstName: 'Pedro',
   *     lastName: 'García',
   *     email: 'pedro.garcia@helpdesk.com',
   *     position: 'Desarrollador',
   *     startDate: '2024-01-15',
   *     salary: 100000,
   *     hasDebt: true,
   *     role: { id: 2, name: 'user', description: 'Usuario regular' }
   *   }
   * ]
   */
  loadUsers() {
    try {
      // Usar datos mockados por ahora
      const mockUsers = [
        {
          id: 1,
          firstName: 'Pedro',
          lastName: 'García',
          email: 'pedro.garcia@helpdesk.com',
          position: 'Desarrollador',
          startDate: '2024-01-15',
          salary: 100000,
          hasDebt: true,
          role: 'user'
        },
        {
          id: 2,
          firstName: 'María',
          lastName: 'López',
          email: 'maria.lopez@helpdesk.com',
          position: 'Diseñadora',
          startDate: '2022-06-15',
          salary: 200000,
          hasDebt: false,
          role: 'user'
        },
        {
          id: 3,
          firstName: 'Carlos',
          lastName: 'Martínez',
          email: 'carlos.martinez@helpdesk.com',
          position: 'Gerente',
          startDate: '2022-01-15',
          salary: 300000,
          hasDebt: true,
          role: 'user'
        },
        {
          id: 4,
          firstName: 'Ana',
          lastName: 'Sánchez',
          email: 'ana.sanchez@helpdesk.com',
          position: 'Analista',
          startDate: '2024-06-01',
          salary: 150000,
          hasDebt: false,
          role: 'user'
        },
        {
          id: 5,
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@helpdesk.com',
          position: 'Administrador',
          startDate: '2020-01-01',
          salary: 500000,
          hasDebt: false,
          role: 'admin'
        }
      ];
      
      console.log('Usuarios cargados:', mockUsers);
      this.availableUsers.set(mockUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }

  /**
   * Carga la información del usuario actualmente seleccionado
   * @returns void
   * @example
   * // Ejemplo de usuario cargado:
   * {
   *   id: 1,
   *   firstName: 'Pedro',
   *   lastName: 'García',
   *   email: 'pedro.garcia@helpdesk.com',
   *   position: 'Desarrollador',
   *   startDate: '2024-01-15',
   *   salary: 100000,
   *   hasDebt: true,
   *   role: { id: 2, name: 'user', description: 'Usuario regular' }
   * }
   */
  loadCurrentUser() {
    try {
      // Usar el usuario real del AuthService
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        console.log('✅ Usuario real cargado desde AuthService:', currentUser);
        this.currentUser.set(currentUser);
        this.isAdmin.set(this.authService.isAdmin());
        this.updateDisplayedColumns();
        return;
      }
      
      // FALLBACK: Si no hay usuario en AuthService, usar datos mockados
      const selectedId = this.selectedUserId();
      console.log('⚠️ Usando datos mockados para usuario ID:', selectedId);
      
      const mockUsers = [
        {
          id: 1,
          firstName: 'Pedro',
          lastName: 'García',
          email: 'pedro.garcia@helpdesk.com',
          position: 'Desarrollador',
          startDate: '2024-01-15',
          salary: 3500000, // Actualizado para coincidir con el servidor
          hasDebt: true,
          debtAmount: 5000000,
          paidAmount: 1500000,
          role: 'user'
        },
        {
          id: 2,
          firstName: 'María',
          lastName: 'López',
          email: 'maria.lopez@helpdesk.com',
          position: 'Diseñadora',
          startDate: '2022-06-15',
          salary: 200000,
          hasDebt: false,
          role: 'user'
        },
        {
          id: 3,
          firstName: 'Carlos',
          lastName: 'Martínez',
          email: 'carlos.martinez@helpdesk.com',
          position: 'Gerente',
          startDate: '2022-01-15',
          salary: 300000,
          hasDebt: true,
          role: 'user'
        },
        {
          id: 4,
          firstName: 'Ana',
          lastName: 'Sánchez',
          email: 'ana.sanchez@helpdesk.com',
          position: 'Analista',
          startDate: '2024-06-01',
          salary: 150000,
          hasDebt: false,
          role: 'user'
        },
        {
          id: 5,
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@helpdesk.com',
          position: 'Administrador',
          startDate: '2020-01-01',
          salary: 500000,
          hasDebt: false,
          role: 'admin'
        }
      ];
      
      // Si no hay usuario seleccionado, cargar el admin por defecto
      const userId = selectedId || 5; // Admin por defecto
      const user = mockUsers.find(u => u.id === userId);
      
      if (user) {
        console.log('Usuario cargado:', user);
        this.currentUser.set(user);
        this.isAdmin.set(this.isUserAdmin(user.role));
        this.updateDisplayedColumns();
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  }

  /**
   * Cambia el usuario actualmente seleccionado
   * @param userId - ID del usuario a seleccionar
   * @returns void
   * @example
   * // Cambiar al usuario con ID 2:
   * changeUser(2);
   */
  changeUser(userId: number) {
    console.log('Cambiando a usuario:', userId);
    this.selectedUserId.set(userId);
    this.loadCurrentUser();
    this.loadCredits();
  }

  /**
   * Carga los créditos según el rol del usuario
   * - Admin: ve todos los créditos de todos los usuarios
   * - Usuario: ve solo sus propios créditos
   * @returns void
   * @example
   * // Ejemplo de crédito cargado:
   * {
   *   id: 1,
   *   userId: 1,
   *   user: { id: 1, firstName: 'Pedro', lastName: 'García', ... },
   *   creditType: 'Préstamo Personal',
   *   amount: 500000,
   *   installmentAmount: 25000,
   *   outstandingAmount: 400000,
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31',
   *   status: 'ACTIVO',
   *   interestRate: { id: 1, rate: 12.5 },
   *   installments: 20,
   *   paidInstallments: 4
   * }
   */
  loadCredits() {
    this.loading.set(true);
    try {
      console.log('🔍 Debug - Usuario actual:', this.currentUser());
      console.log('🔍 Debug - Es admin:', this.isAdmin());
      console.log('🔍 Debug - AuthService isAdmin:', this.authService.isAdmin());
      
    const currentUser = this.currentUser() ?? this.authService.getCurrentUser();
    const isAdmin = this.isAdmin();

    const creditsObservable = isAdmin
      ? this.apiService.getCredits()
      : this.apiService.getCreditsByUser(currentUser?.id ?? this.authService.getCurrentUser()?.id ?? 0);

    creditsObservable.subscribe({
        next: (credits) => {
          console.log('✅ Créditos cargados desde API:', credits);
          this.credits.set(credits);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando créditos:', error);
          this.credits.set([]);
          this.loading.set(false);
        }
      });
    } catch (error) {
      console.error('Error cargando créditos:', error);
      this.credits.set([]);
      this.loading.set(false);
    }
  }


  // Método para actualizar las columnas mostradas según el rol
  updateDisplayedColumns() {
    // Usar un valor por defecto si isAdmin no está definido
    const isAdminUser = this.isAdmin();
    console.log('Actualizando columnas. Es admin:', isAdminUser);
    
    if (isAdminUser) {
      this.displayedColumns = ['select', 'name', 'creditType', 'startDate', 'endDate', 'status', 'actions'];
    } else {
      this.displayedColumns = ['creditType', 'startDate', 'endDate', 'installmentAmount', 'outstandingAmount', 'status', 'actions'];
    }
    console.log('Columnas actualizadas:', this.displayedColumns);
  }

  // Método para logout
  logout() {
    // Aquí se implementaría la lógica de logout
    console.log('Usuario deslogueado');
    // Por ejemplo: this.authService.logout();
  }

  // Dialog actions
  openViewDialog(item: Credit, forcePayMode = false) {
    this.selectedCredit = item as any; // Temporal cast
    this.selectedDetail = this.buildCreditDetail(item);
    this.selectedInstallments.set([]);
    this.showPayControls.set(this.isAdmin() && forcePayMode);
    if (this.viewDialogTpl) {
      this.dialog.open(this.viewDialogTpl, {
        width: '980px',
        maxWidth: '98vw'
      });
    }
  }

  openPayDialog(item: Credit) {
    this.openViewDialog(item, true);
  }

  /**
   * Abre el diálogo para crear un nuevo crédito
   * Carga la información del crédito máximo antes de abrir el formulario
   * @returns void
   */
  async openCreateDialog() {
    const currentUser = this.currentUser();
    if (!currentUser) return;
    
    // Cargar información de crédito máximo (opcional, no bloquear el diálogo si falla)
    try {
      this.maxCreditInfo = await firstValueFrom(this.apiService.getMaxCredit(currentUser.id));
      console.log('✅ Información de crédito máximo cargada:', this.maxCreditInfo);
    } catch (error) {
      console.warn('⚠️ No se pudo cargar la información de crédito máximo, continuando sin ella:', error);
      this.maxCreditInfo = null; // Continuar sin la información
    }
    
    // Inicializar formulario
    this.newCreditForm = {
      loanAmount: 0,
      installments: null
    };
    
    // Abrir el diálogo
    if (this.newCreditDialogTpl) {
      this.dialog.open(this.newCreditDialogTpl, {
        width: '600px',
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
    this.clearInstallmentSelection();
    this.showPayControls.set(false);
  }

  /**
   * Genera el documento de autorización de descuentos sobre salarios
   * @returns void
   * @example
   * // Ejemplo de documento generado:
   * {
   *   date: "27 de agosto de 2025",
   *   company: "Sectorial S.A.S",
   *   city: "Bogotá",
   *   loanAmount: 500000,
   *   employeeName: "Pedro García",
   *   employeeId: "1.007.286.964",
   *   installments: 12,
   *   installmentAmount: 41667,
   *   installmentDates: [
   *     { number: 1, date: "27-sep-2025", amount: 41667 },
   *     { number: 2, date: "27-oct-2025", amount: 41667 }
   *   ]
   * }
   */
  generateAuthorization() {
    const currentUser = this.currentUser();
    if (!currentUser) return;
    
    console.log('🔍 Debug - Formulario actual:', this.newCreditForm);
    console.log('🔍 Debug - loanAmount:', this.newCreditForm.loanAmount);
    console.log('🔍 Debug - installments:', this.newCreditForm.installments);
    
    // Validar que el monto esté lleno
    if (!this.newCreditForm.loanAmount || this.newCreditForm.loanAmount <= 0) {
      alert('⚠️ Debe ingresar un monto válido.');
      return;
    }
    
    // Validar que las cuotas estén llenas
    if (!this.newCreditForm.installments || this.newCreditForm.installments <= 0) {
      alert('⚠️ Debe seleccionar el número de cuotas.');
      return;
    }
    
    // Convertir a número si viene como string
    const installments = typeof this.newCreditForm.installments === 'string' 
      ? parseInt(this.newCreditForm.installments, 10) 
      : this.newCreditForm.installments;
    
    // Validar que sea un número de cuotas válido
    const validInstallments = [6, 12, 18, 24, 36];
    console.log('🔍 Debug - installments después de conversión:', installments);
    console.log('🔍 Debug - incluye en válidos?:', validInstallments.includes(installments));
    
    if (!installments || !validInstallments.includes(installments)) {
      alert('⚠️ Debe seleccionar un número de cuotas válido (6, 12, 18, 24 o 36). Valor recibido: ' + installments);
      return;
    }
    
    // Actualizar el valor a número
    this.newCreditForm.installments = installments;
    
    // Validar que el monto no exceda el límite
    if (this.maxCreditInfo && this.newCreditForm.loanAmount > this.maxCreditInfo.maxCredit) {
      alert(`⚠️ Error: El monto solicitado (${this.formatCurrency(this.newCreditForm.loanAmount)}) excede su crédito máximo disponible (${this.formatCurrency(this.maxCreditInfo.maxCredit)}).`);
      return;
    }
    
    // Si no hay maxCreditInfo, calcular el límite manualmente
    const calculatedMaxCredit = this.calculateMaxCredit();
    if (this.newCreditForm.loanAmount > calculatedMaxCredit) {
      alert(`⚠️ Error: El monto solicitado (${this.formatCurrency(this.newCreditForm.loanAmount)}) excede su crédito máximo disponible (${this.formatCurrency(calculatedMaxCredit)}).`);
      return;
    }
    
    // Generar documento de autorización con datos del usuario actual
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Calcular tabla de amortización
    const interestRate = 15.6 / 100; // Tasa nominal anual 15.6%
    const monthlyRate = interestRate / 12; // Tasa mensual
    const totalMonths = this.newCreditForm.installments;
    
    // Calcular cuota mensual usando la fórmula de amortización
    const monthlyPayment = this.newCreditForm.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    // Generar tabla de amortización
    let outstandingBalance = this.newCreditForm.loanAmount;
    const amortizationTable = [];
    
    for (let i = 0; i <= totalMonths; i++) {
      if (i === 0) {
        // Fila inicial sin pago
        amortizationTable.push({
          installment: i,
          payment: 0,
          interest: 0,
          principal: 0,
          balance: outstandingBalance
        });
      } else {
        const interest = outstandingBalance * monthlyRate;
        const principal = monthlyPayment - interest;
        outstandingBalance -= principal;
        
        amortizationTable.push({
          installment: i,
          payment: Math.round(monthlyPayment),
          interest: Math.round(interest),
          principal: Math.round(principal),
          balance: Math.max(0, Math.round(outstandingBalance))
        });
      }
    }
    
    // Generar fechas de las cuotas
    const installmentDates = [];
    for (let i = 1; i <= this.newCreditForm.installments; i++) {
      const installmentDate = new Date(today);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      installmentDates.push({
        number: i,
        date: installmentDate.toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        amount: Math.round(monthlyPayment),
        interest: Math.round(amortizationTable[i].interest),
        balance: amortizationTable[i].balance
      });
    }
    
    this.authorizationDocument = {
      date: formattedDate,
      companyName: 'Sectorial S.A.S',
      city: 'Bogotá',
      documentType: 'Autorización de Descuentos por Nómina',
      loanAmount: this.newCreditForm.loanAmount,
      loanAmountWords: this.numberToWords(this.newCreditForm.loanAmount),
      employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
      employeeId: '1.007.286.964', // ID genérico
      totalInstallments: this.newCreditForm.installments,
      installments: this.newCreditForm.installments,
      installmentAmount: Math.round(monthlyPayment),
      installmentWords: this.numberToWords(Math.round(monthlyPayment)),
      paymentSchedule: installmentDates,
      amortizationTable: amortizationTable
    };
    
    this.dialog.closeAll();
    
    if (this.authorizationDialogTpl) {
      this.dialog.open(this.authorizationDialogTpl, {
        width: '800px',
        maxWidth: '98vw',
        height: '90vh'
      });
    }
  }

  async acceptAuthorization() {
    // Validar que acepte los términos
    if (!this.acceptTermsChecked) {
      alert('⚠️ Debe aceptar los términos y condiciones para continuar.');
      return;
    }
    
    try {
      // Guardar el crédito en la base de datos
      const newCredit = await firstValueFrom(
        this.apiService.createCredit({
          loanAmount: this.newCreditForm.loanAmount,
          installments: this.newCreditForm.installments!,
          creditType: 'Préstamo Personal'
        })
      );
      
      console.log('✅ Crédito creado exitosamente:', newCredit);
      alert('✅ Crédito creado exitosamente');
      
      this.dialog.closeAll();
      this.loadCredits(); // Recargar créditos
      
      // Resetear formulario
      this.newCreditForm = { loanAmount: 0, installments: null };
      this.acceptTermsChecked = false;
      this.authorizationDocument = null;
    } catch (error: any) {
      console.error('❌ Error creando crédito:', error);
      console.error('❌ Error completo:', JSON.stringify(error, null, 2));
      console.error('❌ Mensaje de error:', error?.message);
      console.error('❌ Error status:', error?.status);
      console.error('❌ Error response:', error?.error);
      alert(`❌ Error al crear el crédito: ${error?.error?.error || error?.message || 'Error desconocido'}`);
    }
  }

  /**
   * Valida que el monto del préstamo no exceda el máximo permitido
   * Muestra una alerta si excede el límite
   * @returns void
   */
  validateLoanAmount() {
    // Validar solo si hay maxCreditInfo y el monto es válido
    if (this.maxCreditInfo && this.newCreditForm.loanAmount > 0) {
      if (this.newCreditForm.loanAmount > this.maxCreditInfo.maxCredit) {
        alert(`⚠️ El monto solicitado (${this.formatCurrency(this.newCreditForm.loanAmount)}) excede su crédito máximo disponible (${this.formatCurrency(this.maxCreditInfo.maxCredit)}).`);
      }
    }
  }

  /**
   * Formatea un número como moneda en pesos colombianos
   * @param amount - Monto a formatear
   * @returns string - Monto formateado con símbolo de peso
   * @example
   * formatCurrency(1000000) // "$1.000.000"
   * formatCurrency(500000) // "$500.000"
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Convierte un número a palabras (en español)
   * @param num - Número a convertir
   * @returns string - Número en palabras
   */
  numberToWords(num: number): string {
    // Versión simplificada para evitar stack overflow con números grandes
    if (num === 0) return 'cero';
    if (num < 1000) return num.toString(); // Retornar como string para números pequeños
    
    // Para números grandes, retornar formato simplificado
    const millones = Math.floor(num / 1000000);
    const resto = num % 1000000;
    
    if (millones > 0) {
      return `${millones} ${millones === 1 ? 'millón' : 'millones'}${resto > 0 ? ' ' + resto : ''} pesos`;
    }
    
    return num.toString();
  }

  // === MÉTODOS DE NOTIFICACIONES ===
  async loadNotifications() {
    try {
      const notifications = await firstValueFrom(this.apiService.getNotifications());
      this.notifications.set(notifications);
      console.log('Notificaciones cargadas:', notifications);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  }

  async loadUnreadNotificationsCount() {
    try {
      const result = await firstValueFrom(this.apiService.getUnreadNotificationsCount());
      this.unreadNotificationsCount.set(result.count);
      console.log('Contador de notificaciones:', result.count);
    } catch (error) {
      console.error('Error cargando contador de notificaciones:', error);
    }
  }

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }

  async markNotificationAsRead(notification: Notification) {
    try {
      await firstValueFrom(this.apiService.markNotificationAsRead(notification.id));
      notification.isRead = true;
      await this.loadUnreadNotificationsCount();
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  }

  // === MÉTODOS DE APROBACIÓN ===
  async approveCredit(credit: Credit) {
    try {
      await firstValueFrom(this.apiService.approveCredit(credit.id));
      await this.loadCredits();
      await this.loadUnreadNotificationsCount();
      alert('✅ Crédito aprobado exitosamente');
    } catch (error) {
      console.error('Error aprobando crédito:', error);
      alert('❌ Error al aprobar el crédito');
    }
  }

  async rejectCredit(credit: Credit) {
    if (!confirm('¿Está seguro de que desea rechazar este crédito?')) {
      return;
    }
    
    try {
      await firstValueFrom(this.apiService.rejectCredit(credit.id));
      await this.loadCredits();
      await this.loadUnreadNotificationsCount();
      alert('✅ Crédito rechazado exitosamente');
    } catch (error) {
      console.error('Error rechazando crédito:', error);
      alert('❌ Error al rechazar el crédito');
    }
  }

  // === MÉTODOS PARA EL DIÁLOGO DE NUEVO CRÉDITO ===
  
  /**
   * Calcula cuántos años lleva trabajando el usuario
   */
  calculateYearsWorked(startDate: string | Date | undefined): number {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = diffDays / 365.25;
    
    return Math.floor(years * 10) / 10; // Redondear a 1 decimal
  }

  /**
   * Cuenta créditos activos (APROBADO)
   */
  getActiveCreditsCount(): number {
    const credits = this.credits();
    return credits.filter(c => c.status === 'ACTIVO').length;
  }

  /**
   * Verifica si tiene deuda activa (créditos aprobados)
   */
  hasActiveDebt(): boolean {
    return this.getActiveCreditsCount() > 0;
  }

  /**
   * Obtiene el monto total adeudado en créditos activos
   */
  getCurrentDebtAmount(): number {
    const credits = this.credits();
    return credits
      .filter(c => c.status === 'ACTIVO')
      .reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);
  }

  /**
   * Obtiene el monto total pagado en créditos activos
   */
  getPaidAmount(): number {
    const credits = this.credits();
    return credits
      .filter(c => c.status === 'ACTIVO')
      .reduce((sum, c) => sum + ((c.loanAmount || 0) - (c.outstandingAmount || 0)), 0);
  }

  /**
   * Calcula el crédito máximo disponible según antigüedad
   */
  calculateMaxCredit(): number {
    const user = this.currentUser();
    console.log('🔍 Debug calculateMaxCredit - Usuario:', user);
    console.log('🔍 Debug calculateMaxCredit - salary:', user?.salary);
    console.log('🔍 Debug calculateMaxCredit - startDate:', user?.startDate);
    
    if (!user || !user.salary || !user.startDate) {
      console.log('⚠️ calculateMaxCredit - Faltan datos del usuario, retornando 0');
      return 0;
    }

    const yearsWorked = this.calculateYearsWorked(user.startDate);
    console.log('🔍 Debug calculateMaxCredit - años trabajados:', yearsWorked);
    
    // Si lleva menos de 1 año: presta 1x su salario
    // Si lleva 1 año o más: presta 2x su salario
    const multiplier = yearsWorked >= 1 ? 2 : 1;
    const maxCredit = user.salary * multiplier;
    console.log('🔍 Debug calculateMaxCredit - multiplier:', multiplier);
    console.log('🔍 Debug calculateMaxCredit - maxCredit base:', maxCredit);
    
    // Descontar SOLO créditos activos (ACTIVO, APROBADO) - estos ya están siendo pagados
    const activeCredits = this.credits().filter(c => c.status === 'ACTIVO' || c.status === 'APROBADO');
    const totalActive = activeCredits.reduce((sum, c) => sum + (c.outstandingAmount || c.loanAmount || 0), 0);
    console.log('🔍 Debug calculateMaxCredit - créditos activos:', totalActive);
    
    // NO descontar créditos pendientes - solo son validación que se está procesando
    
    // Calcular el crédito disponible (solo descuenta créditos activos)
    const availableCredit = Math.max(0, maxCredit - totalActive);
    console.log('🔍 Debug calculateMaxCredit - crédito disponible:', availableCredit);
    
    return availableCredit;
  }

  /**
   * Cancela un crédito pendiente de aprobación
   */
  async cancelCredit(credit: Credit) {
    if (!confirm('¿Está seguro de que desea cancelar este crédito?')) {
      return;
    }
    
    try {
      await firstValueFrom(this.apiService.rejectCredit(credit.id));
      await this.loadCredits();
      alert('✅ Crédito cancelado exitosamente');
    } catch (error) {
      console.error('Error cancelando crédito:', error);
      alert('❌ Error al cancelar el crédito');
    }
  }

  /**
   * Obtiene la cantidad de créditos aprobados y activos
   */
  getApprovedCreditsCount(): number {
    return this.credits().filter(c => 
      c.status === 'ACTIVO' || c.status === 'APROBADO'
    ).length;
  }

  /**
   * Verifica si tiene deuda aprobada y activa (no pendiente)
   */
  hasApprovedAndActiveDebt(): boolean {
    return this.credits().some(c => 
      (c.status === 'ACTIVO' || c.status === 'APROBADO') && 
      (c.outstandingAmount || 0) > 0
    );
  }

  /**
   * Obtiene el monto de deuda aprobada y activa
   */
  getApprovedDebtAmount(): number {
    return this.credits()
      .filter(c => c.status === 'ACTIVO' || c.status === 'APROBADO')
      .reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);
  }

  /**
   * Obtiene la cantidad de créditos pendientes
   */
  getPendingCreditsCount(): number {
    return this.credits().filter(c => 
      c.status === 'PENDIENTE_APROBACION'
    ).length;
  }

  isInstallmentSelectable(row: AmortizationRow): boolean {
    if (!this.selectedDetail) return false;
    if (row.installmentNumber === 0) return false;
    if (row.status === 'PAGADO') return false;

    const baseInstallment = this.selectedDetail.currentInstallmentIndex;
    if (baseInstallment <= 0) return false;
    if (row.installmentNumber < baseInstallment) return false;

    const selected = this.selectedInstallments();
    if (selected.includes(row.installmentNumber)) {
      return true;
    }

    if (selected.length === 0) {
      return row.installmentNumber === baseInstallment;
    }

    const highestSelected = Math.max(...selected);
    return row.installmentNumber === highestSelected + 1;
  }

  isInstallmentSelected(row: AmortizationRow): boolean {
    return this.selectedInstallments().includes(row.installmentNumber);
  }

  toggleInstallmentSelection(row: AmortizationRow, checked: boolean) {
    if (!this.isInstallmentSelectable(row)) {
      return;
    }

    const current = this.selectedInstallments();
    const installmentNumber = row.installmentNumber;
    let next: number[];

    if (checked) {
      next = Array.from(new Set([...current, installmentNumber])).sort((a, b) => a - b);
    } else {
      next = current.filter(value => value < installmentNumber);
    }

    this.selectedInstallments.set(next);
  }

  toggleSelectAllInstallments(checked: boolean | undefined) {
    if (!this.selectedDetail) return;
    if (checked) {
      this.selectedInstallments.set(this.getContiguousSelectableInstallments());
    } else {
      this.clearInstallmentSelection();
    }
  }

  clearInstallmentSelection() {
    this.selectedInstallments.set([]);
  }

  areAllInstallmentsSelected(): boolean {
    const selectable = this.getContiguousSelectableInstallments();
    if (selectable.length === 0) return false;
    const selected = this.selectedInstallments();
    return selectable.every(value => selected.includes(value));
  }

  private getContiguousSelectableInstallments(): number[] {
    if (!this.selectedDetail) return [];
    const result: number[] = [];
    const baseInstallment = this.selectedDetail.currentInstallmentIndex;
    if (baseInstallment <= 0) return result;

    let currentInstallment = baseInstallment;
    while (true) {
      const row = this.selectedDetail.table.find(r => r.installmentNumber === currentInstallment);
      if (!row || row.status === 'PAGADO') {
        break;
      }
      result.push(currentInstallment);
      currentInstallment += 1;
    }

    return result;
  }

  paySelectedInstallments() {
    if (!this.selectedDetail || !this.selectedCredit) {
      return;
    }

    const selected = this.selectedInstallments();
    if (selected.length === 0) {
      alert('Selecciona al menos una cuota para continuar.');
      return;
    }

    const cuotas = selected.length;
    const creditId = this.selectedCredit.id;
    if (!confirm(`¿Confirmas el pago de ${cuotas} cuota(s) para el crédito ${creditId}?`)) {
      return;
    }

    this.loading.set(true);

    firstValueFrom(this.apiService.payCredit(creditId, selected))
      .then(updatedCredit => {
        this.selectedDetail = this.buildCreditDetail(updatedCredit);
        this.clearInstallmentSelection();
        this.clearCreditSelection();
        this.showPayControls.set(false);
        this.loadCredits();
        alert(`Se registró el pago de ${cuotas} cuota(s) para el crédito ${creditId}.`);
      })
      .catch(error => {
        console.error('Error registrando pago:', error);
        alert(error?.error?.error || '❌ No se pudo registrar el pago del crédito');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  isCurrentInstallment(row: AmortizationRow): boolean {
    if (!this.selectedDetail) return false;
    return row.installmentNumber === this.selectedDetail.currentInstallmentIndex;
  }


  private buildCreditDetail(item: Credit): CreditDetailViewModel {
    const loanAmount = Number(item.loanAmount ?? 0);
    const installments = Number(item.installments ?? (item as any).totalInstallments ?? 0);
    const annualRate = Number(
      (item.interestRate && typeof item.interestRate === 'object'
        ? (item.interestRate as any).rate
        : item.interestRate) ?? 0
    );
    let installmentAmount = Number(item.installmentAmount ?? 0);

    const monthlyRate = 0.01;

    if ((!installmentAmount || Number.isNaN(installmentAmount)) && installments > 0) {
      if (monthlyRate > 0) {
        const factor = Math.pow(1 + monthlyRate, installments);
        installmentAmount = loanAmount * (monthlyRate * factor) / (factor - 1);
      } else {
        installmentAmount = loanAmount / installments;
      }
    }

    const paidInstallments = Number(item.paidInstallments ?? 0);
    const paidFromPayments = (item.payments ?? [])
      .filter(payment => payment.status === 'PAGADO')
      .map(payment => payment.installmentNumber);
    const paidSet = new Set<number>([
      ...Array.from({ length: paidInstallments }, (_, idx) => idx + 1),
      ...paidFromPayments
    ]);

    const rows: AmortizationRow[] = [];
    let balance = loanAmount;

    let totalInterest = 0;
    let totalInstallmentsSum = 0;

    if (loanAmount > 0 && installments > 0 && installmentAmount > 0) {
      for (let n = 1; n <= installments; n++) {
        const interest = monthlyRate > 0 ? balance * monthlyRate : 0;
        let capitalAmortized = installmentAmount - interest;

        if (capitalAmortized < 0) {
          capitalAmortized = 0;
        }

        if (capitalAmortized > balance || n === installments) {
          capitalAmortized = balance;
        }

        balance = Math.max(0, balance - capitalAmortized);
        const status = paidSet.has(n) || balance <= 0.01 ? 'PAGADO' : 'PENDIENTE';
        rows.push({
          installmentNumber: n,
          installmentAmount,
          interest,
          capitalAmortized,
          capitalAlive: balance,
          status
        });

        totalInterest += interest;
        totalInstallmentsSum += installmentAmount;

        if (balance <= 0.01) {
          break;
        }
      }
    }

    const totalInstallments = rows.length;
    const years = totalInstallments > 0 ? +(totalInstallments / 12).toFixed(2) : 0;
    const unpaidRows = rows.filter(r => r.installmentNumber > 0 && r.status !== 'PAGADO');
    const currentInstallmentIndex = unpaidRows.length > 0
      ? unpaidRows[0].installmentNumber
      : totalInstallments;
    const pendingInstallments = unpaidRows.length;
    const annualDisplay = monthlyRate * 12 * 100;

    return {
      top: {
        loanAmount,
        tna30360: +annualDisplay.toFixed(2),
        years,
        paymentFrequency: 'Mensual',
        equivalentInterest: +(monthlyRate * 100).toFixed(2),
        paymentsPerYear: 12,
        totalInstallments
      },
      resumen: {
        loanAmount,
        totalInstallmentsSum,
        totalInterest
      },
      table: rows,
      currentInstallmentIndex,
      pendingInstallments
    };
  }
}
