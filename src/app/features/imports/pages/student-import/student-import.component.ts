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
import { GradeService } from '../../../grades/services/grade.service';
import { AcademicYearService, AcademicYear } from '../../../settings/services/academic-year.service';

@Component({
  selector: 'app-student-import',
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
  templateUrl: './student-import.component.html',
  styleUrls: ['./student-import.component.scss']
})
export class StudentImportComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  
  contextForm!: FormGroup;
  uploadForm!: FormGroup;

  branches: any[] = [];
  grades: any[] = [];
  sections: any[] = [];
  academicYears: AcademicYear[] = [];

  loadingGrades = false;
  loadingSections = false;
  loadingAcademicYears = false;

  selectedFile: File | null = null;
  currentBatchId: string | null = null;
  
  // Stepper state
  isContextLoading = false;
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
  selectedTab = 0; // 0: All, 1: Valid, 2: Invalid

  // All review columns with required flag (required mirrors the API/Excel validation).
  // Rendered dynamically so the review shows every field; required headers get a red *.
  previewColumns: { key: string; label: string; required?: boolean }[] = [
    { key: 'row_number', label: '#' },
    { key: 'first_name', label: 'First Name', required: true },
    { key: 'last_name', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone' },
    { key: 'admission_number', label: 'Admission No.', required: true },
    { key: 'admission_date', label: 'Admission Date', required: true },
    { key: 'roll_number', label: 'Roll No.' },
    { key: 'grade', label: 'Grade', required: true },
    { key: 'section', label: 'Section' },
    { key: 'date_of_birth', label: 'Date of Birth', required: true },
    { key: 'gender', label: 'Gender', required: true },
    { key: 'blood_group', label: 'Blood Group' },
    { key: 'category', label: 'Category' },
    { key: 'current_address', label: 'Address', required: true },
    { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State', required: true },
    { key: 'pincode', label: 'Pincode', required: true },
    { key: 'father_name', label: 'Father Name', required: true },
    { key: 'father_phone', label: 'Father Phone', required: true },
    { key: 'father_qualification', label: 'Father Qualification' },
    { key: 'mother_name', label: 'Mother Name', required: true },
    { key: 'mother_phone', label: 'Mother Phone' },
    { key: 'mother_qualification', label: 'Mother Qualification' },
    { key: 'guardian_name', label: 'Guardian Name' },
    { key: 'emergency_contact_name', label: 'Emergency Name', required: true },
    { key: 'emergency_contact_phone', label: 'Emergency Phone', required: true },
    { key: 'status', label: 'Status' },
    { key: 'errors', label: 'Errors' },
  ];

  displayedColumns: string[] = this.previewColumns.map(c => c.key);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private importService: ImportService,
    private apiService: ApiService,
    private gradeService: GradeService,
    private academicYearService: AcademicYearService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadBranches();
    this.loadAcademicYears();
    this.setupDynamicSectionLoading();
  }

  initializeForms(): void {
    this.contextForm = this.fb.group({
      branch_id: ['', Validators.required],
      grade: ['', Validators.required],
      section: [''],
      academic_year: ['', Validators.required]
    });

    this.uploadForm = this.fb.group({
      file: [null, Validators.required]
    });
  }

  /**
   * Setup listeners: branch -> grades, branch+grade -> sections
   */
  setupDynamicSectionLoading(): void {
    // Listen to branch changes: load grades for branch, clear grade/section
    this.contextForm.get('branch_id')?.valueChanges.subscribe(branchId => {
      if (branchId) {
        this.loadGradesForBranch(branchId);
        this.contextForm.patchValue({ grade: '', section: '' }, { emitEvent: false });
        this.grades = [];
        this.sections = [];
      } else {
        this.grades = [];
        this.sections = [];
      }
    });

    // Listen to grade changes: load sections for branch+grade
    this.contextForm.get('grade')?.valueChanges.subscribe(grade => {
      if (grade) {
        const branchId = this.contextForm.get('branch_id')?.value;
        if (branchId) {
          this.loadSections(branchId, grade);
          this.contextForm.patchValue({ section: '' }, { emitEvent: false });
        }
      } else {
        this.sections = [];
      }
    });
  }

  loadAcademicYears(): void {
    this.loadingAcademicYears = true;
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response) => {
        this.loadingAcademicYears = false;
        if (response.success && response.data) {
          this.academicYears = response.data;
          const current = this.academicYears.find(y => y.is_current) ?? this.academicYears.find(y => y.is_active);
          if (current && !this.contextForm.get('academic_year')?.value) {
            this.contextForm.patchValue({ academic_year: current.name }, { emitEvent: false });
          }
        }
      },
      error: () => {
        this.loadingAcademicYears = false;
        this.academicYears = [];
      }
    });
  }

  loadBranches(): void {
    // 🔥 Use /accessible endpoint to respect branch-level access
    this.apiService.get('/branches/accessible').subscribe({
      next: (response: any) => {
        this.branches = response.data || response;
        
        // 🔥 Auto-select branch if user has only one branch
        if (response.can_select_branch === false && response.user_branch_id) {
          this.contextForm.patchValue({ branch_id: response.user_branch_id });
        }
      },
      error: (err) => {
        this.showError('Failed to load branches');
      }
    });
  }

  loadGradesForBranch(branchId: number): void {
    this.loadingGrades = true;
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response) => {
        this.loadingGrades = false;
        if (response.success && response.data) {
          this.grades = response.data.filter((g: any) => g.is_active);
        } else {
          this.grades = [];
        }
      },
      error: () => {
        this.loadingGrades = false;
        this.grades = [];
        this.showError('Failed to load grades');
      }
    });
  }

  /**
   * Load sections filtered by branch and grade
   */
  loadSections(branchId: number, grade: string): void {
    this.loadingSections = true;
    const url = `/sections?branch_id=${branchId}&grade_level=${grade}`;
    this.apiService.get(url).subscribe({
      next: (response: any) => {
        this.loadingSections = false;
        this.sections = response.data?.data || response.data || response;
      },
      error: () => {
        this.loadingSections = false;
        this.sections = [];
        this.showError('Failed to load sections');
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
    this.importService.downloadTemplate('student').subscribe({
      next: (blob) => {
        this.importService.downloadBlob(blob, `student_import_template_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showSuccess('Template downloaded successfully');
      },
      error: (err) => {
        this.showError('Failed to download template');
      }
    });
  }

  uploadFile(): void {
    // Validate file is selected
    if (!this.selectedFile) {
      this.showError('Please select a file');
      return;
    }

    // Validate context form
    if (!this.contextForm.valid) {
      this.showError('Please fill all required context fields: Branch, Grade, and Academic Year');
      
      // Mark all fields as touched to show errors
      Object.keys(this.contextForm.controls).forEach(key => {
        this.contextForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isUploading = true;
    const context: ImportContext = this.contextForm.value;

    this.importService.uploadFile('student', this.selectedFile, context).subscribe({
      next: (response) => {
        this.currentBatchId = response.batch_id;
        this.isUploading = false;
        this.showSuccess('File uploaded successfully - validating...');
        
        // 🔥 Move to next step (validation)
        setTimeout(() => {
          if (this.stepper) {
            this.stepper.next();
          }
        }, 500);
        
        this.validateImport();
      },
      error: (err) => {
        this.isUploading = false;
        
        // 🔥 Detailed error logging
        
        // Show detailed error message
        let errorMsg = 'File upload failed';
        if (err.error?.errors) {
          // Laravel validation errors
          const errors = Object.values(err.error.errors).flat();
          errorMsg = errors.join(', ');
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        
        this.showError(errorMsg);
      }
    });
  }

  validateImport(): void {
    if (!this.currentBatchId) return;

    this.isValidating = true;

    this.importService.validateImport('student', this.currentBatchId).subscribe({
      next: (result) => {
        this.validationResult = result;
        this.isValidating = false;
        this.showSuccess(`Validation completed: ${result.valid_rows} valid, ${result.invalid_rows} invalid`);
        this.loadPreview();
        
        // 🔥 Already on validation step, no need to move
      },
      error: (err) => {
        this.isValidating = false;
        this.showError('Validation failed');
      }
    });
  }

  loadPreview(page: number = 1, status?: 'valid' | 'invalid' | 'all'): void {
    if (!this.currentBatchId) return;


    this.importService.getPreview('student', this.currentBatchId, page, this.pageSize, status).subscribe({
      next: (preview) => {
        this.previewData = preview.data;
        this.previewSummary = preview.summary;
        this.totalRecords = preview.meta.total;
        this.currentPage = preview.meta.current_page;
        
        // 🔥 Debug logging
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
    
    // 🔥 Debug logging
    
    // 🔥 Clear previous data before loading new
    this.previewData = [];
    
    this.loadPreview(1, status);
  }

  onPageChange(event: any): void {
    // 🔥 Preserve the current status filter when paginating
    let status: 'valid' | 'invalid' | 'all' | undefined = undefined;
    if (this.selectedTab === 1) status = 'valid';
    if (this.selectedTab === 2) status = 'invalid';
    
    this.loadPreview(event.pageIndex + 1, status);
  }

  commitImport(): void {
    if (!this.currentBatchId) return;

    this.isImporting = true;

    this.importService.commitImport('student', this.currentBatchId, { skip_invalid: true }).subscribe({
      next: (result) => {
        this.isImporting = false;
        this.showSuccess(`Successfully imported ${result.imported_count} students`);
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
      this.importService.cancelImport('student', this.currentBatchId).subscribe({
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


