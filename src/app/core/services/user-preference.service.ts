import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserPreferences {
  id?: number;
  user_id?: number;
  theme: string;
  dark_mode: boolean;
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  date_format: string;
  time_format: string;
  timezone: string;
  items_per_page: number;
  dashboard_widgets: any[] | null;
  default_view: string;
  high_contrast: boolean;
  font_size: 'small' | 'medium' | 'large';
  reduce_motion: boolean;
  additional_settings: any | null;
  created_at?: string;
  updated_at?: string;
}

export interface PreferenceResponse {
  success: boolean;
  data: UserPreferences;
  message?: string;
}

interface PreferencesCache {
  userId: number;
  data: UserPreferences;
}

@Injectable({
  providedIn: 'root'
})
export class UserPreferenceService {
  private apiUrl = `${environment.apiUrl}/preferences`;
  /** Matches AuthService storage key for the logged-in user */
  private readonly userStorageKey = 'current_user';
  private readonly cacheStorageKey = 'user_preferences_cache';
  
  // Reactive signals for preferences
  public preferences = signal<UserPreferences | null>(null);
  private preferencesSubject = new BehaviorSubject<UserPreferences | null>(null);
  public preferences$ = this.preferencesSubject.asObservable();

  // Default preferences
  private defaultPreferences: UserPreferences = {
    theme: 'ocean-blue',
    dark_mode: false,
    language: 'en',
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
    timezone: 'UTC',
    items_per_page: 10,
    dashboard_widgets: null,
    default_view: 'grid',
    high_contrast: false,
    font_size: 'medium',
    reduce_motion: false,
    additional_settings: null
  };

  constructor(private http: HttpClient) {}

