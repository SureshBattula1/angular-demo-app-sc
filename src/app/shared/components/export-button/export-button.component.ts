import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type ExportFormat = 'excel' | 'pdf' | 'csv';

export interface ExportEvent {
  format: ExportFormat;
}

/**
 * Reusable Export Button Component
 * 
 * Provides a dropdown menu for selecting export format (Excel, PDF, CSV)
 * Mobile responsive with icon-only view on small screens
 * 
 * Usage:
 * <app-export-button (export)="onExport($event)" [disabled]="loading"></app-export-button>
 */
@Component({
  selector: 'app-export-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <button 
      mat-icon-button
      [matMenuTriggerFor]="exportMenu"
      [disabled]="disabled || loading"
      class="export-btn-icon"
      matTooltip="Export Data">
      <mat-icon *ngIf="!loading">file_download</mat-icon>
      <mat-spinner *ngIf="loading" diameter="20" class="spinner"></mat-spinner>
    </button>

    <mat-menu #exportMenu="matMenu" class="export-menu">
      <button mat-menu-item (click)="onExport('excel')" class="export-menu-item">
        <mat-icon class="excel-icon">table_chart</mat-icon>
        <span>Excel</span>
        <span class="format-badge excel">XLSX</span>
      </button>
      <button mat-menu-item (click)="onExport('pdf')" class="export-menu-item">
        <mat-icon class="pdf-icon">picture_as_pdf</mat-icon>
        <span>PDF</span>
        <span class="format-badge pdf">PDF</span>
      </button>
      <button mat-menu-item (click)="onExport('csv')" class="export-menu-item">
        <mat-icon class="csv-icon">description</mat-icon>
        <span>CSV</span>
        <span class="format-badge csv">CSV</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    /* Export icon button - matches reset-btn and advanced-search-btn style */
    .spinner {
      ::ng-deep circle {
        stroke: var(--primary-color);
      }
    }

    /* Export menu styling */
    ::ng-deep .export-menu {
      .mat-mdc-menu-content {
        padding: 8px 0;
      }
    }

     ::ng-deep .export-btn-icon{
     color: var(--primary-color);
      transition: all var(--transition-fast);
      
      &:hover:not([disabled]) {
        background-color: rgba(255, 152, 0, 0.1);
        transform: rotate(180deg);
      }
      
      &[disabled] {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .export-menu-item {
      display: flex;
      align-items: center;
      gap: 0px;
      padding: 8px;
      min-height: 38px;
      transition: background-color 0.2s;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        
        &.excel-icon {
          color: #217346;
        }
        
        &.pdf-icon {
          color: #F40F02;
        }
        
        &.csv-icon {
          color: #0066B3;
        }
      }
      
      span:not(.format-badge) {
        flex: 1;
        font-size: 12px;
        font-weight: 500;
      }
      
      .format-badge {
        font-size: 8px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        letter-spacing: 0.5px;
        margin-left: 5px;
        
        &.excel {
          background-color: #E8F5E9;
          color: #217346;
        }
        
        &.pdf {
          background-color: #FFEBEE;
          color: #F40F02;
        }
        
        &.csv {
          background-color: #E3F2FD;
          color: #0066B3;
        }
      }
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }
    }

    /* Mobile menu adjustments */
    @media (max-width: 480px) {
      ::ng-deep .export-menu {
        .mat-mdc-menu-panel {
          max-width: calc(100vw - 32px);
        }
      }

      .export-menu-item {
        padding: 10px 16px;
        min-height: 44px;
        
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
        
        span:not(.format-badge) {
          font-size: 13px;
        }
      }
    }

    /* Touch device optimization */
    @media (hover: none) {
      .export-menu-item {
        min-height: 48px; /* Ensure touch target size */
      }
    }

  
  `]
})
export class ExportButtonComponent {
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  @Output() export = new EventEmitter<ExportEvent>();

  onExport(format: ExportFormat): void {
    this.export.emit({ format });
  }
}


