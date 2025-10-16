import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { BranchService } from '../../services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Branch } from '../../../../core/models/branch.model';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './branch-form.component.html',
  styleUrls: ['./branch-form.component.scss']
})
export class BranchFormComponent implements OnInit {
  branchForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  branchId?: number;
  currentBranch?: Branch;
  
  // Dropdown options
  branchTypes = [
    { value: 'HeadOffice', label: 'Head Office' },
    { value: 'RegionalOffice', label: 'Regional Office' },
    { value: 'School', label: 'School' },
    { value: 'Campus', label: 'Campus' },
    { value: 'SubBranch', label: 'Sub Branch' }
  ];
  
  statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'UnderConstruction', label: 'Under Construction' },
    { value: 'Maintenance', label: 'Maintenance' }
  ];
  
  parentBranches: Branch[] = [];

  constructor(
    private fb: FormBuilder,
    private branchService: BranchService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadParentBranches();
    
    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.branchId = +params['id'];
        this.isEditMode = true;
        this.loadBranch(this.branchId);
      }
    });
  }

  private initForm(): void {
    this.branchForm = this.fb.group({
      // Basic Information
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      branch_type: ['School', Validators.required],
      parent_branch_id: [null],
      
      // Location
      address: ['', [Validators.required, Validators.maxLength(500)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      state: ['', [Validators.required, Validators.maxLength(100)]],
      country: ['India', [Validators.required, Validators.maxLength(100)]],
      region: [''],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      latitude: [null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.min(-180), Validators.max(180)]],
      
      // Contact
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      fax: [''],
      emergency_contact: [''],
      
      // Principal
      principal_name: [''],
      principal_contact: [''],
      principal_email: ['', Validators.email],
      
      // Academic
      board: [''],
      affiliation_number: [''],
      established_date: [null],
      
      // Capacity
      total_capacity: [0, [Validators.min(0)]],
      
      // Features
      is_main_branch: [false],
      is_residential: [false],
      has_hostel: [false],
      has_transport: [false],
      has_library: [false],
      has_lab: [false],
      has_canteen: [false],
      has_sports: [false],
      
      // Status
      status: ['Active'],
      is_active: [true]
    });
  }

  private loadBranch(id: number): void {
    this.isLoading = true;
    
    this.branchService.getBranch(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentBranch = response.data;
          this.branchForm.patchValue(response.data);
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/branches']);
      }
    });
  }

  private loadParentBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.parentBranches = response.data.filter(b => 
            !this.branchId || b.id !== this.branchId
          );
        }
      },
      error: (error) => {
        console.error('Error loading parent branches:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.branchForm.invalid) {
      this.markFormGroupTouched(this.branchForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = this.branchForm.value;

    const request = this.isEditMode && this.branchId
      ? this.branchService.updateBranch(this.branchId, formData)
      : this.branchService.createBranch(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Branch updated successfully' : 'Branch created successfully'
          );
          this.router.navigate(['/branches']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/branches']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.branchForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (control?.hasError('pattern')) {
      return `Invalid ${this.getFieldLabel(fieldName)} format`;
    }
    
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    
    if (control?.hasError('min') || control?.hasError('max')) {
      return `${this.getFieldLabel(fieldName)} is out of range`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'Branch Name',
      code: 'Branch Code',
      branch_type: 'Branch Type',
      address: 'Address',
      city: 'City',
      state: 'State',
      country: 'Country',
      pincode: 'Pincode',
      phone: 'Phone',
      email: 'Email',
      principal_email: 'Principal Email'
    };
    return labels[fieldName] || fieldName;
  }
}

