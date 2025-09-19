import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  
  /**
   * Para qué sirve: Ejecuta el flujo de cierre de sesión (placeholder).
   * Recibe: Sin parámetros.
   * Retorna: void.
   */
  logout() {
    // Aquí se implementaría la lógica de logout
    console.log('Usuario deslogueado');
    // Por ejemplo: this.authService.logout();
  }
}
