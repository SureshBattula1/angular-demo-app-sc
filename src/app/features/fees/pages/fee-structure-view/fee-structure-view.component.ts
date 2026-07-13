import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeService } from '../../services/fee.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FeeStructure } from '../../../../core/models/fee.model';

@Component({
  selector: 'app-fee-structure-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './fee-structure-view.component.html',
  styleUrls: ['./fee-structure-view.component.scss']
})
export class FeeStructureViewComponent implements OnInit {
  loading = false;
  feeStructure?: FeeStructure;
  feeStructureId?: string | number;
  returnTab = 'structures';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feeService: FeeService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.feeStructureId = params['id'];
        this.loadFeeStructure();
      }
    });
    
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'] || 'structures';
    });
  }
  
  loadFeeStructure(): void {
    if (!this.feeStructureId) return;
    
    this.loading = true;
    
    this.feeService.getFeeStructureById(this.feeStructureId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.feeStructure = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
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
  
  onEdit(): void {
    this.router.navigate(['/fees/structure/edit', this.feeStructureId], {
      queryParams: { returnTab: this.returnTab }
    });
  }
  
  onDelete(): void {
    if (!this.feeStructure) return;
    
    if (confirm(`Are you sure you want to delete this fee structure for Grade ${this.feeStructure.grade}?`)) {
      this.feeService.deleteFeeStructure(this.feeStructure.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Fee structure deleted successfully');
            this.router.navigate(['/fees'], {
              queryParams: { tab: this.returnTab }
            });
          } else {
            const msg = response.message || 'Failed to delete fee structure';
            this.errorHandler.showError(`${msg}. Please contact the support team for assistance.`);
          }
        },
        error: (error) => {
          const backendMsg = (error && (error as any).error?.message) || (error && (error as any).message) || '';
          const msg = backendMsg || 'Failed to delete fee structure';
          this.errorHandler.showError(`${msg}. Please contact the support team for assistance.`);
        }
      });
    }
  }
  
  toggleStatus(): void {
    if (!this.feeStructure) return;
    
    const updatedData = {
      is_active: !this.feeStructure.is_active
    };
    
    this.feeService.updateFeeStructure(this.feeStructure.id!, updatedData).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Status updated successfully');
          this.loadFeeStructure();
        } else {
          this.errorHandler.showError(response.message || 'Failed to update status');
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
      }
    });
  }
  
  getRecurrenceText(): string {
    if (!this.feeStructure?.is_recurring) {
      return 'One-time payment';
    }
    return `${this.feeStructure.recurrence_period || 'N/A'}`;
  }
}

