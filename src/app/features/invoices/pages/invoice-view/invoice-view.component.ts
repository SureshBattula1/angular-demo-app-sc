import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../../../core/models/invoice.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './invoice-view.component.html',
  styleUrls: ['./invoice-view.component.scss']
})
export class InvoiceViewComponent implements OnInit {
  invoice: Invoice | null = null;
  loading = false;
  displayedColumns = ['description', 'quantity', 'unit_price', 'amount'];

  constructor(
    private invoiceService: InvoiceService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadInvoice(+params['id']);
      }
    });
  }

  loadInvoice(id: number): void {
    this.loading = true;
    this.invoiceService.getInvoice(id).subscribe({
      next: (response) => {
        if (response.success) this.invoice = response.data || null;
        this.loading = false;
      },
      error: () => {
        this.errorHandler.showError('Failed to load invoice');
        this.loading = false;
      }
    });
  }

  onPrint(): void {
    window.print();
  }

  onBack(): void {
    this.router.navigate(['/invoices']);
  }

  onSend(): void {
    if (!this.invoice) return;
    
    this.invoiceService.sendInvoice(this.invoice.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Invoice sent successfully');
          this.loadInvoice(this.invoice!.id);
        }
      }
    });
  }
}

