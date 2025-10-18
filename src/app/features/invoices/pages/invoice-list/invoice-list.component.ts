import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig } from '../../../../shared/components/data-table/data-table.interface';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice, InvoiceStats } from '../../../../core/models/invoice.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, DataTableComponent],
  template: `
    <div class="invoice-list-container">
      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card">
          <mat-icon>receipt_long</mat-icon>
          <div class="stat-content">
            <h3>Total Invoices</h3>
            <p class="stat-value">{{ stats.total_invoices }}</p>
          </div>
        </div>
        <div class="stat-card success">
          <mat-icon>check_circle</mat-icon>
          <div class="stat-content">
            <h3>Paid</h3>
            <p class="stat-value">₹{{ stats.paid_amount | number:'1.0-0' }}</p>
          </div>
        </div>
        <div class="stat-card warning">
          <mat-icon>pending</mat-icon>
          <div class="stat-content">
            <h3>Pending</h3>
            <p class="stat-value">₹{{ stats.pending_amount | number:'1.0-0' }}</p>
          </div>
        </div>
        <div class="stat-card error" *ngIf="stats.overdue_invoices > 0">
          <mat-icon>warning</mat-icon>
          <div class="stat-content">
            <h3>Overdue</h3>
            <p class="stat-value">{{ stats.overdue_invoices }}</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button mat-raised-button color="accent" (click)="generateFromTransactions()">
          <mat-icon>auto_awesome</mat-icon>
          Generate from Transactions
        </button>
        <button mat-raised-button color="primary" (click)="createManual()">
          <mat-icon>add</mat-icon>
          Create Manual Invoice
        </button>
      </div>

      <!-- Invoices Table -->
      <app-data-table
        [data]="invoices"
        [config]="tableConfig"
        [title]="'Invoice Management'"
        [loading]="loading"
        (actionClicked)="onAction($event)">
      </app-data-table>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/assets/variables' as *;

    .invoice-list-container {
      padding: var(--spacing-lg);
      max-width: 1600px;
      margin: 0 auto;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .stat-card {
      background: white;
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      transition: transform var(--transition-normal);

      &:hover {
        transform: translateY(-4px);
      }

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--primary-color);
      }

      &.success mat-icon { color: var(--success-color); }
      &.warning mat-icon { color: var(--warning-color); }
      &.error mat-icon { color: var(--error-color); }

      .stat-content h3 {
        margin: 0 0 4px 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .stat-value {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .action-buttons {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    @media (max-width: $breakpoint-sm) {
      .invoice-list-container { padding: var(--spacing-sm); }
      .action-buttons { flex-direction: column; button { width: 100%; } }
    }
  `]
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  stats: InvoiceStats | null = null;
  loading = false;

  tableConfig: TableConfig = {
    columns: [
      { key: 'invoice_number', header: 'Invoice #', sortable: true, width: '140px' },
      { key: 'customer_name', header: 'Customer', sortable: true, width: '180px' },
      { key: 'invoice_date', header: 'Date', type: 'date', width: '110px' },
      { key: 'total_amount', header: 'Total', type: 'number', width: '110px', align: 'right' },
      { key: 'balance_amount', header: 'Balance', type: 'number', width: '110px', align: 'right' },
      { key: 'payment_status', header: 'Payment', type: 'badge', width: '100px' },
      { key: 'status', header: 'Status', type: 'badge', width: '100px' }
    ],
    actions: [
      { icon: 'visibility', label: 'View', action: (row: Invoice) => this.viewInvoice(row) }
    ],
    pagination: true,
    searchable: true,
    responsive: true
  };

  constructor(
    private invoiceService: InvoiceService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadStats();
  }

  loadInvoices(): void {
    this.loading = true;
    this.invoiceService.getInvoices().subscribe({
      next: (response) => {
        if (response.success) this.invoices = response.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadStats(): void {
    this.invoiceService.getStats({}).subscribe({
      next: (response) => {
        if (response.success) this.stats = response.data || null;
      }
    });
  }

  generateFromTransactions(): void {
    this.router.navigate(['/invoices/generate']);
  }

  createManual(): void {
    this.router.navigate(['/invoices/create']);
  }

  viewInvoice(invoice: Invoice): void {
    this.router.navigate(['/invoices/view', invoice.id]);
  }

  onAction(event: any): void {
    if (event.action === 'add') this.createManual();
  }
}

