import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>Help Desk System</h1>
        <p>Sistema de gestión interna</p>
      </header>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .app-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .app-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
      font-weight: 300;
    }
    .app-header p {
      margin: 0;
      font-size: 1.1rem;
      opacity: 0.9;
    }
    .app-main {
      flex: 1;
      padding: 2rem;
    }
  `]
})
export class AppComponent {
  title = 'help-desk-front';
}










