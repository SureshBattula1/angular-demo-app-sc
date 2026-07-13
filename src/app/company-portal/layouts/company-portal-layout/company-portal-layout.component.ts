import { Component, OnInit, OnDestroy, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompanyAuthService, CompanyAdmin } from '../../services/company-auth.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-company-portal-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './company-portal-layout.component.html',
  styleUrl: './company-portal-layout.component.scss'
})
export class CompanyPortalLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = true; // Start collapsed by default
  currentUser!: Signal<CompanyAdmin | null>;
  isTablet = false;
  isMobile = false;
  currentRoute = '';
  
  private routerSubscription?: Subscription;
  private breakpointSubscription?: Subscription;

  constructor(
    private companyAuthService: CompanyAuthService,
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {
    // Initialize currentUser from service after constructor
    this.currentUser = this.companyAuthService.currentUser;
  }

  ngOnInit(): void {
    // Initialize sidebar state - always start collapsed
    this.isSidebarCollapsed = true;
    
    // Detect screen size
    this.breakpointSubscription = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet
    ]).subscribe(result => {
      this.isMobile = this.breakpointObserver.isMatched(Breakpoints.Handset);
      this.isTablet = this.breakpointObserver.isMatched(Breakpoints.Tablet);
      
      // On mobile or tablet, sidebar should be hidden (collapsed)
      if (this.isMobile || this.isTablet || window.innerWidth <= 960) {
        this.isSidebarCollapsed = true;
      }
    });
    
    // Listen to router events to update current route
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Update current route for active state checking
      this.currentRoute = event.urlAfterRedirects || event.url;
    });
    
    // Set initial route
    this.currentRoute = this.router.url;
    
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
  
  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.routerSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  isMobileOrTablet(): boolean {
    return this.isMobile || this.isTablet || window.innerWidth <= 960;
  }

  onSidenavClosed(): void {
    if (this.isMobileOrTablet()) {
      this.isSidebarCollapsed = true;
    }
  }

  onMenuItemClick(): void {
    // Close sidebar on mobile/tablet when menu item is clicked
    if (this.isMobileOrTablet()) {
      this.isSidebarCollapsed = true;
    }
  }

  isRouteActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
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

  getUserInitials(): string {
    const user = this.currentUser();
    if (user) {
      const first = user.first_name?.charAt(0) || '';
      const last = user.last_name?.charAt(0) || '';
      return (first + last).toUpperCase() || 'CA';
    }
    return 'CA';
  }
}

