import { Injectable, signal } from '@angular/core';

export interface Theme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  neutral: string;
  surface: string;
  softSurface: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'selectedTheme';
  public currentTheme = signal<string>('ocean-blue');
  public isDarkMode = signal<boolean>(false);

  themes: Record<string, Theme> = {
    "ocean-blue": {
      primary:"#1E88E5", primaryLight:"#90CAF9", primaryDark:"#1565C0",
      accent:"#00B8D9",  accentLight:"#80E1EF",  accentDark:"#008DA7",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F7F8",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#2563EB"
    },
    "forest-green": {
      primary:"#2E7D32", primaryLight:"#81C784", primaryDark:"#1B5E20",
      accent:"#23C55E",  accentLight:"#86EFAC",  accentDark:"#16A34A",
      neutral:"#64748B", surface:"#FFFFFF", softSurface:"#F6FBF7",
      success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#2563EB"
    },
    "royal-purple": {
      primary:"#7C3AED", primaryLight:"#C4B5FD", primaryDark:"#5B21B6",
      accent:"#A78BFA",  accentLight:"#DDD6FE",  accentDark:"#8B5CF6",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F8F6FF",
      success:"#22C55E", warning:"#EAB308", danger:"#DC2626", info:"#4F46E5"
    }
  };

  constructor() {
    this.loadTheme();
  }

  /**
   * Apply theme to the application
   */
  applyTheme(themeName: string): void {
    const theme = this.themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    
    // Update CSS variables
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--primary-light', theme.primaryLight);
    root.style.setProperty('--primary-dark', theme.primaryDark);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--accent-light', theme.accentLight);
    root.style.setProperty('--accent-dark', theme.accentDark);
    root.style.setProperty('--neutral-color', theme.neutral);
    root.style.setProperty('--surface-color', theme.surface);
    root.style.setProperty('--soft-surface-color', theme.softSurface);
    root.style.setProperty('--success-color', theme.success);
    root.style.setProperty('--warning-color', theme.warning);
    root.style.setProperty('--error-color', theme.danger);
    root.style.setProperty('--info-color', theme.info);

    this.currentTheme.set(themeName);
    localStorage.setItem(this.THEME_KEY, themeName);
    
    this.updateMaterialStyles(theme);
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(): void {
    const isDark = !this.isDarkMode();
    this.isDarkMode.set(isDark);
    
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    localStorage.setItem('darkMode', isDark.toString());
  }

  /**
   * Load saved theme from storage
   */
  private loadTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedTheme) {
      this.applyTheme(savedTheme);
    }
    
    if (savedDarkMode === 'true') {
      this.isDarkMode.set(true);
      document.body.classList.add('dark-theme');
    }
  }

  /**
   * Update Material component styles dynamically
   */
  private updateMaterialStyles(theme: Theme): void {
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
      
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__leading,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__notch,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__trailing {
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-form-field.mat-focused .mat-mdc-form-field-label {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-checkbox.mat-accent .mdc-checkbox__native-control:enabled:checked~.mdc-checkbox__background {
        background-color: ${theme.primary} !important;
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-progress-spinner circle {
        stroke: ${theme.primary} !important;
      }
    `;
  }

  /**
   * Get all available themes
   */
  getThemes(): string[] {
    return Object.keys(this.themes);
  }

  /**
   * Get current theme object
   */
  getCurrentTheme(): Theme | undefined {
    return this.themes[this.currentTheme()];
  }
}

