import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, distinctUntilChanged, tap, catchError } from 'rxjs/operators';
import { AcademicYearService, AcademicYear } from '../../features/settings/services/academic-year.service';

const STORAGE_KEY = 'selected_academic_year_id';
const YEAR_SNAPSHOT_KEY = 'selected_academic_year_snapshot';
const YEARS_LIST_CACHE_KEY = 'academic_years_list_cache';
const USER_STORAGE_KEY = 'current_user';

interface YearsListCache {
  userId: string | number;
  data: AcademicYear[];
}

@Injectable({
  providedIn: 'root'
})
export class AcademicYearContextService {
  private readonly currentYear$ = new BehaviorSubject<AcademicYear | null>(null);
  private yearsList: AcademicYear[] | null = null;

  constructor(private academicYearService: AcademicYearService) {
    this.initFromStorage();
  }

  /** Clear academic year caches (call on logout). */
  clearCache(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(YEAR_SNAPSHOT_KEY);
    localStorage.removeItem(YEARS_LIST_CACHE_KEY);
    this.yearsList = null;
    this.currentYear$.next(null);
  }

  /** Currently selected academic year (model). */
  get selectedYear$(): Observable<AcademicYear | null> {
    return this.currentYear$.asObservable().pipe(distinctUntilChanged());
  }

  /** Currently selected academic year id. */
  get selectedYearId$(): Observable<string | number | null> {
    return this.currentYear$.pipe(
      map(y => y?.id ?? null),
      distinctUntilChanged()
    );
  }

  /** Snapshot of selected year id (for sync use in interceptors). */
  get selectedYearId(): string | number | null {
    const y = this.currentYear$.value;
    return y?.id ?? null;
  }

  /**
   * Same academic year as the top toolbar: in-memory selection, or localStorage if the model
   * is not hydrated yet.
   */
  effectiveYearId(): string | number | null {
    return this.selectedYearId ?? this.getStoredId();
  }

  /** Snapshot of selected year. */
  get selectedYear(): AcademicYear | null {
    return this.currentYear$.value;
  }

  /** Restore dropdown list from localStorage (no network). */
  hydrateYearsFromCache(): AcademicYear[] {
    if (this.yearsList && this.yearsList.length > 0) {
      return this.yearsList;
    }
    const cached = this.readYearsListCache();
    if (cached) {
      this.yearsList = cached;
      return cached;
    }
    return [];
  }

  /**
   * Academic years for the toolbar switcher. Uses cache unless force or cache empty.
   */
  loadYearsForSwitcher(options?: { force?: boolean }): Observable<AcademicYear[]> {
    if (!options?.force) {
      const cached = this.hydrateYearsFromCache();
      if (cached.length > 0) {
        this.syncSelectedFromList(cached);
        return of(cached);
      }
    }

    return this.academicYearService.getList({ active: 1, include_past: 1, per_page: 100 }).pipe(
      map(res => (res.success && res.data ? res.data : [])),
      tap(years => {
        if (years.length > 0) {
          this.persistYearsList(years);
          this.syncSelectedFromList(years);
        }
      }),
      catchError(() => of(this.hydrateYearsFromCache()))
    );
  }

  /** @deprecated Use loadYearsForSwitcher — kept for compatibility. */
  getActiveYears(): Observable<{ success: boolean; data?: AcademicYear[] }> {
    return this.loadYearsForSwitcher().pipe(
      map(data => ({ success: true, data }))
    );
  }

  /**
   * After login: refresh years list and align selection with saved prefs / storage.
   */
  bootstrapAfterLogin(preferredYearId?: string | number | null): void {
    if (preferredYearId != null && String(preferredYearId) !== '') {
      this.loadYearById(preferredYearId);
    } else if (this.effectiveYearId() == null) {
      this.loadCurrent();
    }
    this.loadYearsForSwitcher({ force: true }).subscribe();
  }

