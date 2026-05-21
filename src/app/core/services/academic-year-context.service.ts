import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { AcademicYearService, AcademicYear } from '../../features/settings/services/academic-year.service';

const STORAGE_KEY = 'selected_academic_year_id';

@Injectable({
  providedIn: 'root'
})
export class AcademicYearContextService {
  private readonly currentYear$ = new BehaviorSubject<AcademicYear | null>(null);

  constructor(private academicYearService: AcademicYearService) {
    this.initFromStorage();
  }

  /** Set a minimal placeholder from stored ID so interceptor gets value immediately before async load. */
  private setPlaceholderFromStorage(): void {
    const id = this.getStoredId();
    if (id != null) {
      this.currentYear$.next({
        id,
        name: '',
        start_date: '',
        end_date: '',
        is_current: false,
        is_active: true
      } as AcademicYear);
    }
  }

  /** Currently selected academic year (model). */
  get selectedYear$(): Observable<AcademicYear | null> {
    return this.currentYear$.asObservable().pipe(distinctUntilChanged());
  }

  /** Currently selected academic year id. */
  get selectedYearId$(): Observable<number | null> {
    return this.currentYear$.pipe(
      map(y => y?.id ?? null),
      distinctUntilChanged()
    );
  }

  /** Snapshot of selected year id (for sync use in interceptors). */
  get selectedYearId(): number | null {
    const y = this.currentYear$.value;
    return y?.id ?? null;
  }

  /**
   * Same academic year as the top toolbar: in-memory selection, or localStorage if the model
   * is not hydrated yet. Use this for API query params and interceptors so requests match the
   * toolbar before async `getById` completes.
   */
  effectiveYearId(): number | null {
    return this.selectedYearId ?? this.getStoredId();
  }

  /** Snapshot of selected year. */
  get selectedYear(): AcademicYear | null {
    return this.currentYear$.value;
  }

  /**
   * Load and set current academic year from API (e.g. on app init).
   * If no stored selection, uses API current; otherwise keeps selection but ensures it's loaded.
   */
  loadCurrent(): void {
    this.academicYearService.getCurrent().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const storedId = this.getStoredId();
          if (storedId != null) {
            // Keep stored selection; try to resolve to full model via list or show
            this.academicYearService.getById(storedId).subscribe({
              next: (r) => {
                if (r.success && r.data) {
                  this.setSelected(r.data);
                } else {
                  this.setSelected(res.data ?? null);
                }
              },
              error: () => this.setSelected(res.data ?? null)
            });
          } else {
            this.setSelected(res.data ?? null);
          }
        }
      },
      error: () => {}
    });
  }

  /**
   * Initialize from localStorage (id only). Call loadCurrent() to hydrate full model.
   * Sets placeholder synchronously so interceptor gets selectedYearId before async load.
   */
  private initFromStorage(): void {
    const id = this.getStoredId();
    if (id != null) {
      this.setPlaceholderFromStorage();
      this.academicYearService.getById(id).subscribe({
        next: (r) => {
          if (r.success && r.data) {
            this.currentYear$.next(r.data);
          }
        },
        error: () => {
          localStorage.removeItem(STORAGE_KEY);
          this.currentYear$.next(null);
        }
      });
    }
  }

  private getStoredId(): number | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === '') return null;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  }

  /** Set the selected academic year and persist id. */
  setSelected(year: AcademicYear | null): void {
    this.currentYear$.next(year);
    if (year?.id != null) {
      localStorage.setItem(STORAGE_KEY, String(year.id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Load a specific academic year by ID and set as selected (e.g. from backend preferences).
   */
  loadYearById(id: number): void {
    this.setSelected({ id, name: '', start_date: '', end_date: '', is_current: false, is_active: true } as AcademicYear);
    this.academicYearService.getById(id).subscribe({
      next: (r) => {
        if (r.success && r.data) {
          this.setSelected(r.data);
        }
      },
      error: () => this.currentYear$.next(null)
    });
  }

  /** Load list of academic years for the toolbar switcher (all years including past). */
  getActiveYears(): Observable<{ success: boolean; data?: AcademicYear[] }> {
    return this.academicYearService.getList({ active: 1, include_past: 1, per_page: 100 }) as Observable<{ success: boolean; data?: AcademicYear[] }>;
  }
}
