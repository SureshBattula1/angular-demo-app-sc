import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, HasPermissionDirective],
  templateUrl: './settings-shell.component.html',
  styleUrls: ['./settings-shell.component.scss']
})
export class SettingsShellComponent implements OnInit {
  isHandset$: Observable<boolean>;
  isSidebarCollapsed = true;
  selectedTheme = 'ocean-blue';
  isTablet = false;
  isMobile = false;
  
  // Theme definitions - using same as main shell
  themes = {
    "ocean-blue": {
      primary:"#1E88E5", primaryLight:"#90CAF9", primaryDark:"#1565C0",
      accent:"#00B8D9",  accentLight:"#80E1EF",  accentDark:"#008DA7",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F7F8",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#2563EB"
    }
  } as const;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    public permissionService: PermissionService
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
  }
  
  ngOnInit() {
    this.isSidebarCollapsed = true;
    
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet
    ]).subscribe(result => {
      this.isMobile = this.breakpointObserver.isMatched(Breakpoints.Handset);
      this.isTablet = this.breakpointObserver.isMatched(Breakpoints.Tablet);
      
      if (this.isMobile || this.isTablet || window.innerWidth <= 960) {
        this.isSidebarCollapsed = true;
      }
    });
    
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      this.selectedTheme = savedTheme;
      this.applyTheme(savedTheme);
    }
  }
  
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  onSidenavClosed(): void {
    this.isHandset$.subscribe(isHandset => {
      if (isHandset) {
        this.isSidebarCollapsed = true;
      }
    });
  }
  
  onMenuItemClick(): void {
    if (this.isMobileOrTablet()) {
      this.isSidebarCollapsed = true;
    }
  }
  
  isMobileOrTablet(): boolean {
    return window.innerWidth <= 960;
  }
  
  onThemeChange(theme: string) {
    this.applyTheme(theme);
    localStorage.setItem('selectedTheme', theme);
  }
  
  applyTheme(themeName: string) {
    const theme = this.themes[themeName as keyof typeof this.themes];
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', theme.primary);
      root.style.setProperty('--primary-light', theme.primaryLight);
      root.style.setProperty('--primary-dark', theme.primaryDark);
      root.style.setProperty('--accent-color', theme.accent);
      root.style.setProperty('--accent-light', theme.accentLight);
      root.style.setProperty('--accent-dark', theme.accentDark);
    }
  }
  
  onLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout().subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Logged out successfully');
          }
        },
        error: (error) => {
          this.errorHandler.showInfo('Logged out');
        }
      });
    }
  }
  
  onProfile(): void {
    this.router.navigate(['/profile']);
  }
  
  onSettings(): void {
    this.router.navigate(['/settings']);
  }

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
  
  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    if (user) {
      return `${user.first_name} ${user.last_name}`;
    }
    return 'User';
  }
  
  getUserEmail(): string {
    const user = this.authService.currentUser();
    return user?.email || '';
  }
  
  getUserRole(): string {
    const user = this.authService.currentUser();
    return user?.role || '';
  }
}

