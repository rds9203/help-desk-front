import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-simple-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="welcome-section">
        <h2>¡Bienvenido al Help Desk!</h2>
        <p>Bienvenido al sistema Help Desk</p>
      </div>

      <div class="modules-grid">
        <div class="module-card">
          <div class="module-icon">🎫</div>
          <h3>Tickets</h3>
          <p>Gestión de tickets de soporte técnico</p>
          <button class="module-button" (click)="showMessage('Tickets')">
            Acceder
          </button>
        </div>

        <div class="module-card">
          <div class="module-icon">📅</div>
          <h3>Reservas</h3>
          <p>Sistema de reservas de salas</p>
          <button class="module-button" (click)="showMessage('Reservas')">
            Acceder
          </button>
        </div>

        <div class="module-card">
          <div class="module-icon">🏖️</div>
          <h3>Vacaciones</h3>
          <p>Gestión de días de vacaciones</p>
          <button class="module-button" (click)="showMessage('Vacaciones')">
            Acceder
          </button>
        </div>

        <div class="module-card">
          <div class="module-icon">💰</div>
          <h3>Créditos</h3>
          <p>Sistema de préstamos y créditos</p>
          <button class="module-button" (click)="navigateToCredits()">
            Acceder
          </button>
        </div>

        <div class="module-card">
          <div class="module-icon">👥</div>
          <h3>Usuarios</h3>
          <p>Gestión de usuarios del sistema</p>
          <button class="module-button" (click)="navigateToUsers()">
            Acceder
          </button>
        </div>

        <div class="module-card">
          <div class="module-icon">📋</div>
          <h3>Auditoría</h3>
          <p>Logs y registros del sistema</p>
          <button class="module-button" (click)="showMessage('Auditoría')">
            Acceder
          </button>
        </div>
      </div>

      <div class="actions-section">
        <button class="logout-button" (click)="logout()">
          Cerrar Sesión
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .welcome-section {
      text-align: center;
      margin-bottom: 3rem;
    }
    .welcome-section h2 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }
    .module-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .module-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }
    .module-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .module-card h3 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }
    .module-card p {
      color: #7f8c8d;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    .module-button {
      background: #3498db;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    }
    .module-button:hover {
      background: #2980b9;
    }
    .actions-section {
      text-align: center;
    }
    .logout-button {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    }
    .logout-button:hover {
      background: #c0392b;
    }
  `]
})
export class SimpleDashboardComponent implements OnInit {
  userEmail = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.userEmail = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Usuario';
  }

  navigateToCredits() {
    this.router.navigate(['/credits']);
  }

  navigateToUsers() {
    this.router.navigate(['/users']);
  }

  showMessage(module: string) {
    alert(`Módulo ${module} - En desarrollo. Los módulos completos están implementados pero necesitan configuración adicional.`);
  }

  logout() {
    console.log('🚪 Cerrando sesión desde SimpleDashboardComponent');
    this.authService.logout();
  }
}

