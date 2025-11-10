import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface User {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate?: string;
  position?: string;
  startDate?: string | Date;
  salary?: number;
  hasDebt?: boolean;
  isActive?: boolean;
  roleId?: string | number;
  role?: string | Role;
  credits?: Credit[];
  paymentHistory?: PaymentHistory[];
}

export interface Role {
  id: string | number;
  name: string;
  description?: string;
}

export interface InterestRate {
  id: string | number;
  name?: string;
  minMonths?: number;
  maxMonths?: number;
  rate: number;
  isActive?: boolean;
}

export interface Credit {
  id: string | number;
  creditType?: string;
  loanAmount: number;
  outstandingAmount: number;
  installmentAmount: number;
  totalInstallments?: number;
  pendingInstallments?: number;
  installments?: number;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  userId: string | number;
  user?: User;
  interestRateId?: string | number;
  interestRate?: InterestRate;
  paidInstallments?: number;
  payments?: PaymentHistory[];
  paymentHistory?: PaymentHistory[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface PaymentHistory {
  id: number;
  installmentNumber: number;
  amount: number;
  interestAmount: number;
  principalAmount: number;
  remainingBalance: number;
  paymentDate: string;
  status: string;
  userId: number;
  user: User;
  creditId: number;
  credit?: Credit;
}

export interface Notification {
  id: string | number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  userId?: string | number;
  user?: User;
  creditId?: string | number;
  credit?: Credit;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl || 'http://localhost:3001/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Obtiene los headers con autenticación para las peticiones
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('helpdesk_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // Headers para CORS
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
  }

  // === USUARIOS ===
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, { headers: this.getAuthHeaders() });
  }

