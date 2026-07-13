import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../shared/modules/material/material.module';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { PermissionService } from '../../core/services/permission.service';
import { UserPreferenceService } from '../../core/services/user-preference.service';
import { ThemeService } from '../../core/services/theme.service';
import { AcademicYearContextService } from '../../core/services/academic-year-context.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { AcademicYear } from '../../features/settings/services/academic-year.service';
import { THEMES, THEME_OPTIONS, DEFAULT_THEME, BREAKPOINTS, ThemeColors } from '../../shared/config/theme.config';
import { ImpersonationService } from '../../company-portal/services/impersonation.service';
import { CompanyAuthService } from '../../company-portal/services/company-auth.service';

// Menu item interface
interface MenuItem {
  icon: string;
  label: string;
  route: string;
  /** If true, show for any authenticated user (skip permission check). */
  public?: boolean;
  permission?: string | string[];
  permissionMode?: 'any' | 'all';
  tooltip?: string;
}

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, HasPermissionDirective],
  templateUrl: './main-shell.component.html',
  styleUrls: ['./main-shell.component.scss']
})
export class MainShellComponent implements OnInit, OnDestroy {
  isHandset$: Observable<boolean>;
  isSidebarCollapsed = true; // Start collapsed by default (icons only on desktop, hidden on mobile/tablet)
  selectedTheme = DEFAULT_THEME;
  isTablet = false;
  isMobile = false;
  currentRoute = '';  // Track current route for active state
  isImpersonating = false; // Track impersonation state
  academicYears: AcademicYear[] = [];
  selectedAcademicYearId: string | number | null = null;
  selectedAcademicYearName: string = '';
  isPastAcademicYear = false;
  /** When the active route sets data.hideSidebar, render full-width (e.g. global search). */
  hideSidebar = false;

  // Subscriptions for cleanup
  private routerSubscription?: Subscription;
  private breakpointSubscription?: Subscription;
  
  // Menu items configuration
  menuItems: MenuItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', permission: 'dashboard.view' },
    { icon: 'business', label: 'Branches', route: '/branches', permission: ['branches.view', 'branches.create'], permissionMode: 'any' },
   
