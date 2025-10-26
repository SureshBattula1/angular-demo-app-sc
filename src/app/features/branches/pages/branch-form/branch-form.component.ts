import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { UniversalAttachmentsComponent } from '../../../../shared/components/universal-attachments/universal-attachments.component';
import { BranchService } from '../../services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';
import { Branch } from '../../../../core/models/branch.model';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FileUploadComponent, UniversalAttachmentsComponent],
  templateUrl: './branch-form.component.html',
  styleUrls: ['./branch-form.component.scss']
})
export class BranchFormComponent implements OnInit {
  @ViewChild(UniversalAttachmentsComponent) attachmentsComponent!: UniversalAttachmentsComponent;
  branchForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  branchId?: number;
  currentBranch?: Branch;
  logoUrl?: string;
  
  // For attachments - will be set after branch is created/updated
  attachmentModuleId: number | null = null;
  
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
    private errorHandler: ErrorHandlerService,
    private fileUploadService: FileUploadService
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
      is_active: [true],
      
      // Logo
      logo: ['']
    });
  }

  private loadBranch(id: number): void {
    this.isLoading = true;
    
    this.branchService.getBranch(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentBranch = response.data;
          this.branchForm.patchValue(response.data);
          this.logoUrl = response.data.logo; // Set logo URL if exists
          this.attachmentModuleId = id; // Set module ID for attachments
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

  onLogoUploaded(event: any): void {
    this.logoUrl = event.file_path;
    this.branchForm.patchValue({ logo: event.file_path });
    this.errorHandler.showSuccess('Logo uploaded successfully');
  }

  onLogoUploadError(error: string): void {
    this.errorHandler.showError(error);
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
          // Set attachment module ID after branch is created/updated
          if (!this.isEditMode && response.data?.id) {
            this.attachmentModuleId = response.data.id;
          } else if (this.branchId) {
            this.attachmentModuleId = this.branchId;
          }
          
          // Upload any pending attachments
          setTimeout(() => {
            this.attachmentsComponent?.uploadPendingAttachments();
          }, 500);
          
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

