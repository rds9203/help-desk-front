import { CommonModule } from '@angular/common';
import { Component, signal, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, MatListModule, MatIconModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  collapsed = signal(false);
  sidebarToggle = output<boolean>();

  toggleSidebar() {
    this.collapsed.update(v => !v);
    this.sidebarToggle.emit(this.collapsed());
  }
}
