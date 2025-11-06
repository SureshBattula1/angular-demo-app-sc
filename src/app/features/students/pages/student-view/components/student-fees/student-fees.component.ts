import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Student } from '../../../../../../core/models/student.model';
import { FeeService } from '../../../../../fees/services/fee.service';
import { ErrorHandlerService } from '../../../../../../core/services/error-handler.service';

@Component({
  selector: 'app-student-fees',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './student-fees.component.html',
  styleUrls: ['./student-fees.component.scss']
})
export class StudentFeesComponent implements OnInit {
  @Input() student?: Student;
  
  feePayments: any[] = [];
  pendingFees: any[] = [];
  totalPaid = 0;
  pendingCount = 0;
  isLoading = false;

  constructor(
    private feeService: FeeService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadFeesData();
  }

  loadFeesData(): void {
    if (!this.student || !this.student.id) {
      return;
    }
    
    this.isLoading = true;
    
    this.feeService.getStudentFees(this.student.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.feePayments = response.data.payments || [];
          this.pendingFees = response.data.pending_fees || [];
          this.totalPaid = response.data.total_paid || 0;
          this.pendingCount = response.data.pending_count || 0;
        } else {
          this.feePayments = [];
          this.pendingFees = [];
          this.totalPaid = 0;
          this.pendingCount = 0;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading fees data:', error);
        if (error.status !== 404) {
          this.errorHandler.showError('Failed to load fee information');
        }
        this.feePayments = [];
        this.pendingFees = [];
        this.isLoading = false;
      }
    });
  }

  getFeeStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Pending': '#ff9800',
      'Completed': '#4caf50',
      'Failed': '#f44336',
      'Refunded': '#9e9e9e'
    };
    return colors[status] || '#9e9e9e';
  }

  getPaymentMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      'Cash': 'money',
      'Card': 'credit_card',
      'Online': 'payment',
      'Cheque': 'receipt',
      'Other': 'more_horiz'
    };
    return icons[method] || 'payment';
  }

  isOverdue(fee: any): boolean {
    if (!fee.due_date) return false;
    const dueDate = new Date(fee.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  getOverdueCount(): number {
    return this.pendingFees.filter(f => this.isOverdue(f)).length;
  }
}
