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
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
  }

  // === USUARIOS ===
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, { headers: this.getHeaders() });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() });
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, user, { headers: this.getHeaders() });
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, user, { headers: this.getHeaders() });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() });
  }

  // === CRÉDITOS ===
  getCredits(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.baseUrl}/credits`, { headers: this.getHeaders() });
  }

  getCreditsByUser(userId: number): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.baseUrl}/credits?userId=${userId}`, { headers: this.getHeaders() });
  }

  getCredit(id: number): Observable<Credit> {
    return this.http.get<Credit>(`${this.baseUrl}/credits/${id}`, { headers: this.getHeaders() });
  }

  createCredit(credit: Partial<Credit>): Observable<Credit> {
    return this.http.post<Credit>(`${this.baseUrl}/credits`, credit, { headers: this.getHeaders() });
  }

  updateCredit(id: number, credit: Partial<Credit>): Observable<Credit> {
    return this.http.put<Credit>(`${this.baseUrl}/credits/${id}`, credit, { headers: this.getHeaders() });
  }

  deleteCredit(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/credits/${id}`, { headers: this.getHeaders() });
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
}