  getUser(id: string | number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`, { headers: this.getAuthHeaders() });
  }


  deleteUser(id: string | number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, { headers: this.getAuthHeaders() });
  }

  // === CRÉDITOS ===
  getCredits(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.baseUrl}/credits`, { headers: this.getAuthHeaders() });
  }

  getCreditsByUser(userId: string | number): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.baseUrl}/credits?userId=${userId}`, { headers: this.getAuthHeaders() });
  }

  getCredit(id: string | number): Observable<Credit> {
    return this.http.get<Credit>(`${this.baseUrl}/credits/${id}`, { headers: this.getAuthHeaders() });
  }

  createCredit(credit: Partial<Credit>): Observable<Credit> {
    return this.http.post<Credit>(`${this.baseUrl}/credits`, credit, { headers: this.getAuthHeaders() });
  }

  updateCredit(id: string | number, credit: Partial<Credit>): Observable<Credit> {
    return this.http.put<Credit>(`${this.baseUrl}/credits/${id}`, credit, { headers: this.getAuthHeaders() });
  }

  deleteCredit(id: string | number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/credits/${id}`, { headers: this.getHeaders() });
  }

  payCredit(creditId: string | number, installmentNumbers: number[]): Observable<Credit> {
    return this.http.post<Credit>(`${this.baseUrl}/credits/${creditId}/pay`, { installmentNumbers }, { headers: this.getAuthHeaders() });
  }

  // === PAGOS ===
  getPayments(): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/payments`, { headers: this.getHeaders() });
  }

  getPaymentsByUser(userId: number): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/payments?userId=${userId}`, { headers: this.getHeaders() });
  }

  getPaymentsByCredit(creditId: number): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/payments?creditId=${creditId}`, { headers: this.getHeaders() });
  }

  getPayment(id: number): Observable<PaymentHistory> {
    return this.http.get<PaymentHistory>(`${this.baseUrl}/payments/${id}`, { headers: this.getHeaders() });
  }

  createPayment(payment: Partial<PaymentHistory>): Observable<{ payment: PaymentHistory; credit: Credit }> {
    return this.http.post<{ payment: PaymentHistory; credit: Credit }>(`${this.baseUrl}/payments`, payment, { headers: this.getHeaders() });
  }

  updatePayment(id: number, payment: Partial<PaymentHistory>): Observable<PaymentHistory> {
    return this.http.put<PaymentHistory>(`${this.baseUrl}/payments/${id}`, payment, { headers: this.getHeaders() });
  }

  // === NUEVOS MÉTODOS PARA CRÉDITOS ===
  getMaxCredit(userId: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/${userId}/max-credit`, { headers: this.getAuthHeaders() });
  }

  generateAuthorization(data: { userId: number; loanAmount: number; installments: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/credits/generate-authorization`, data, { headers: this.getHeaders() });
  }

  // === NOTIFICACIONES ===
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications`, { headers: this.getHeaders() });
  }

  getUnreadNotificationsCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/notifications/unread-count`, { headers: this.getHeaders() });
  }

  markNotificationAsRead(id: string | number): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/notifications/${id}/read`, {}, { headers: this.getHeaders() });
  }

  // === APROBACIÓN DE CRÉDITOS ===
  approveCredit(id: string | number): Observable<Credit> {
    return this.http.put<Credit>(`${this.baseUrl}/credits/${id}/approve`, {}, { headers: this.getAuthHeaders() });
  }

  rejectCredit(id: string | number): Observable<Credit> {
    return this.http.put<Credit>(`${this.baseUrl}/credits/${id}/reject`, {}, { headers: this.getAuthHeaders() });
  }

  // === MÉTODOS PARA GLPI ===

  /**
   * Obtiene información del usuario actual desde GLPI
   */
  getCurrentUserFromGLPI(): Observable<any> {
    const headers = this.getAuthHeaders();
    const glpiUrl = 'https://helpdesk.sectorial.co/glpi/apirest.php/getMyProfiles';
    return this.http.get(glpiUrl, { headers });
  }

  /**
   * Obtiene un usuario específico desde GLPI por ID
   */
  getUserFromGLPI(userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const glpiUrl = `https://helpdesk.sectorial.co/glpi/apirest.php/User/${userId}`;
    return this.http.get(glpiUrl, { headers });
  }

  /**
   * Obtiene todos los usuarios desde GLPI
   */
  getAllUsersFromGLPI(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    const glpiUrl = 'https://helpdesk.sectorial.co/glpi/apirest.php/User';
    return this.http.get<any[]>(glpiUrl, { headers });
  }

  /**
   * Verifica si el token es válido consultando GLPI
   */
  validateTokenWithGLPI(): Observable<any> {
    const headers = this.getAuthHeaders();
    const glpiUrl = 'https://helpdesk.sectorial.co/glpi/apirest.php/getMyProfiles';
    return this.http.get(glpiUrl, { headers });
  }

  // === NUEVOS ENDPOINTS PARA EL SISTEMA ===

  /**
   * Obtiene todos los tickets
   */
  getTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tickets`, { headers: this.getAuthHeaders() });
  }

  /**
   * Crea un nuevo ticket
   */
  createTicket(ticket: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tickets`, ticket, { headers: this.getAuthHeaders() });
  }

  /**
   * Actualiza un ticket
   */
  updateTicket(id: number, ticket: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/tickets/${id}`, ticket, { headers: this.getAuthHeaders() });
  }

  /**
   * Agrega un comentario a un ticket
   */
  addTicketComment(ticketId: number, comment: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tickets/${ticketId}/comments`, { comment }, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene todos los recursos para reservas
   */
  getResources(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/resources`, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene todas las reservas
   */
  getReservations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reservations`, { headers: this.getAuthHeaders() });
  }

  /**
   * Crea una nueva reserva
   */
  createReservation(reservation: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/reservations`, reservation, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene los días de vacaciones del usuario actual
   */
  getVacationDays(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/vacations/days`, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene todas las vacaciones (admin)
   */
  getAllVacations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vacations`, { headers: this.getAuthHeaders() });
  }

  /**
   * Crea una solicitud de vacaciones
   */
  createVacationRequest(request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/vacations/request`, request, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene todos los usuarios (admin)
   */
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`, { headers: this.getAuthHeaders() });
  }

  /**
   * Crea un nuevo usuario (admin)
   */
  createUser(user: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, user, { headers: this.getAuthHeaders() });
  }

  /**
   * Aprueba un usuario (admin)
   */
  approveUser(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}/approve`, {}, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene todos los roles
   */
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/roles`, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene los logs de auditoría (superadmin)
   */
  getAuditLogs(params?: any): Observable<any> {
    let url = `${this.baseUrl}/audit-logs`;
    if (params) {
      const queryParams = new URLSearchParams(params).toString();
      url += `?${queryParams}`;
    }
    return this.http.get<any>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Actualiza una reserva
   */
  updateReservation(id: number, reservation: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/reservations/${id}`, reservation, { headers: this.getAuthHeaders() });
  }

  /**
   * Actualiza un usuario
   */
  updateUser(id: number, user: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}`, user, { headers: this.getAuthHeaders() });
  }

  /**
   * Aprueba una solicitud de vacaciones
   */
  approveVacationRequest(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/vacations/request/${id}/approve`, {}, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechaza una solicitud de vacaciones
   */
  rejectVacationRequest(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/vacations/request/${id}/reject`, {}, { headers: this.getAuthHeaders() });
  }
}