    { icon: 'person', label: 'Teachers', route: '/teachers', permission: 'teachers.view' },
    { icon: 'business', label: 'Departments', route: '/departments', permission: 'departments.view' },
    { icon: 'grade', label: 'Classes (Grades)', route: '/grades', permission: 'grades.view', tooltip: 'Classes( Grades)' },
    { icon: 'view_module', label: 'Sections', route: '/sections', permission: 'sections.view' },
    { icon: 'school', label: 'Students', route: '/students', permission: ['students.view', 'students.create'], permissionMode: 'any' },
    { icon: 'fact_check', label: 'Attendance', route: '/attendance', permission: ['student_attendance.view', 'student_attendance.mark', 'teacher_attendance.view', 'teacher_attendance.mark'], permissionMode: 'any' },
    { icon: 'subject', label: 'Subjects', route: '/subjects', permission: 'subjects.view' },
   { icon: 'assignment', label: 'Exams', route: '/exams', permission: ['exams.view', 'exams.create', 'exams.results'], permissionMode: 'any' },
    { icon: 'event_busy', label: 'Leaves', route: '/leaves', permission: ['leaves.view', 'leaves.create'], permissionMode: 'any' },
    { icon: 'payments', label: 'Fee Management', route: '/fees', permission: ['fees.view', 'fees.collect'], permissionMode: 'any' },
    { icon: 'account_balance', label: 'Accounts', route: '/accounts', permission: ['accounts.view', 'transactions.view'], permissionMode: 'any' },
    { icon: 'event', label: 'Holidays', route: '/holidays', permission: 'holidays.view' },
    { icon: 'groups', label: 'Groups', route: '/groups', permission: 'groups.view' },
    { icon: 'hub', label: 'Bulk Management', route: '/bulk-management', permission: 'bulk_management.view', tooltip: 'Bulk Management' },
    { icon: 'how_to_reg', label: 'Admissions', route: '/admissions', permission: ['admissions.view', 'admissions.create'], permissionMode: 'any' },
    { icon: 'trending_up', label: 'Promotions', route: '/promotions', permission: ['students.promote', 'students.edit'], permissionMode: 'any' },
    { icon: 'upload_file', label: 'Imports', route: '/imports', permission: 'import.view' },
    { icon: 'settings', label: 'Settings', route: '/settings', permission: 'settings.view' }
  ];
  
  // Theme options and definitions imported from config
  themeOptions = THEME_OPTIONS;
  themes = THEMES;

  
  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    public permissionService: PermissionService,
    private userPreferenceService: UserPreferenceService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private impersonationService: ImpersonationService,
    private companyAuthService: CompanyAuthService,
    private academicYearContext: AcademicYearContextService
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
  }
  
  ngOnInit() {
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
      if (this.isMobile || this.isTablet || window.innerWidth <= BREAKPOINTS.TABLET_MAX) {
        this.isSidebarCollapsed = true;
      }
    });
    
    // Listen to router events to update current route
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Update current route for active state checking
      this.currentRoute = event.urlAfterRedirects || event.url;
      this.hideSidebar = this.readHideSidebar();
      // Force change detection to update active states
      this.cdr.detectChanges();
    });

    // Set initial route
    this.currentRoute = this.router.url;
    this.hideSidebar = this.readHideSidebar();
    
    // Ensure permissions are loaded
    const currentUser = this.authService.currentUser();
    if (currentUser && currentUser.id) {
      this.permissionService.loadUserPermissions(currentUser.id).subscribe();
    }
    
    // Load user preferences from backend
    this.loadUserPreferences();
    
    // Check if impersonating
    this.checkImpersonationStatus();

    // Academic year context: subscribe to selected year and load list for switcher
    if (!this.isStudentRole()) {
      this.academicYearContext.selectedYear$.subscribe(y => {
        this.selectedAcademicYearId = y?.id ?? null;
        this.selectedAcademicYearName = y?.name ?? '';
        this.isPastAcademicYear = this.isAcademicYearPast(y);
        this.cdr.detectChanges();
      });
      this.academicYearContext.getActiveYears().subscribe(res => {
        if (res.success && res.data) {
          this.academicYears = res.data;
          this.cdr.detectChanges();
        }
      });
    }
  }

  /**
   * Navigate to the full-width global search results page.
   * Triggered from the header search box (Enter or the search icon).
   */
  onGlobalSearch(term: string): void {
    const q = (term || '').trim();
    if (q.length < 2) {
      return;
    }
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  /**
   * Walk to the deepest activated route and read its data.hideSidebar flag.
   */
  private readHideSidebar(): boolean {
    let route = this.activatedRoute.firstChild;
    let value = false;
    while (route) {
      if (route.snapshot.data && 'hideSidebar' in route.snapshot.data) {
        value = !!route.snapshot.data['hideSidebar'];
      }
      route = route.firstChild;
    }
    return value;
  }

  onAcademicYearChange(yearId: string | number): void {
    const year = this.academicYears.find(y => String(y.id) === String(yearId));
    if (year) {
      this.academicYearContext.setSelected(year);
      this.selectedAcademicYearId = yearId;
      this.selectedAcademicYearName = year.name;
      this.isPastAcademicYear = this.isAcademicYearPast(year);
      this.cdr.detectChanges();
      this.errorHandler.showSuccess(`Academic year set to ${year.name}`);
      const existingAdditional = (this.userPreferenceService.preferences()?.additional_settings as Record<string, unknown>) || {};
      this.userPreferenceService.updatePreferences({
        additional_settings: { ...existingAdditional, academic_year_id: yearId }
      }).subscribe({
        error: () => { /* preference save failed; year still updated in context */ }
      });
    }
  }

  /** Past = ended and not the designated current working year (matches backend AcademicYear::isPast). */
  private isAcademicYearPast(year: AcademicYear | null | undefined): boolean {
    if (!year?.end_date) {
      return false;
    }
    if (year.is_current) {
      return false;
    }
    const end = new Date(year.end_date);
    end.setHours(23, 59, 59, 999);
    return end < new Date();
  }

  /**
   * Check if currently in impersonation mode
   */
  checkImpersonationStatus(): void {
    // Simply check if impersonation token exists
    // Don't call API because we're using school API, not company portal API
    this.isImpersonating = this.impersonationService.hasImpersonationToken();
    this.cdr.detectChanges();
  }
  
  /**
   * Exit impersonation and return to company portal
   */
  exitImpersonation(): void {
    this.impersonationService.exitImpersonation().subscribe({
      next: (response) => {
        if (response.success) {
          // Restore company portal token
          const companyPortalToken = localStorage.getItem('company_portal_token_backup');
          if (companyPortalToken) {
            localStorage.setItem('company_portal_token', companyPortalToken);
            localStorage.removeItem('company_portal_token_backup');
          }
          
          // Clear impersonation token and flag
          localStorage.removeItem('impersonation_token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('is_impersonating');
          localStorage.removeItem('current_user'); // Clear school user data
          
          // Redirect to company portal schools list
          window.location.href = '/company-portal/schools';
        } else {
          this.errorHandler.showError('Failed to exit impersonation');
        }
      },
      error: (error) => {
        // Even on error, try to restore and redirect
        const companyPortalToken = localStorage.getItem('company_portal_token_backup');
        if (companyPortalToken) {
          localStorage.setItem('company_portal_token', companyPortalToken);
          localStorage.removeItem('company_portal_token_backup');
        }
        localStorage.removeItem('impersonation_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('is_impersonating');
        localStorage.removeItem('current_user');
        
        window.location.href = '/company-portal/schools';
      }
    });
  }
  
  ngOnDestroy() {
    // Clean up subscriptions to prevent memory leaks
    this.routerSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }
  
  /**
   * Check if a route is currently active (IMPROVED - PRECISE MATCHING)
   */
  isRouteActive(route: string): boolean {
    // Get the current route without query params or fragments
    const currentPath = this.currentRoute.split('?')[0].split('#')[0];
    
    return this.checkRouteMatch(currentPath, route);
  }
  
  /**
   * Precise route matching logic
   */
  private checkRouteMatch(currentPath: string, menuRoute: string): boolean {
    // For dashboard, use exact match
    if (menuRoute === '/dashboard') {
      return currentPath === menuRoute || currentPath === '/' || currentPath === '';
    }
    
    // For other routes:
    // 1. Current path must start with menu route
    // 2. Next character must be '/' or end of string (prevents partial matches)
    //
    // Examples:
    // - currentPath='/grades', menuRoute='/grades' → TRUE
    // - currentPath='/grades/1', menuRoute='/grades' → TRUE
    // - currentPath='/students', menuRoute='/grades' → FALSE
    // - currentPath='/students', menuRoute='/student' → FALSE (prevents partial match)
    
    if (!currentPath.startsWith(menuRoute)) {
      return false; // Doesn't start with menu route
    }
    
    // Check next character after menu route
    const nextChar = currentPath.charAt(menuRoute.length);
    
    // Valid if: exact match (nextChar='') OR next char is '/' (child route)
    return nextChar === '' || nextChar === '/';
  }
  
  /**
   * Load user preferences from backend and apply theme
   */
  private loadUserPreferences() {
    this.userPreferenceService.loadPreferences().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Apply the theme from backend preferences
          this.selectedTheme = response.data.theme;
          this.applyTheme(response.data.theme);
          // Load academic year: prefer backend preference, else localStorage/API current
          if (!this.isStudentRole()) {
            const ayId = (response.data.additional_settings as any)?.academic_year_id;
            const id = Number(ayId);
            if (!isNaN(id) && id > 0) {
              this.academicYearContext.loadYearById(id);
            } else {
              this.academicYearContext.loadCurrent();
            }
          }
        } else {
          this.loadThemeFromLocalStorage();
          if (!this.isStudentRole()) this.academicYearContext.loadCurrent();
        }
      },
      error: () => {
        this.loadThemeFromLocalStorage();
        if (!this.isStudentRole()) this.academicYearContext.loadCurrent();
      }
    });
  }
  
  /**
   * Fallback: Load theme from localStorage
   */
  private loadThemeFromLocalStorage() {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      this.selectedTheme = savedTheme;
      this.applyTheme(savedTheme);
    }
  }
  
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  /**
   * Handle sidenav closed event (for mobile overlay mode)
   */
  onSidenavClosed(): void {
    // On mobile, when user clicks outside, set as collapsed
    this.isHandset$.pipe(take(1)).subscribe(isHandset => {
      if (isHandset) {
        this.isSidebarCollapsed = true;
      }
    });
  }
  
  /**
   * Handle menu item click - close sidebar on mobile/tablet only
   */
  onMenuItemClick(): void {
    // Check if on mobile or tablet (max-width: 960px)
    if (this.isMobileOrTablet()) {
      this.isSidebarCollapsed = true;
    }
    // On desktop, keep sidebar in current state (collapsed or expanded)
  }
  
  /**
   * Check if current view is mobile or tablet
   */
  isMobileOrTablet(): boolean {
    return window.innerWidth <= BREAKPOINTS.TABLET_MAX;
  }
  
  onThemeChange(theme: string) {
    this.selectedTheme = theme;
    this.applyTheme(theme);
    
    // Save to localStorage (instant feedback)
    localStorage.setItem('selectedTheme', theme);
    
    // Save to backend (user-wise persistent theme across refresh/devices)
    this.userPreferenceService.updatePreferences({ theme }).subscribe({
      next: (response) => {
        if (response.success && response.data?.theme) {
          this.selectedTheme = response.data.theme;
          localStorage.setItem('selectedTheme', response.data.theme);
          this.applyTheme(response.data.theme);
        }

        const themeName = this.themeOptions.find(t => t.value === this.selectedTheme)?.label || this.selectedTheme;
        this.errorHandler.showSuccess(`Theme changed to ${themeName} successfully!`);
      },
      error: () => {
        // Keep local selection if backend update fails
        const themeName = this.themeOptions.find(t => t.value === theme)?.label || theme;
        this.errorHandler.showInfo(`Theme applied locally as ${themeName}. It could not be saved to your account.`);
      }
    });
  }
  
  applyTheme(themeName: string) {
    // Validate theme name before accessing
    if (!this.themes[themeName as keyof typeof this.themes]) {
      themeName = DEFAULT_THEME;
    }
    
    const theme = this.themes[themeName as keyof typeof this.themes];
    if (theme) {
      const root = document.documentElement;
      
      // Update CSS variables
      root.style.setProperty('--primary-color', theme.primary);
      root.style.setProperty('--primary-light', theme.primaryLight);
      root.style.setProperty('--primary-dark', theme.primaryDark);
      root.style.setProperty('--accent-color', theme.accent);
      root.style.setProperty('--accent-light', theme.accentLight);
      root.style.setProperty('--accent-dark', theme.accentDark);
      
      // Update Material toolbar background dynamically
      const toolbar = document.querySelector('.app-header') as HTMLElement;
      if (toolbar) {
        toolbar.style.backgroundColor = theme.primary;
      }
      
      // Update hover effect on sidebar items
      this.updateSidebarStyles(theme);
    }
  }
  
  updateSidebarStyles(theme: ThemeColors) {
    const styleId = 'dynamic-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.innerHTML = `
      .mat-mdc-list-item.active {
        background-color: ${theme.primary}1A !important;
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-list-item.active mat-icon {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-list-item:hover {
        background-color: ${theme.primary}0D !important;
      }
      
      .mat-toolbar.mat-primary,
      .app-header {
        background-color: ${theme.primary} !important;
      }
      
      .mat-mdc-raised-button.mat-primary,
      .mat-mdc-unelevated-button.mat-primary {
        background-color: ${theme.primary} !important;
        color: white !important;
      }
      
      .mat-mdc-raised-button.mat-primary .mdc-button__label,
      .mat-mdc-unelevated-button.mat-primary .mdc-button__label {
        color: white !important;
      }
      
      .mat-mdc-raised-button.mat-primary mat-icon,
      .mat-mdc-raised-button.mat-primary .mat-icon,
      .mat-mdc-unelevated-button.mat-primary mat-icon,
      .mat-mdc-unelevated-button.mat-primary .mat-icon {
        color: white !important;
      }
      
      .mat-mdc-raised-button.mat-accent,
      .mat-mdc-unelevated-button.mat-accent {
        background-color: ${theme.accent} !important;
        color: white !important;
      }
      
      .mat-mdc-raised-button.mat-accent .mdc-button__label,
      .mat-mdc-unelevated-button.mat-accent .mdc-button__label {
        color: white !important;
      }
      
      .mat-mdc-raised-button.mat-accent mat-icon,
      .mat-mdc-raised-button.mat-accent .mat-icon,
      .mat-mdc-unelevated-button.mat-accent mat-icon,
      .mat-mdc-unelevated-button.mat-accent .mat-icon {
        color: white !important;
      }
      
      .export-btn {
        border-color: ${theme.primary} !important;
        color: ${theme.primary} !important;
      }
      
      .export-btn:hover {
        background-color: ${theme.primary} !important;
        color: white !important;
      }
      
      .mat-mdc-progress-spinner circle {
        stroke: ${theme.primary} !important;
      }
      
      /* Form fields and inputs */
      .mat-mdc-form-field:not(.mat-form-field-disabled) .mat-mdc-text-field-wrapper:hover .mdc-notched-outline .mdc-notched-outline__leading,
      .mat-mdc-form-field:not(.mat-form-field-disabled) .mat-mdc-text-field-wrapper:hover .mdc-notched-outline .mdc-notched-outline__notch,
      .mat-mdc-form-field:not(.mat-form-field-disabled) .mat-mdc-text-field-wrapper:hover .mdc-notched-outline .mdc-notched-outline__trailing {
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__leading,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__notch,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__trailing {
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-form-field.mat-focused .mat-mdc-form-field-label,
      .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-floating-label {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-select-arrow {
        color: ${theme.primary} !important;
      }
      
      /* All form field labels */
      .mat-mdc-form-field .mdc-floating-label--float-above {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-option.mat-mdc-option-active,
      .mat-mdc-option:hover:not(.mat-mdc-option-disabled) {
        background-color: ${theme.primary}1A !important;
      }
      
      .mat-mdc-option.mat-selected:not(.mat-mdc-option-multiple) {
        background-color: ${theme.primary}1A !important;
        color: ${theme.primary} !important;
      }
      
      .mat-primary .mat-pseudo-checkbox-checked,
      .mat-primary .mat-pseudo-checkbox-indeterminate {
        background-color: ${theme.primary} !important;
      }
      
      .mat-primary .mat-pseudo-checkbox-checked::after,
      .mat-primary .mat-pseudo-checkbox-indeterminate::after {
        border-color: white !important;
      }
      
      /* Checkbox and radio buttons */
      .mat-mdc-checkbox.mat-accent .mdc-checkbox__native-control:enabled:checked~.mdc-checkbox__background,
      .mat-mdc-checkbox.mat-accent .mdc-checkbox__native-control:enabled:indeterminate~.mdc-checkbox__background {
        background-color: ${theme.primary} !important;
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-radio-button.mat-accent .mdc-radio__native-control:enabled:checked+.mdc-radio__background .mdc-radio__outer-circle {
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-radio-button.mat-accent .mdc-radio__native-control:enabled+.mdc-radio__background .mdc-radio__inner-circle {
        border-color: ${theme.primary} !important;
      }
      
      /* Slider */
      .mat-mdc-slider.mat-accent {
        --mdc-slider-handle-color: ${theme.primary};
        --mdc-slider-focus-handle-color: ${theme.primary};
        --mdc-slider-hover-handle-color: ${theme.primary};
        --mdc-slider-active-track-color: ${theme.primary};
        --mdc-slider-inactive-track-color: ${theme.primary};
      }
      
      /* Links */
      a:not(.mat-mdc-button):not(.mat-mdc-list-item) {
        color: ${theme.primary} !important;
      }
      
      /* Theme preview icons - exclude from theme coloring */
      .mat-mdc-option .theme-color-icon {
        /* Don't override - let inline styles work */
      }
    `;
  }
  
  /**
   * Logout user
   */
  onLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout().subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Logged out successfully');
            // Redirect is handled by clearSession in auth service
          }
        },
        error: (error) => {
          // Session is cleared even on error
          this.errorHandler.showInfo('Logged out');
        }
      });
    }
  }
  
  /**
   * Navigate to profile
   */
  onProfile(): void {
    this.router.navigate(['/profile']);
  }
  
  /**
   * Navigate to settings
   */
  onSettings(): void {
    this.router.navigate(['/settings']);
  }
  
  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    if (user) {
      return `${user.first_name} ${user.last_name}`;
    }
    return 'User';
  }
  
  /**
   * Get user email
   */
  getUserEmail(): string {
    const user = this.authService.currentUser();
    return user?.email || '';
  }
  
  /**
   * Get user role
   */
  getUserRole(): string {
    const user = this.authService.currentUser();
    return user?.role || '';
  }
  
  /**
   * Get user initials (e.g., "Murali Nakka" => "MN")
   */
  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (user && user.first_name && user.last_name) {
      const firstInitial = user.first_name.charAt(0).toUpperCase();
      const lastInitial = user.last_name.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }
    return 'U'; // Default fallback
  }
  
  /**
   * Check if current user is a student
   */
  isStudentRole(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'Student';
  }
}