  /**
   * Load preferences: use per-user local cache when valid; otherwise GET from API.
   */
  loadPreferences(options?: { force?: boolean }): Observable<PreferenceResponse> {
    if (!options?.force) {
      const inMemory = this.preferences();
      if (inMemory) {
        return of({ success: true, data: inMemory });
      }
      const cached = this.readCacheForCurrentUser();
      if (cached) {
        this.setPreferences(cached);
        return of({ success: true, data: cached });
      }
    }

    return this.http.get<PreferenceResponse>(this.apiUrl).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setPreferences(response.data);
          this.persistCache(response.data);
        }
      }),
      catchError(() => {
        this.setPreferences(this.defaultPreferences);
        return of({
          success: false,
          data: this.defaultPreferences
        });
      })
    );
  }

  /** Clear cached preferences (call on logout). */
  clearCache(): void {
    localStorage.removeItem(this.cacheStorageKey);
    localStorage.removeItem('selectedTheme');
    localStorage.removeItem('darkMode');
    this.preferences.set(null);
    this.preferencesSubject.next(null);
  }

  /** Cached preferences for the logged-in user (no network). */
  getCachedPreferences(): UserPreferences | null {
    return this.readCacheForCurrentUser();
  }

  /** Load cached preferences into memory synchronously (for theme on first paint). */
  hydrateFromCache(): UserPreferences | null {
    const cached = this.readCacheForCurrentUser();
    if (cached) {
      this.setPreferences(cached);
      return cached;
    }
    return null;
  }

  /** Keep session cache aligned when theme changes locally (before/without API). */
  mergeThemeIntoCache(theme: string): void {
    const base =
      this.readCacheForCurrentUser() ??
      this.preferences() ??
      { ...this.defaultPreferences };
    const data: UserPreferences = { ...base, theme };
    this.setPreferences(data);
    this.persistCache(data);
  }

  /**
   * Update multiple preferences at once
   */
  updatePreferences(preferences: Partial<UserPreferences>): Observable<PreferenceResponse> {
    return this.http.put<PreferenceResponse>(this.apiUrl, preferences).pipe(
      tap(response => this.applyServerPreferences(response))
    );
  }

  /**
   * Update a single preference
   */
  updatePreference(key: keyof UserPreferences, value: any): Observable<PreferenceResponse> {
    return this.http.put<PreferenceResponse>(`${this.apiUrl}/${key}`, { value }).pipe(
      tap(response => this.applyServerPreferences(response))
    );
  }

  /**
   * Reset preferences to defaults
   */
  resetPreferences(): Observable<PreferenceResponse> {
    return this.http.post<PreferenceResponse>(`${this.apiUrl}/reset`, {}).pipe(
      tap(response => this.applyServerPreferences(response))
    );
  }

  /**
   * Get current theme preference
   */
  getTheme(): string {
    const prefs = this.preferences();
    return prefs?.theme || this.defaultPreferences.theme;
  }

  /**
   * Update theme preference
   */
  updateTheme(theme: string): Observable<PreferenceResponse> {
    return this.updatePreference('theme', theme);
  }

  /**
   * Get dark mode preference
   */
  isDarkMode(): boolean {
    const prefs = this.preferences();
    return prefs?.dark_mode || false;
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(): Observable<PreferenceResponse> {
    const currentValue = this.isDarkMode();
    return this.updatePreference('dark_mode', !currentValue);
  }

  /**
   * Get language preference
   */
  getLanguage(): string {
    const prefs = this.preferences();
    return prefs?.language || this.defaultPreferences.language;
  }

  /**
   * Update language preference
   */
  updateLanguage(language: string): Observable<PreferenceResponse> {
    return this.updatePreference('language', language);
  }

  /**
   * Get items per page preference
   */
  getItemsPerPage(): number {
    const prefs = this.preferences();
    return prefs?.items_per_page || this.defaultPreferences.items_per_page;
  }

  /**
   * Update items per page preference
   */
  updateItemsPerPage(count: number): Observable<PreferenceResponse> {
    return this.updatePreference('items_per_page', count);
  }

  /**
   * Get notification preferences
   */
  getNotificationPreferences() {
    const prefs = this.preferences();
    return {
      email: prefs?.email_notifications ?? this.defaultPreferences.email_notifications,
      push: prefs?.push_notifications ?? this.defaultPreferences.push_notifications,
      sms: prefs?.sms_notifications ?? this.defaultPreferences.sms_notifications
    };
  }

  /**
   * Update notification preferences
   */
  updateNotificationPreferences(notifications: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    sms_notifications?: boolean;
  }): Observable<PreferenceResponse> {
    return this.updatePreferences(notifications);
  }

  /**
   * Get accessibility preferences
   */
  getAccessibilityPreferences() {
    const prefs = this.preferences();
    return {
      highContrast: prefs?.high_contrast ?? this.defaultPreferences.high_contrast,
      fontSize: prefs?.font_size ?? this.defaultPreferences.font_size,
      reduceMotion: prefs?.reduce_motion ?? this.defaultPreferences.reduce_motion
    };
  }

  /**
   * Update accessibility preferences
   */
  updateAccessibilityPreferences(accessibility: {
    high_contrast?: boolean;
    font_size?: 'small' | 'medium' | 'large';
    reduce_motion?: boolean;
  }): Observable<PreferenceResponse> {
    return this.updatePreferences(accessibility);
  }

  /**
   * Get current preferences (sync)
   */
  getCurrentPreferences(): UserPreferences {
    return this.preferences() || this.defaultPreferences;
  }

  /**
   * Check if preferences are loaded
   */
  isLoaded(): boolean {
    return this.preferences() !== null;
  }

  private setPreferences(data: UserPreferences): void {
    this.preferences.set(data);
    this.preferencesSubject.next(data);
  }

  private applyServerPreferences(response: PreferenceResponse): void {
    if (response.success && response.data) {
      this.setPreferences(response.data);
      this.persistCache(response.data);
    }
  }

  private currentUserId(): number | null {
    const raw = localStorage.getItem(this.userStorageKey);
    if (!raw) {
      return null;
    }
    try {
      const user = JSON.parse(raw) as { id?: number };
      return user?.id ?? null;
    } catch {
      return null;
    }
  }

  private readCacheForCurrentUser(): UserPreferences | null {
    const userId = this.currentUserId();
    if (userId == null) {
      return null;
    }
    const raw = localStorage.getItem(this.cacheStorageKey);
    if (!raw) {
      return null;
    }
    try {
      const cache = JSON.parse(raw) as PreferencesCache;
      if (cache.userId !== userId || !cache.data) {
        return null;
      }
      return cache.data;
    } catch {
      return null;
    }
  }

  private persistCache(data: UserPreferences): void {
    const userId = this.currentUserId();
    if (userId == null) {
      return;
    }
    const payload: PreferencesCache = { userId, data };
    localStorage.setItem(this.cacheStorageKey, JSON.stringify(payload));
    if (data.theme) {
      localStorage.setItem('selectedTheme', data.theme);
    }
    localStorage.setItem('darkMode', String(!!data.dark_mode));
  }
}


