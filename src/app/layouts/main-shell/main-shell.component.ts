import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../shared/modules/material/material.module';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './main-shell.component.html',
  styleUrls: ['./main-shell.component.scss']
})
export class MainShellComponent implements OnInit {
  isHandset$: Observable<boolean>;
  isSidebarCollapsed = false;
  selectedTheme = 'teal-green';
  
  // Theme definitions
  themes = {
    'teal-green': {
      primary: '#00897b',
      primaryLight: '#4db6ac',
      primaryDark: '#00695c',
      accent: '#4caf50',
      accentLight: '#81c784',
      accentDark: '#388e3c'
    },
    'indigo-pink': {
      primary: '#3f51b5',
      primaryLight: '#7986cb',
      primaryDark: '#303f9f',
      accent: '#ff4081',
      accentLight: '#ff79b0',
      accentDark: '#c60055'
    },
    'blue-orange': {
      primary: '#1976d2',
      primaryLight: '#42a5f5',
      primaryDark: '#1565c0',
      accent: '#ff9800',
      accentLight: '#ffb74d',
      accentDark: '#f57c00'
    },
    'purple-pink': {
      primary: '#9c27b0',
      primaryLight: '#ba68c8',
      primaryDark: '#7b1fa2',
      accent: '#e91e63',
      accentLight: '#f06292',
      accentDark: '#c2185b'
    },
    'red-gray': {
      primary: '#d32f2f',
      primaryLight: '#ef5350',
      primaryDark: '#c62828',
      accent: '#616161',
      accentLight: '#9e9e9e',
      accentDark: '#424242'
    }
  };
  
  constructor(private breakpointObserver: BreakpointObserver) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
  }
  
  ngOnInit() {
    // Initialize sidebar state based on screen size
    this.breakpointObserver.observe(Breakpoints.Handset)
      .subscribe(result => {
        if (result.matches) {
          // On mobile, sidebar starts collapsed
          this.isSidebarCollapsed = true;
        } else {
          // On desktop, sidebar starts expanded
          this.isSidebarCollapsed = false;
        }
      });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      this.selectedTheme = savedTheme;
      this.applyTheme(savedTheme);
    }
  }
  
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  onThemeChange(theme: string) {
    this.applyTheme(theme);
    localStorage.setItem('selectedTheme', theme);
  }
  
  applyTheme(themeName: string) {
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
      
      // Force update active sidebar items
      const activeItems = document.querySelectorAll('.mat-mdc-list-item.active');
      activeItems.forEach((item: any) => {
        item.style.backgroundColor = `${theme.primary}1A`; // 10% opacity
        item.style.color = theme.primary;
        const icon = item.querySelector('mat-icon');
        if (icon) {
          icon.style.color = theme.primary;
        }
      });
      
      // Update hover effect on sidebar items
      this.updateSidebarStyles(theme);
    }
  }
  
  updateSidebarStyles(theme: any) {
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
      }
      
      .mat-mdc-raised-button.mat-accent,
      .mat-mdc-unelevated-button.mat-accent {
        background-color: ${theme.accent} !important;
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
    `;
  }
}

