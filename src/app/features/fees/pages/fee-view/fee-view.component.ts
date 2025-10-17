import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeService } from '../../services/fee.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentFees, FeePayment, FeeStructure } from '../../../../core/models/fee.model';

@Component({
  selector: 'app-fee-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './fee-view.component.html',
  styleUrls: ['./fee-view.component.scss']
})
export class FeeViewComponent implements OnInit {
  loading = false;
  studentId?: string | number;
  studentFees?: StudentFees;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feeService: FeeService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.studentId = params['id'];
        this.loadStudentFees();
      }
    });
  }
  
  loadStudentFees(): void {
    if (!this.studentId) return;
    
    this.loading = true;
    
    this.feeService.getStudentFees(this.studentId).subscribe({
      next: (response: any) => {
        console.log('Student Fees Response:', response);
        
        if (response.success && response.data) {
          this.studentFees = response.data;
          console.log('Loaded payments:', this.studentFees?.payments?.length || 0);
          console.log('Pending fees:', this.studentFees?.pending_fees?.length || 0);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading student fees:', error);
        this.errorHandler.showError(error);
        this.loading = false;
        this.router.navigate(['/fees']);
      }
    });
  }
  
  getPaymentStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Completed': 'success',
      'Pending': 'warning',
      'Failed': 'danger',
      'Refunded': 'secondary'
    };
    return colors[status] || 'default';
  }
  
  getTotalPaid(): number {
    return this.studentFees?.total_paid || 0;
  }
  
  getTotalPending(): number {
    return this.studentFees?.pending_fees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
  }
  
  getPaymentPercentage(): number {
    const total = this.getTotalPaid() + this.getTotalPending();
    if (total === 0) return 0;
    return (this.getTotalPaid() / total) * 100;
  }
  
  onBack(): void {
    this.router.navigate(['/fees']);
  }
  
  onRecordPayment(): void {
    this.router.navigate(['/fees/payment/create']);
  }
  
  printReport(): void {
    window.print();
  }
  
  exportReport(format: string): void {
    this.errorHandler.showInfo(`Exporting fees report as ${format.toUpperCase()}...`);
  }
}

