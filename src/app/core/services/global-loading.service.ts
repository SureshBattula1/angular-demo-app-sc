import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Full-screen loading overlay (reference-counted for overlapping API calls).
 */
@Injectable({ providedIn: 'root' })
export class GlobalLoadingService {
  private depth = 0;
  private readonly loading = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loading.asObservable();

  show(): void {
    this.depth++;
    if (this.depth === 1) {
      this.loading.next(true);
    }
  }

  hide(): void {
    this.depth = Math.max(0, this.depth - 1);
    if (this.depth === 0) {
      this.loading.next(false);
    }
  }
}
