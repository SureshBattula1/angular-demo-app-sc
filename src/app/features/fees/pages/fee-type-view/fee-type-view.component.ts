import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeTypeService } from '../../services/fee-type.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FeeType } from '../../../../core/models/fee.model';

@Component({
  selector: 'app-fee-type-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './fee-type-view.component.html',
  styleUrls: ['./fee-type-view.component.scss']
})
export class FeeTypeViewComponent implements OnInit {
  loading = false;
  feeType?: FeeType;
  feeTypeId?: string | number;
  returnTab = 'types';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feeTypeService: FeeTypeService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.feeTypeId = params['id'];
        this.loadFeeType();
      }
    });
    
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'] || 'types';
    });
  }
  
  loadFeeType(): void {
    if (!this.feeTypeId) return;
    
    this.loading = true;
    
    this.feeTypeService.getFeeType(this.feeTypeId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.feeType = response.data;
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
    this.router.navigate(['/fees/type/edit', this.feeTypeId], {
      queryParams: { returnTab: this.returnTab }
    });
  }
  
  onDelete(): void {
    if (!this.feeType) return;
    
    if (confirm(`Are you sure you want to delete the fee type "${this.feeType.name}"?`)) {
      this.feeTypeService.deleteFeeType(this.feeType.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Fee type deleted successfully');
            this.router.navigate(['/fees'], {
              queryParams: { tab: this.returnTab }
            });
          } else {
            this.errorHandler.showError(response.message || 'Failed to delete fee type');
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  toggleStatus(): void {
    if (!this.feeType) return;
    
    this.feeTypeService.toggleStatus(this.feeType.id!).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Status updated successfully');
          this.loadFeeType();
        } else {
          this.errorHandler.showError(response.message || 'Failed to update status');
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
      }
    });
  }
}

