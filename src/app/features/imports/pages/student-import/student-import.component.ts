import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
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
  contextForm!: FormGroup;
  uploadForm!: FormGroup;

  branches: any[] = [];
  grades: any[] = [];
  sections: any[] = [];
  academicYears: string[] = [];

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
  pageSize = 25;
  totalRecords = 0;
  selectedTab = 0; // 0: All, 1: Valid, 2: Invalid

  displayedColumns: string[] = ['row_number', 'first_name', 'last_name', 'email', 'admission_number', 'grade', 'section', 'status', 'errors'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private importService: ImportService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
    this.generateAcademicYears();
  }

  ngOnInit(): void {
    this.loadBranches();
    this.loadGrades();
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

  generateAcademicYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = -1; i <= 1; i++) {
      const year = currentYear + i;
      this.academicYears.push(`${year}-${year + 1}`);
    }
  }

  loadBranches(): void {
    this.apiService.get('/branches').subscribe({
      next: (response: any) => {
        this.branches = response.data || response;
      },
      error: (err) => {
        this.showError('Failed to load branches');
        console.error('Error loading branches:', err);
      }
    });
  }

  loadGrades(): void {
    this.apiService.get('/grades').subscribe({
      next: (response: any) => {
        this.grades = response.data || response;
      },
      error: (err) => {
        this.showError('Failed to load grades');
        console.error('Error loading grades:', err);
      }
    });
  }

  onBranchChange(): void {
    const branchId = this.contextForm.get('branch_id')?.value;
    if (branchId) {
      this.loadSections(branchId);
    }
  }

  loadSections(branchId: number): void {
    this.apiService.get(`/sections?branch_id=${branchId}`).subscribe({
      next: (response: any) => {
        this.sections = response.data || response;
      },
      error: (err) => {
        this.showError('Failed to load sections');
        console.error('Error loading sections:', err);
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
        console.error('Error downloading template:', err);
      }
    });
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.contextForm.valid) {
      this.showError('Please select a file and fill all required context fields');
      return;
    }

    this.isUploading = true;
    const context: ImportContext = this.contextForm.value;

    this.importService.uploadFile('student', this.selectedFile, context).subscribe({
      next: (response) => {
        this.currentBatchId = response.batch_id;
        this.isUploading = false;
        this.showSuccess('File uploaded successfully');
        this.validateImport();
      },
      error: (err) => {
        this.isUploading = false;
        this.showError('File upload failed');
        console.error('Upload error:', err);
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
      },
      error: (err) => {
        this.isValidating = false;
        this.showError('Validation failed');
        console.error('Validation error:', err);
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
      },
      error: (err) => {
        this.showError('Failed to load preview');
        console.error('Preview error:', err);
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    let status: 'valid' | 'invalid' | 'all' | undefined = undefined;
    
    if (index === 1) status = 'valid';
    if (index === 2) status = 'invalid';
    
    this.loadPreview(1, status);
  }

  onPageChange(event: any): void {
    this.loadPreview(event.pageIndex + 1);
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
        console.error('Import error:', err);
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
          console.error('Cancel error:', err);
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

