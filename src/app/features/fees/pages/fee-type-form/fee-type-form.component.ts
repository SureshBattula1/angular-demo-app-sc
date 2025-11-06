import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeTypeService } from '../../services/fee-type.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FeeType } from '../../../../core/models/fee.model';

@Component({
  selector: 'app-fee-type-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './fee-type-form.component.html',
  styleUrls: ['./fee-type-form.component.scss']
})
export class FeeTypeFormComponent implements OnInit {
  feeTypeForm!: FormGroup;
  loading = false;
  submitting = false;
  isEditMode = false;
  feeTypeId?: string | number;
  returnTab = 'types';
  
  branches: any[] = [];
  
  constructor(
    private fb: FormBuilder,
    private feeTypeService: FeeTypeService,
    private branchService: BranchService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadBranches();
    
    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.feeTypeId = params['id'];
        this.loadFeeType();
      }
    });
    
    // Get return tab from query params
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'] || 'types';
    });
  }
  
  initializeForm(): void {
    this.feeTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      description: [''],
      branch_id: ['', Validators.required],
      is_mandatory: [true],
      is_refundable: [false],
      is_active: [true]
    });
  }
  
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
      },
      error: (error: any) => {
      }
    });
  }
  
  loadFeeType(): void {
    if (!this.feeTypeId) return;
    
    this.loading = true;
    this.feeTypeService.getFeeType(this.feeTypeId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.feeTypeForm.patchValue(response.data);
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.onCancel();
      }
    });
  }
  
  onSubmit(): void {
    if (this.feeTypeForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      Object.keys(this.feeTypeForm.controls).forEach(key => {
        this.feeTypeForm.controls[key].markAsTouched();
      });
      return;
    }
    
    this.submitting = true;
    const formData = this.feeTypeForm.value;
    
    const request = this.isEditMode
      ? this.feeTypeService.updateFeeType(this.feeTypeId!, formData)
      : this.feeTypeService.createFeeType(formData);
    
    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess(
            `Fee type ${this.isEditMode ? 'updated' : 'created'} successfully`
          );
          this.router.navigate(['/fees'], {
            queryParams: { tab: this.returnTab }
          });
        } else {
          this.errorHandler.showError(response.message || 'Operation failed');
        }
        this.submitting = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.submitting = false;
      }
    });
  }
  
  onCancel(): void {
    this.router.navigate(['/fees'], {
      queryParams: { tab: this.returnTab }
    });
  }
  
  generateCode(): void {
    const name = this.feeTypeForm.get('name')?.value;
    if (name) {
      const code = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 20);
      this.feeTypeForm.patchValue({ code });
    }
  }
}

