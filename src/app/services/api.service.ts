import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  position: string;
  startDate: string;
  hasDebt: boolean;
  isActive: boolean;
  roleId: number;
  role: Role;
  credits?: Credit[];
  paymentHistory?: PaymentHistory[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface InterestRate {
  id: number;
  name: string;
  minMonths: number;
  maxMonths?: number;
  rate: number;
  isActive: boolean;
}

export interface Credit {
  id: number;
  creditType: string;
  loanAmount: number;
  outstandingAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  pendingInstallments: number;
  startDate: string;
  endDate: string;
  status: string;
  userId: number;
  user: User;
  interestRateId: number;
  interestRate: InterestRate;
  paymentHistory?: PaymentHistory[];
}

export interface PaymentHistory {
  id: number;
  installmentNumber: number;
  amount: number;
  interestAmount: number;
  principalAmount: number;
  remainingBalance: number;
  paymentDate: string;
  dueDate: string;
  status: string;
  userId: number;
  user: User;
  creditId: number;
  credit: Credit;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl || 'http://localhost:7071/api';

  constructor(private http: HttpClient) {}

  // Headers para CORS
  /**
   * Para qué sirve: Construye los headers comunes (JSON + CORS) para cada request.
   * Recibe: Sin parámetros.
   * Retorna: HttpHeaders.
   * Ejemplo JSON (headers):
   * {
   *   "Content-Type": "application/json",
   *   "Access-Control-Allow-Origin": "*"
   * }
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
  }

  // === USUARIOS ===
  /**
   * Para qué sirve: Obtiene la lista de usuarios.
   * Recibe: Sin parámetros.
   * Retorna: Observable<User[]>.
   * Ejemplo JSON (respuesta):
   * [
   *   {
   *     "id": 1,
   *     "firstName": "Ana",
   *     "lastName": "García",
   *     "email": "ana@example.com",
   *     "birthDate": "1990-01-01",
   *     "position": "Analista",
   *     "startDate": "2023-01-01",
   *     "hasDebt": false,
   *     "isActive": true,
   *     "roleId": 2,
   *     "role": { "id": 2, "name": "user" }
   *   }
   * ]
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Obtiene el detalle de un usuario por su id.
   * Recibe: id: number.
   * Retorna: Observable<User>.
   * Ejemplo JSON (respuesta):
   * {
   *   "id": 1,
   *   "firstName": "Ana",
   *   "lastName": "García",
   *   "email": "ana@example.com",
   *   "birthDate": "1990-01-01",
   *   "position": "Analista",
   *   "startDate": "2023-01-01",
   *   "hasDebt": false,
   *   "isActive": true,
   *   "roleId": 2,
   *   "role": { "id": 2, "name": "user" }
   * }
   */
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Crea un nuevo usuario.
   * Recibe: user: Partial<User> (solo campos a crear).
   * Retorna: Observable<User> (usuario creado).
   * Ejemplo JSON (body):
   * {
   *   "firstName": "Ana",
   *   "lastName": "García",
   *   "email": "ana@example.com",
   *   "birthDate": "1990-01-01",
   *   "position": "Analista",
   *   "startDate": "2023-01-01",
   *   "roleId": 2
   * }
   */
  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, user, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Actualiza un usuario existente.
   * Recibe: id: number, user: Partial<User> (campos a actualizar).
   * Retorna: Observable<User> (usuario actualizado).
   * Ejemplo JSON (body):
   * {
   *   "firstName": "Ana María",
   *   "isActive": true
   * }
   */
  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, user, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Elimina un usuario por id.
   * Recibe: id: number.
   * Retorna: Observable<any> (puede ser vacío o con mensaje).
   * Ejemplo JSON (respuesta): { "deleted": true }
   */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() });
  }

  // === CRÉDITOS ===
  /**
   * Para qué sirve: Obtiene la lista de créditos.
   * Recibe: Sin parámetros.
   * Retorna: Observable<Credit[]>.
   * Ejemplo JSON (respuesta):
   * [
   *   {
   *     "id": 10,
   *     "creditType": "Hipotecario",
   *     "loanAmount": 5000000,
   *     "outstandingAmount": 3200000,
   *     "installmentAmount": 250000,
   *     "totalInstallments": 24,
   *     "pendingInstallments": 12,
   *     "startDate": "2024-01-01",
   *     "endDate": "2025-12-01",
   *     "status": "activo",
   *     "userId": 1,
   *     "interestRateId": 3
   *   }
   * ]
   */
  getCredits(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.baseUrl}/credits`, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Obtiene créditos filtrados por usuario.
   * Recibe: userId: number.
   * Retorna: Observable<Credit[]>.
   * Ejemplo JSON (query): /credits?userId=1
   */
  getCreditsByUser(userId: number): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.baseUrl}/credits?userId=${userId}`, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Obtiene el detalle de un crédito por id.
   * Recibe: id: number.
   * Retorna: Observable<Credit>.
   * Ejemplo JSON (respuesta):
   * {
   *   "id": 10,
   *   "creditType": "Hipotecario",
   *   "loanAmount": 5000000,
   *   "outstandingAmount": 3200000,
   *   "installmentAmount": 250000,
   *   "totalInstallments": 24,
   *   "pendingInstallments": 12,
   *   "startDate": "2024-01-01",
   *   "endDate": "2025-12-01",
   *   "status": "activo",
   *   "userId": 1,
   *   "interestRateId": 3
   * }
   */
  getCredit(id: number): Observable<Credit> {
    return this.http.get<Credit>(`${this.baseUrl}/credits/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Crea un crédito para un usuario.
   * Recibe: credit: Partial<Credit>.
   * Retorna: Observable<Credit> (crédito creado).
   * Ejemplo JSON (body):
   * {
   *   "creditType": "Hipotecario",
   *   "loanAmount": 5000000,
   *   "totalInstallments": 24,
   *   "userId": 1,
   *   "interestRateId": 3
   * }
   */
  createCredit(credit: Partial<Credit>): Observable<Credit> {
    return this.http.post<Credit>(`${this.baseUrl}/credits`, credit, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Actualiza un crédito existente.
   * Recibe: id: number, credit: Partial<Credit> (campos a actualizar).
   * Retorna: Observable<Credit> (crédito actualizado).
   * Ejemplo JSON (body):
   * {
   *   "status": "pagado",
   *   "pendingInstallments": 0
   * }
   */
  updateCredit(id: number, credit: Partial<Credit>): Observable<Credit> {
    return this.http.put<Credit>(`${this.baseUrl}/credits/${id}`, credit, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Elimina un crédito por id.
   * Recibe: id: number.
   * Retorna: Observable<any> (puede ser vacío o con mensaje).
   * Ejemplo JSON (respuesta): { "deleted": true }
   */
  deleteCredit(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/credits/${id}`, { headers: this.getHeaders() });
  }

  // === PAGOS ===
  /**
   * Para qué sirve: Obtiene el listado de pagos.
   * Recibe: Sin parámetros.
   * Retorna: Observable<PaymentHistory[]>.
   * Ejemplo JSON (respuesta):
   * [
   *   {
   *     "id": 100,
   *     "installmentNumber": 1,
   *     "amount": 250000,
   *     "interestAmount": 74025,
   *     "principalAmount": 175975,
   *     "remainingBalance": 4824025,
   *     "paymentDate": "2024-02-01",
   *     "dueDate": "2024-02-01",
   *     "status": "pagado",
   *     "userId": 1,
   *     "creditId": 10
   *   }
   * ]
   */
  getPayments(): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/payments`, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Obtiene pagos filtrados por usuario.
   * Recibe: userId: number.
   * Retorna: Observable<PaymentHistory[]>.
   * Ejemplo JSON (query): /payments?userId=1
   */
  getPaymentsByUser(userId: number): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/payments?userId=${userId}`, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Obtiene pagos filtrados por crédito.
   * Recibe: creditId: number.
   * Retorna: Observable<PaymentHistory[]>.
   * Ejemplo JSON (query): /payments?creditId=10
   */
  getPaymentsByCredit(creditId: number): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/payments?creditId=${creditId}`, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Obtiene el detalle de un pago por id.
   * Recibe: id: number.
   * Retorna: Observable<PaymentHistory>.
   * Ejemplo JSON (respuesta):
   * {
   *   "id": 100,
   *   "installmentNumber": 1,
   *   "amount": 250000,
   *   "interestAmount": 74025,
   *   "principalAmount": 175975,
   *   "remainingBalance": 4824025,
   *   "paymentDate": "2024-02-01",
   *   "dueDate": "2024-02-01",
   *   "status": "pagado",
   *   "userId": 1,
   *   "creditId": 10
   * }
   */
  getPayment(id: number): Observable<PaymentHistory> {
    return this.http.get<PaymentHistory>(`${this.baseUrl}/payments/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Registra un pago y retorna el pago y el crédito actualizado.
   * Recibe: payment: Partial<PaymentHistory>.
   * Retorna: Observable<{ payment: PaymentHistory; credit: Credit }>.
   * Ejemplo JSON (body):
   * {
   *   "creditId": 10,
   *   "userId": 1,
   *   "installmentNumber": 1,
   *   "amount": 250000,
   *   "paymentDate": "2024-02-01"
   * }
   */
  createPayment(payment: Partial<PaymentHistory>): Observable<{ payment: PaymentHistory; credit: Credit }> {
    return this.http.post<{ payment: PaymentHistory; credit: Credit }>(`${this.baseUrl}/payments`, payment, { headers: this.getHeaders() });
  }

  /**
   * Para qué sirve: Actualiza un pago existente.
   * Recibe: id: number, payment: Partial<PaymentHistory> (campos a actualizar).
   * Retorna: Observable<PaymentHistory> (pago actualizado).
   * Ejemplo JSON (body):
   * {
   *   "status": "anulado"
   * }
   */
  updatePayment(id: number, payment: Partial<PaymentHistory>): Observable<PaymentHistory> {
    return this.http.put<PaymentHistory>(`${this.baseUrl}/payments/${id}`, payment, { headers: this.getHeaders() });
  }
}

