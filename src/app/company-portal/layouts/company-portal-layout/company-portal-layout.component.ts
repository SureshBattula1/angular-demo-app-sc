import { Component, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CompanyAuthService, CompanyAdmin } from '../../services/company-auth.service';

@Component({
  selector: 'app-company-portal-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './company-portal-layout.component.html',
  styleUrl: './company-portal-layout.component.scss'
})
export class CompanyPortalLayoutComponent implements OnInit {
  sidenavOpened = true;
  currentUser!: Signal<CompanyAdmin | null>;

  constructor(
    private companyAuthService: CompanyAuthService
  ) {
    // Initialize currentUser from service after constructor
    this.currentUser = this.companyAuthService.currentUser;
  }

  ngOnInit(): void {
    // Load current user if not loaded
    if (!this.currentUser()) {
      this.companyAuthService.me().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // User will be updated via the service signal
          }
        }
      });
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  logout(): void {
    this.companyAuthService.logout().subscribe();
  }

  getUserName(): string {
    const user = this.currentUser();
    if (user) {
      return `${user.first_name} ${user.last_name}`;
    }
    return 'Company Admin';
  }
}

