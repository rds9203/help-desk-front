import { Component, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { Sidebar } from './sidebar/sidebar';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    Sidebar,
    Header,
    Footer,
    RouterOutlet
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  sidebarCollapsed = signal(false);

  /**
   * Para qué sirve: Recibe el estado de colapso del sidebar y actualiza la señal.
   * Recibe: collapsed: boolean.
   * Retorna: void.
   * Ejemplo JSON (entrada): { "collapsed": true }
   */
  onSidebarToggle(collapsed: boolean) {
    this.sidebarCollapsed.set(collapsed);
  }
}
