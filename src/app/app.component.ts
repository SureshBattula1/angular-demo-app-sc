import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GlobalLoadingService } from './core/services/global-loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatProgressSpinnerModule],
  template: `
    <router-outlet></router-outlet>
    <div
      class="global-loading-overlay"
      *ngIf="globalLoading.loading$ | async"
      role="status"
      aria-live="polite"
      aria-busy="true">
      <mat-spinner diameter="48"></mat-spinner>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }
      .global-loading-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.35);
        pointer-events: all;
      }
    `
  ]
})
export class AppComponent {
  protected readonly globalLoading = inject(GlobalLoadingService);
  title = 'School Management System';
}
