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
  pastTransactionsColumns = ['date', 'payment_method', 'amount_paid', 'discount', 'late_fee', 'total'];
  
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
  
  onDownloadReceipt(): void {
    if (!this.paymentId) {
      this.errorHandler.showWarning('Payment information is not loaded yet.');
      return;
    }

    this.errorHandler.showInfo('Preparing receipt PDF...');

    this.feeService.downloadFeePaymentReceipt(this.paymentId).subscribe({
      next: (blob: Blob) => {
        const fileName =
          (this.feePayment?.receipt_number
            ? `fee-receipt-${this.feePayment.receipt_number}`
            : `fee-receipt-${this.paymentId}`) + '.pdf';

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();

        window.URL.revokeObjectURL(url);
        this.errorHandler.showSuccess('Receipt downloaded.');
      },
      error: (error: unknown) => {
        this.errorHandler.showError(error);
      }
    });
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
  
  /** Total discount from all past transactions */
  getTotalDiscount(): number {
    const txns = this.feePayment?.past_transactions ?? [];
    return txns.reduce((sum, t) => sum + (Number(t.discount_amount ?? 0) || 0), 0);
  }

  /** Amount after discount = Full Fee - Total Discount (all transactions) */
  getAmountAfterDiscount(): number {
    const fullFee = this.feePayment?.fee_structure?.amount;
    const totalDiscount = this.getTotalDiscount();
    if (fullFee == null) return 0;
    return Math.max(0, Number(fullFee) - totalDiscount);
  }

  /** Total amount paid toward fee from all transactions (excludes late fee) */
  getTotalAmountPaid(): number {
    const txns = this.feePayment?.past_transactions ?? [];
    return txns.reduce((sum, t) => sum + (Number(t.amount_paid ?? 0) || 0), 0);
  }

  /** Already paid from OLD/previous payments only (excludes current payment) */
  getAlreadyPaidExcludingCurrent(): number {
    const txns = this.feePayment?.past_transactions ?? [];
    const currentId = this.feePayment?.id != null ? String(this.feePayment.id) : null;
    return txns
      .filter(t => currentId == null || String(t.id) !== currentId)
      .reduce((sum, t) => sum + (Number(t.amount_paid ?? 0) || 0), 0);
  }

  /** Remaining = Amount After Discount - Total Amount Paid (no late fee) */
  getRemainingAmount(): number {
    const amountAfterDiscount = this.getAmountAfterDiscount();
    const totalPaid = this.getTotalAmountPaid();
    return Math.max(0, amountAfterDiscount - totalPaid);
  }

  /** Sum of late fee from all transactions */
  getTotalLateFee(): number {
    const txns = this.feePayment?.past_transactions ?? [];
    return txns.reduce((sum, t) => sum + (Number(t.late_fee ?? 0) || 0), 0);
  }

  /** Total Amount = sum of all amount_paid + sum of all late_fee */
  getTotalCollectedAmount(): number {
    return this.getTotalAmountPaid() + this.getTotalLateFee();
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

