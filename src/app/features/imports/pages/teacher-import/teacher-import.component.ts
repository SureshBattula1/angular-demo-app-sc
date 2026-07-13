import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ImportService } from '../../services/import.service';
import { ApiService } from '../../../../core/services/api.service';
import { ImportContext, ImportRecord, ValidationResult } from '../../../../core/models/import.model';

@Component({
  selector: 'app-teacher-import',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  templateUrl: './teacher-import.component.html',
  styleUrls: ['./teacher-import.component.scss']
})
export class TeacherImportComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  contextForm!: FormGroup;
  uploadForm!: FormGroup;

  branches: any[] = [];
  selectedFile: File | null = null;
  currentBatchId: string | null = null;
  
  // Stepper state
  isUploading = false;
  isValidating = false;
  isImporting = false;

  // Validation results
  validationResult: ValidationResult | null = null;
  previewData: ImportRecord[] = [];
  previewSummary: any = null;
  currentPage = 1;
  pageSize = 1000; // show all rows of the batch in one scrollable view
  totalRecords = 0;
  selectedTab = 0;

  // All review columns with required flag (required mirrors the API/Excel validation).
  // Rendered dynamically so the review shows every field; required headers get a red *.
  previewColumns: { key: string; label: string; required?: boolean }[] = [
    { key: 'row_number', label: '#' },
    { key: 'first_name', label: 'First Name', required: true },
    { key: 'last_name', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone' },
    { key: 'employee_id', label: 'Employee ID', required: true },
    { key: 'joining_date', label: 'Joining Date', required: true },
    { key: 'designation', label: 'Designation', required: true },
    { key: 'employee_type', label: 'Employee Type', required: true },
    { key: 'qualification', label: 'Qualification' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'subjects', label: 'Subjects' },
    { key: 'date_of_birth', label: 'Date of Birth', required: true },
    { key: 'gender', label: 'Gender', required: true },
    { key: 'current_address', label: 'Address', required: true },
    { key: 'basic_salary', label: 'Basic Salary', required: true },
    { key: 'status', label: 'Status' },
    { key: 'errors', label: 'Errors' },
  ];

  displayedColumns: string[] = this.previewColumns.map(c => c.key);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private importService: ImportService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  initializeForms(): void {
    this.contextForm = this.fb.group({
      branch_id: ['', Validators.required]
    });

    this.uploadForm = this.fb.group({
      file: [null, Validators.required]
    });
  }

  loadBranches(): void {
    this.apiService.get('/branches/accessible').subscribe({
      next: (response: any) => {
        this.branches = response.data || response;
        
        // Auto-select branch for restricted users
        if (response.can_select_branch === false && response.user_branch_id) {
          this.contextForm.patchValue({ branch_id: response.user_branch_id });
        }
      },
      error: (err) => {
        this.showError('Failed to load branches');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadForm.patchValue({ file: this.selectedFile });
    }
  }

  downloadTemplate(): void {
    this.importService.downloadTemplate('teacher').subscribe({
      next: (blob) => {
        this.importService.downloadBlob(blob, `teacher_import_template_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showSuccess('Template downloaded successfully');
      },
      error: (err) => {
        this.showError('Failed to download template');
      }
    });
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.contextForm.valid) {
      this.showError('Please select a file and branch');
      return;
    }

    this.isUploading = true;
    const context: ImportContext = {
      branch_id: this.contextForm.get('branch_id')?.value
    };

    this.importService.uploadFile('teacher', this.selectedFile, context).subscribe({
      next: (response) => {
        this.currentBatchId = response.batch_id;
        this.isUploading = false;
        this.showSuccess('File uploaded successfully - validating...');
        
        // 🔥 Auto-advance to next step
        setTimeout(() => {
          if (this.stepper) {
            this.stepper.next();
          }
        }, 500);
        
        this.validateImport();
      },
      error: (err) => {
        this.isUploading = false;
        this.showError('File upload failed');
      }
    });
  }

  validateImport(): void {
    if (!this.currentBatchId) return;

    this.isValidating = true;

    this.importService.validateImport('teacher', this.currentBatchId).subscribe({
      next: (result) => {
        this.validationResult = result;
        this.isValidating = false;
        this.showSuccess(`Validation completed: ${result.valid_rows} valid, ${result.invalid_rows} invalid`);
        
        this.loadPreview();
      },
      error: (err) => {
        this.isValidating = false;
        this.showError('Validation failed');
      }
    });
  }

  loadPreview(page: number = 1, status?: 'valid' | 'invalid' | 'all'): void {
    if (!this.currentBatchId) return;

    this.importService.getPreview('teacher', this.currentBatchId, page, this.pageSize, status).subscribe({
      next: (preview) => {
        this.previewData = preview.data;
        this.previewSummary = preview.summary;
        this.totalRecords = preview.meta.total;
        this.currentPage = preview.meta.current_page;
      },
      error: (err) => {
        this.showError('Failed to load preview');
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    let status: 'valid' | 'invalid' | 'all' | undefined = undefined;
    
    if (index === 1) status = 'valid';
    if (index === 2) status = 'invalid';
    
    // Clear previous data before loading new
    this.previewData = [];
    
    this.loadPreview(1, status);
  }

  onPageChange(event: any): void {
    // Preserve the current status filter when paginating
    let status: 'valid' | 'invalid' | 'all' | undefined = undefined;
    if (this.selectedTab === 1) status = 'valid';
    if (this.selectedTab === 2) status = 'invalid';
    
    this.loadPreview(event.pageIndex + 1, status);
  }

  commitImport(): void {
    if (!this.currentBatchId) return;

    this.isImporting = true;

    this.importService.commitImport('teacher', this.currentBatchId, { skip_invalid: true }).subscribe({
      next: (result) => {
        this.isImporting = false;
        this.showSuccess(`Successfully imported ${result.imported_count} teachers`);
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (err) => {
        this.isImporting = false;
        this.showError('Import failed');
      }
    });
  }

  cancelImport(): void {
    if (!this.currentBatchId) {
      this.router.navigate(['/imports']);
      return;
    }

    if (confirm('Are you sure you want to cancel this import?')) {
      this.importService.cancelImport('teacher', this.currentBatchId).subscribe({
        next: () => {
          this.showSuccess('Import cancelled');
          this.router.navigate(['/imports']);
        },
        error: (err) => {
          this.showError('Failed to cancel import');
        }
      });
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
