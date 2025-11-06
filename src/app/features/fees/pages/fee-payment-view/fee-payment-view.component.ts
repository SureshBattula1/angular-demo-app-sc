import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeService } from '../../services/fee.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FeePayment } from '../../../../core/models/fee.model';

@Component({
  selector: 'app-fee-payment-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './fee-payment-view.component.html',
  styleUrls: ['./fee-payment-view.component.scss']
})
export class FeePaymentViewComponent implements OnInit {
  loading = false;
  feePayment?: FeePayment;
  paymentId?: string | number;
  returnTab = 'payments';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feeService: FeeService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.paymentId = params['id'];
        this.loadPayment();
      }
    });
    
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'] || 'payments';
    });
  }
  
  loadPayment(): void {
    if (!this.paymentId) return;
    
    this.loading = true;
    
    this.feeService.getFeePaymentById(this.paymentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.feePayment = response.data;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.router.navigate(['/fees'], {
          queryParams: { tab: this.returnTab }
        });
      }
    });
  }
  
  onBack(): void {
    this.router.navigate(['/fees'], {
      queryParams: { tab: this.returnTab }
    });
  }
  
  onPrint(): void {
    window.print();
  }
  
  onDownloadReceipt(): void {
    this.errorHandler.showInfo('Downloading receipt...');
    // Implement download logic
  }
  
  getPaymentStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Completed': 'status-success',
      'Pending': 'status-warning',
      'Failed': 'status-danger',
      'Refunded': 'status-info'
    };
    return statusMap[status] || 'status-default';
  }
  
  getPaymentMethodIcon(method: string): string {
    const iconMap: Record<string, string> = {
      'Cash': 'payments',
      'Card': 'credit_card',
      'Online': 'language',
      'Cheque': 'receipt',
      'Other': 'more_horiz'
    };
    return iconMap[method] || 'payment';
  }
}