  /**
   * Load current academic year from API when nothing is stored locally.
   */
  loadCurrent(): void {
    if (this.effectiveYearId() != null && this.selectedYear?.name) {
      return;
    }
    this.academicYearService.getCurrent().subscribe({
      next: res => {
        if (res.success && res.data) {
          const storedId = this.getStoredId();
          if (storedId != null) {
            this.loadYearById(storedId);
          } else {
            this.setSelected(res.data ?? null);
          }
        }
      },
      error: () => {}
    });
  }

  private initFromStorage(): void {
    const snapshot = this.readYearSnapshot();
    const id = this.getStoredId();
    if (snapshot && id != null && String(snapshot.id) === String(id)) {
      this.currentYear$.next(snapshot);
      return;
    }
    if (id != null) {
      this.setPlaceholderFromStorage();
    }
  }

  private setPlaceholderFromStorage(): void {
    const id = this.getStoredId();
    if (id != null) {
      this.currentYear$.next({
        id: String(id),
        name: '',
        start_date: '',
        end_date: '',
        is_current: false,
        is_active: true
      } as AcademicYear);
    }
  }

  private getStoredId(): string | number | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === '') {
      return null;
    }
    return raw;
  }

  /** Set the selected academic year and persist id + snapshot. */
  setSelected(year: AcademicYear | null): void {
    this.currentYear$.next(year);
    if (year?.id != null) {
      localStorage.setItem(STORAGE_KEY, String(year.id));
      localStorage.setItem(YEAR_SNAPSHOT_KEY, JSON.stringify(year));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(YEAR_SNAPSHOT_KEY);
    }
  }

  /**
   * Load a specific academic year by ID (uses snapshot/cache when possible).
   */
  loadYearById(id: string | number): void {
    const snapshot = this.readYearSnapshot();
    if (snapshot && String(snapshot.id) === String(id) && snapshot.name) {
      this.setSelected(snapshot);
      return;
    }
    const fromList = this.yearsList?.find(y => String(y.id) === String(id));
    if (fromList) {
      this.setSelected(fromList);
      return;
    }
    this.setSelected({
      id: String(id),
      name: '',
      start_date: '',
      end_date: '',
      is_current: false,
      is_active: true
    } as AcademicYear);
    this.academicYearService.getById(id).subscribe({
      next: r => {
        if (r.success && r.data) {
          this.setSelected(r.data);
        }
      },
      error: () => {}
    });
  }

  private syncSelectedFromList(years: AcademicYear[]): void {
    const id = this.effectiveYearId();
    if (id == null) {
      return;
    }
    const current = this.currentYear$.value;
    if (current?.name) {
      return;
    }
    const found = years.find(y => String(y.id) === String(id));
    if (found) {
      this.setSelected(found);
    }
  }

  private readYearSnapshot(): AcademicYear | null {
    try {
      const raw = localStorage.getItem(YEAR_SNAPSHOT_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as AcademicYear;
    } catch {
      return null;
    }
  }

  private readYearsListCache(): AcademicYear[] | null {
    const userId = this.getCurrentUserId();
    if (userId == null) {
      return null;
    }
    try {
      const raw = localStorage.getItem(YEARS_LIST_CACHE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as YearsListCache;
      if (String(parsed.userId) !== String(userId)) {
        return null;
      }
      return Array.isArray(parsed.data) ? parsed.data : null;
    } catch {
      return null;
    }
  }

  private persistYearsList(years: AcademicYear[]): void {
    const userId = this.getCurrentUserId();
    if (userId == null) {
      this.yearsList = years;
      return;
    }
    const payload: YearsListCache = { userId, data: years };
    localStorage.setItem(YEARS_LIST_CACHE_KEY, JSON.stringify(payload));
    this.yearsList = years;
  }

  private getCurrentUserId(): string | number | null {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const user = JSON.parse(raw) as { id?: string | number };
      return user?.id ?? null;
    } catch {
      return null;
    }
  }
}
