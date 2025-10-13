import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { TopNavComponent } from '../components/top-nav/top-nav.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SharedModule,
    SidebarComponent,
    TopNavComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = true; // Start collapsed by default (for mobile)
  isMobile = false;

  constructor() { }

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    
    // On desktop, sidebar should be visible (not collapsed)
    // On mobile, sidebar should be hidden (collapsed)
    if (!this.isMobile && this.sidebarCollapsed) {
      // Desktop view - show sidebar
      this.sidebarCollapsed = false;
    }
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  onMobileMenuToggle(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
