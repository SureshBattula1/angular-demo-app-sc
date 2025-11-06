import { Injectable, signal, inject } from '@angular/core';
import { UserPreferenceService } from './user-preference.service';

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
  private userPreferenceService = inject(UserPreferenceService);

  themes: Record<string, Theme> = {
    "ocean-blue": {
      primary:"#1E88E5", primaryLight:"#90CAF9", primaryDark:"#1565C0",
      accent:"#00B8D9",  accentLight:"#80E1EF",  accentDark:"#008DA7",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F7F8",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#2563EB"
    },
    "corporate-blue-gray": {
      primary:"#2B6CB0", primaryLight:"#A0C4FF", primaryDark:"#1E4E8C",
      accent:"#38B2AC",  accentLight:"#B2F5EA",  accentDark:"#2C7A7B",
      neutral:"#5E6775", surface:"#FFFFFF", softSurface:"#F5F7FA",
      success:"#10B981", warning:"#F59E0B", danger:"#EF4444", info:"#3B82F6"
    },
    "sunset-orange": {
      primary:"#F97316", primaryLight:"#FDBA74", primaryDark:"#EA580C",
      accent:"#FF6B6B",  accentLight:"#FFB3B3",  accentDark:"#E04646",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF7F3",
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
    },
    "ruby-red": {
      primary:"#E11D48", primaryLight:"#FDA4AF", primaryDark:"#9F1239",
      accent:"#F43F5E",  accentLight:"#FECDD3",  accentDark:"#BE123C",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF5F7",
      success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#2563EB"
    },
    "teal-mint": {
      primary:"#0D9488", primaryLight:"#99F6E4", primaryDark:"#0F766E",
      accent:"#14B8A6",  accentLight:"#5EEAD4",  accentDark:"#0B9F8F",
      neutral:"#607D8B", surface:"#FFFFFF", softSurface:"#F4FFFD",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#0891B2"
    },
    "amber-gold": {
      primary:"#D97706", primaryLight:"#FDE68A", primaryDark:"#B45309",
      accent:"#F59E0B",  accentLight:"#FCD34D",  accentDark:"#C2410C",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF9EB",
      success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#2563EB"
    },
    "slate-gray": {
      primary:"#475569", primaryLight:"#94A3B8", primaryDark:"#334155",
      accent:"#0EA5E9",  accentLight:"#BAE6FD",  accentDark:"#0369A1",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F8FA",
      success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
    },
    "midnight-blue": {
      primary:"#0F172A", primaryLight:"#334155", primaryDark:"#0B1220",
      accent:"#14B8A6",  accentLight:"#5EEAD4",  accentDark:"#0D9488",
      neutral:"#94A3B8", surface:"#0B0F14", softSurface:"#111827",
      success:"#22C55E", warning:"#EAB308", danger:"#F87171", info:"#60A5FA"
    },
    "lavender-dream": {
      primary:"#8B5CF6", primaryLight:"#DDD6FE", primaryDark:"#6D28D9",
      accent:"#EC4899",  accentLight:"#FBCFE8",  accentDark:"#BE185D",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FBF7FF",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#6366F1"
    },
    "coral-reef": {
      primary:"#FB7185", primaryLight:"#FECDD3", primaryDark:"#E11D48",
      accent:"#F59E0B",  accentLight:"#FED7AA",  accentDark:"#C2410C",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF6F7",
      success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#2563EB"
    },
    "emerald-city": {
      primary:"#059669", primaryLight:"#6EE7B7", primaryDark:"#047857",
      accent:"#34D399",  accentLight:"#A7F3D0",  accentDark:"#10B981",
      neutral:"#64748B", surface:"#FFFFFF", softSurface:"#F3FFF9",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#0EA5E9"
    },
    "graphite": {
      primary:"#374151", primaryLight:"#9CA3AF", primaryDark:"#1F2937",
      accent:"#60A5FA",  accentLight:"#BFDBFE",  accentDark:"#1D4ED8",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F7F8",
      success:"#10B981", warning:"#F59E0B", danger:"#EF4444", info:"#3B82F6"
    },
    "cobalt-sky": {
      primary:"#2563EB", primaryLight:"#93C5FD", primaryDark:"#1D4ED8",
      accent:"#22D3EE",  accentLight:"#A5F3FC",  accentDark:"#0891B2",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F5F9FF",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#2563EB"
    },
    "flamingo": {
      primary:"#F43F5E", primaryLight:"#FECDD3", primaryDark:"#BE123C",
      accent:"#FB7185",  accentLight:"#FFD1DC",  accentDark:"#E11D48",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF5F7",
      success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#3B82F6"
    },
    "coffee-cream": {
      primary:"#8B5E34", primaryLight:"#D6BFA5", primaryDark:"#5E3D22",
      accent:"#D97706",  accentLight:"#FCD34D",  accentDark:"#B45309",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FAF7F3",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#2563EB"
    },
    "moss": {
      primary:"#3F6212", primaryLight:"#A3E635", primaryDark:"#365314",
      accent:"#65A30D",  accentLight:"#D9F99D",  accentDark:"#4D7C0F",
      neutral:"#64748B", surface:"#FFFFFF", softSurface:"#F7FBF3",
      success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#2563EB"
    },
    "indigo-night": {
      primary:"#4338CA", primaryLight:"#C7D2FE", primaryDark:"#3730A3",
      accent:"#06B6D4",  accentLight:"#A5F3FC",  accentDark:"#0E7490",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F6F7FF",
      success:"#22C55E", warning:"#EAB308", danger:"#EF4444", info:"#3B82F6"
    },
    "arctic-ice": {
      primary:"#38BDF8", primaryLight:"#BAE6FD", primaryDark:"#0284C7",
      accent:"#22D3EE",  accentLight:"#CFFAFE",  accentDark:"#0891B2",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F5FBFF",
      success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
    },
    "desert-sand": {
      primary:"#D4A373", primaryLight:"#F1DEC9", primaryDark:"#A36C3D",
      accent:"#EAB308",  accentLight:"#FDE68A",  accentDark:"#B45309",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF9F2",
      success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#2563EB"
    },
    "wine-berry": {
      primary:"#7F1D1D", primaryLight:"#FCA5A5", primaryDark:"#581313",
      accent:"#DB2777",  accentLight:"#FBCFE8",  accentDark:"#9D174D",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF6F6",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#3B82F6"
    },
    "aqua-splash": {
      primary:"#06B6D4", primaryLight:"#A5F3FC", primaryDark:"#0E7490",
      accent:"#10B981",  accentLight:"#A7F3D0",  accentDark:"#059669",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F2FEFF",
      success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
    },
    "lime-zest": {
      primary:"#65A30D", primaryLight:"#D9F99D", primaryDark:"#4D7C0F",
      accent:"#22C55E",  accentLight:"#86EFAC",  accentDark:"#16A34A",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7FFF2",
      success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#3B82F6"
    },
    "plum": {
      primary:"#6D28D9", primaryLight:"#DDD6FE", primaryDark:"#5B21B6",
      accent:"#F472B6",  accentLight:"#FBCFE8",  accentDark:"#DB2777",
      neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FBF7FF",
      success:"#22C55E", warning:"#EAB308", danger:"#EF4444", info:"#6366F1"
    }
  };

  constructor() {
    this.loadTheme();
  }

  /**
   * Apply theme to the application
   * @param themeName - Theme name to apply
   * @param saveToBackend - Whether to save to backend (default: false)
   */
  applyTheme(themeName: string, saveToBackend: boolean = false): void {
    const theme = this.themes[themeName];
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
      return;
    }

    const root = document.documentElement;
    
    // Update Primary Colors
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--primary-light', theme.primaryLight);
    root.style.setProperty('--primary-dark', theme.primaryDark);
    
    // Update Accent Colors
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--accent-light', theme.accentLight);
    root.style.setProperty('--accent-dark', theme.accentDark);
    
    // Update Neutral and Surface Colors
    root.style.setProperty('--neutral-color', theme.neutral);
    root.style.setProperty('--surface-color', theme.surface);
    root.style.setProperty('--soft-surface-color', theme.softSurface);
    root.style.setProperty('--card-background', theme.surface);
    
    // Update Semantic Colors
    root.style.setProperty('--success-color', theme.success);
    root.style.setProperty('--warning-color', theme.warning);
    root.style.setProperty('--error-color', theme.danger);
    root.style.setProperty('--info-color', theme.info);
    
    // Update Material Design 3 System Variables (used by Material components internally)
    root.style.setProperty('--mat-option-selected-state-label-text-color', theme.primary);
    root.style.setProperty('--mat-option-selected-state-layer-color', theme.primary);
    root.style.setProperty('--mat-option-hover-state-layer-color', theme.primary);
    root.style.setProperty('--mat-option-focus-state-layer-color', theme.primary);
    root.style.setProperty('--mat-sys-on-secondary-container', theme.primary);
    root.style.setProperty('--mat-sys-primary', theme.primary);
    root.style.setProperty('--mat-sys-on-primary', '#ffffff');
    root.style.setProperty('--mat-sys-secondary', theme.accent);
    root.style.setProperty('--mat-sys-on-secondary', '#ffffff');
    root.style.setProperty('--mat-sys-secondary-container', theme.primaryLight);
    root.style.setProperty('--mdc-theme-primary', theme.primary);
    root.style.setProperty('--mdc-theme-secondary', theme.accent);
    root.style.setProperty('--mdc-theme-on-primary', '#ffffff');
    root.style.setProperty('--mdc-theme-on-secondary', '#ffffff');
    root.style.setProperty('--mdc-filled-text-field-focus-label-text-color', theme.primary);
    root.style.setProperty('--mdc-outlined-text-field-focus-label-text-color', theme.primary);
    root.style.setProperty('--mdc-outlined-text-field-focus-outline-color', theme.primary);

    this.currentTheme.set(themeName);
    localStorage.setItem(this.THEME_KEY, themeName);
    
    // Update Material component styles with new theme
    this.updateMaterialStyles(theme);

    // Save to backend if requested
    if (saveToBackend) {
      this.userPreferenceService.updateTheme(themeName).subscribe({
        next: () => console.log(`Theme "${themeName}" saved to backend`),
        error: (err) => console.error('Failed to save theme preference:', err)
      });
    }
  }

  /**
   * Toggle dark mode
   * @param saveToBackend - Whether to save to backend (default: false)
   */
  toggleDarkMode(saveToBackend: boolean = false): void {
    const isDark = !this.isDarkMode();
    this.isDarkMode.set(isDark);
    
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    localStorage.setItem('darkMode', isDark.toString());

    // Save to backend if requested
    if (saveToBackend) {
      this.userPreferenceService.updatePreference('dark_mode', isDark).subscribe({
        error: (err) => console.error('Failed to save dark mode preference:', err)
      });
    }
  }

  /**
   * Load saved theme from storage
   * Priority: Backend preferences > localStorage
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
   * Load theme from user preferences (backend)
   * This should be called after user authentication
   */
  loadThemeFromPreferences(): void {
    const preferences = this.userPreferenceService.getCurrentPreferences();
    
    if (preferences.theme) {
      this.applyTheme(preferences.theme, false); // Don't save back to backend
    }
    
    if (preferences.dark_mode) {
      this.isDarkMode.set(preferences.dark_mode);
      if (preferences.dark_mode) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
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
      /* Sidebar and List Items */
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
      
      /* Toolbar */
      .mat-toolbar.mat-primary,
      .app-header {
        background-color: ${theme.primary} !important;
      }
      
      /* Theme Selector in Header */
      .theme-selector .mat-mdc-floating-label {
        color: rgba(255, 255, 255, 0.7) !important;
      }
      
      .theme-selector.mat-focused .mat-mdc-floating-label {
        color: white !important;
      }
      
      .theme-selector .mdc-notched-outline__leading,
      .theme-selector .mdc-notched-outline__notch,
      .theme-selector .mdc-notched-outline__trailing {
        border-color: rgba(255, 255, 255, 0.5) !important;
      }
      
      .theme-selector.mat-focused .mdc-notched-outline__leading,
      .theme-selector.mat-focused .mdc-notched-outline__notch,
      .theme-selector.mat-focused .mdc-notched-outline__trailing {
        border-color: white !important;
      }
      
      .theme-selector .mat-mdc-select-value,
      .theme-selector .mat-mdc-select-arrow {
        color: white !important;
      }
      
      /* Buttons */
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
      
      /* Form Fields - Focused State */
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__leading,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__notch,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__trailing {
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-form-field.mat-focused .mat-mdc-floating-label,
      .mat-mdc-form-field.mat-focused .mat-mdc-form-field-label {
        color: ${theme.primary} !important;
      }
      
      /* Form Fields - Unfocused State (uses neutral color) */
      .mat-mdc-form-field:not(.mat-focused) .mat-mdc-floating-label,
      .mat-mdc-form-field:not(.mat-focused) .mat-mdc-form-field-label,
      .mat-mdc-form-field .mat-mdc-floating-label:not(.mdc-floating-label--float-above) {
        color: ${theme.neutral} !important;
      }
      
      /* Form Fields - All label states with higher specificity */
      .exam-form-container .mat-mdc-form-field .mat-mdc-floating-label,
      .exam-term-form-container .mat-mdc-form-field .mat-mdc-floating-label,
      .role-form-container .mat-mdc-form-field .mat-mdc-floating-label,
      .user-form-container .mat-mdc-form-field .mat-mdc-floating-label,
      .user-view-container .mat-mdc-form-field .mat-mdc-floating-label {
        color: ${theme.neutral} !important;
      }
      
      .exam-form-container .mat-mdc-form-field.mat-focused .mat-mdc-floating-label,
      .exam-term-form-container .mat-mdc-form-field.mat-focused .mat-mdc-floating-label,
      .role-form-container .mat-mdc-form-field.mat-focused .mat-mdc-floating-label,
      .user-form-container .mat-mdc-form-field.mat-focused .mat-mdc-floating-label,
      .user-view-container .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
        color: ${theme.primary} !important;
      }
      
      /* Form Field Borders - Unfocused */
      .mdc-notched-outline__leading,
      .mdc-notched-outline__notch,
      .mdc-notched-outline__trailing {
        border-color: rgba(0, 0, 0, 0.38) !important;
      }
      
      /* Select dropdown */
      .mat-mdc-select:focus .mat-mdc-select-trigger {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-select-arrow {
        color: ${theme.neutral} !important;
      }
      
      .mat-mdc-form-field.mat-focused .mat-mdc-select-arrow {
        color: ${theme.primary} !important;
      }
      
      /* Mat-Option - Dropdown Options */
      .mat-mdc-option {
        color: rgba(0, 0, 0, 0.87) !important;
      }
      
      .mat-mdc-option .mdc-list-item__primary-text {
        color: rgba(0, 0, 0, 0.87) !important;
      }
      
      .mat-mdc-option:hover:not(.mat-mdc-option-disabled),
      .mat-mdc-option.mat-mdc-option-active {
        background-color: ${theme.primary}0D !important;
      }
      
      .mat-mdc-option.mdc-list-item--selected:not(.mat-mdc-option-multiple) {
        background-color: ${theme.primary}1A !important;
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-multiple) .mdc-list-item__primary-text {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-option.mdc-list-item--selected .mat-pseudo-checkbox-checked,
      .mat-mdc-option.mdc-list-item--selected .mat-pseudo-checkbox-indeterminate {
        background-color: ${theme.primary} !important;
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-option.mdc-list-item--selected .mat-pseudo-checkbox-checked::after,
      .mat-mdc-option.mdc-list-item--selected .mat-pseudo-checkbox-indeterminate::after {
        border-color: white !important;
      }
      
      /* Mat-Select Panel */
      .mat-mdc-select-panel {
        background-color: white !important;
      }
      
      /* Mat-Option Text and Icons */
      .mat-mdc-option mat-icon {
        color: ${theme.neutral} !important;
      }
      
      .mat-mdc-option.mdc-list-item--selected mat-icon {
        color: ${theme.primary} !important;
      }
      
      /* Checkboxes and Radio Buttons */
      .mat-mdc-checkbox.mat-accent .mdc-checkbox__native-control:enabled:checked~.mdc-checkbox__background,
      .mat-mdc-checkbox.mat-primary .mdc-checkbox__native-control:enabled:checked~.mdc-checkbox__background {
        background-color: ${theme.primary} !important;
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-radio-button.mat-accent .mdc-radio__native-control:enabled:checked+.mdc-radio__background .mdc-radio__outer-circle,
      .mat-mdc-radio-button.mat-accent .mdc-radio__native-control:enabled:checked+.mdc-radio__background .mdc-radio__inner-circle {
        border-color: ${theme.primary} !important;
        background-color: ${theme.primary} !important;
      }
      
      /* Slide Toggle */
      .mat-mdc-slide-toggle.mat-accent .mdc-switch--selected .mdc-switch__track::after,
      .mat-mdc-slide-toggle.mat-primary .mdc-switch--selected .mdc-switch__track::after {
        background-color: ${theme.primary} !important;
      }
      
      .mat-mdc-slide-toggle.mat-accent .mdc-switch--selected .mdc-switch__handle::after,
      .mat-mdc-slide-toggle.mat-primary .mdc-switch--selected .mdc-switch__handle::after {
        background-color: ${theme.primary} !important;
      }
      
      /* Progress Spinner */
      .mat-mdc-progress-spinner circle {
        stroke: ${theme.primary} !important;
      }
      
      /* Chips */
      .mat-mdc-chip.mat-primary {
        background-color: ${theme.primary} !important;
      }
      
      .mat-mdc-chip.mat-accent {
        background-color: ${theme.accent} !important;
      }
      
      /* Tab Groups */
      .mat-mdc-tab-group.mat-primary .mat-mdc-tab-labels .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-tab-group.mat-primary .mat-mdc-tab-header .mat-mdc-tab-header-pagination-chevron {
        border-color: ${theme.primary} !important;
      }
      
      /* Datepicker */
      .mat-datepicker-content .mat-calendar-body-selected {
        background-color: ${theme.primary} !important;
      }
      
      .mat-datepicker-content .mat-calendar-body-today:not(.mat-calendar-body-selected) {
        border-color: ${theme.primary} !important;
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

