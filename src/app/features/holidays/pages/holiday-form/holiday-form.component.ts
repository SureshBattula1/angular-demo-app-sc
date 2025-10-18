import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HolidayService } from '../../services/holiday.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ApiService } from '../../../../core/services/api.service';
import { Holiday, HolidayFormData } from '../../../../core/models/holiday.model';

@Component({
  selector: 'app-holiday-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './holiday-form.component.html',
  styleUrls: ['./holiday-form.component.scss']
})
export class HolidayFormComponent implements OnInit {
  holidayForm!: FormGroup;
  isEditMode = false;
  holidayId: number | null = null;
  loading = false;
  submitting = false;
  branches: any[] = [];
  loadingBranches = false;

  holidayTypes = [
    { value: 'National', label: 'National Holiday', color: '#FF5733' },
    { value: 'State', label: 'State Holiday', color: '#FFA500' },
    { value: 'School', label: 'School Holiday', color: '#3498DB' },
    { value: 'Optional', label: 'Optional Holiday', color: '#9B59B6' },
    { value: 'Restricted', label: 'Restricted Holiday', color: '#95A5A6' }
  ];

  constructor(
    private fb: FormBuilder,
    private holidayService: HolidayService,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();

    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.holidayId = +params['id'];
        this.isEditMode = true;
        this.loadHoliday();
      }
    });

    // Pre-fill date from query params (from calendar click)
    this.route.queryParams.subscribe(params => {
      if (params['date'] && !this.isEditMode) {
        this.holidayForm.patchValue({
          start_date: new Date(params['date']),
          end_date: new Date(params['date'])
        });
      }
    });
  }

  /**
   * Initialize form
   */
  initForm(): void {
    const user = this.authService.currentUser();
    
    this.holidayForm = this.fb.group({
      branch_id: [null],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      type: ['School', Validators.required],
      color: ['#3498DB'],
      is_recurring: [false],
      academic_year: [this.getCurrentAcademicYear()],
      is_active: [true]
    });

    // Branch admin can only create for their branch
    if (user?.role === 'BranchAdmin') {
      this.holidayForm.patchValue({ branch_id: user.branch_id });
      this.holidayForm.get('branch_id')?.disable();
    }

    // Auto-update color when type changes
    this.holidayForm.get('type')?.valueChanges.subscribe(type => {
      const selected = this.holidayTypes.find(t => t.value === type);
      if (selected) {
        this.holidayForm.patchValue({ color: selected.color }, { emitEvent: false });
      }
    });
  }

  /**
   * Load branches
   */
  loadBranches(): void {
    this.loadingBranches = true;
    this.apiService.get('/branches').subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
        this.loadingBranches = false;
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
        this.loadingBranches = false;
      }
    });
  }

  /**
   * Load holiday for editing
   */
  loadHoliday(): void {
    if (!this.holidayId) return;
    
    this.loading = true;
    this.holidayService.getHoliday(this.holidayId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const holiday = response.data;
          this.holidayForm.patchValue({
            branch_id: holiday.branch_id,
            title: holiday.title,
            description: holiday.description,
            start_date: new Date(holiday.start_date),
            end_date: new Date(holiday.end_date),
            type: holiday.type,
            color: holiday.color,
            is_recurring: holiday.is_recurring,
            academic_year: holiday.academic_year,
            is_active: holiday.is_active
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading holiday:', error);
        this.errorHandler.showError('Failed to load holiday');
        this.loading = false;
      }
    });
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.holidayForm.invalid) {
      this.errorHandler.showError('Please fill all required fields');
      return;
    }

    this.submitting = true;
    const formData = this.prepareFormData();

    const request = this.isEditMode && this.holidayId
      ? this.holidayService.updateHoliday(this.holidayId, formData)
      : this.holidayService.createHoliday(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          const message = this.isEditMode 
            ? 'Holiday updated successfully'
            : 'Holiday created successfully';
          this.errorHandler.showSuccess(message);
          this.router.navigate(['/holidays/calendar']);
        }
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error saving holiday:', error);
        this.errorHandler.showError('Failed to save holiday');
        this.submitting = false;
      }
    });
  }

  /**
   * Prepare form data for submission
   */
  prepareFormData(): HolidayFormData {
    const formValue = this.holidayForm.getRawValue();
    
    return {
      branch_id: formValue.branch_id || null,
      title: formValue.title,
      description: formValue.description || '',
      start_date: this.formatDate(formValue.start_date),
      end_date: this.formatDate(formValue.end_date),
      type: formValue.type,
      color: formValue.color,
      is_recurring: formValue.is_recurring || false,
      academic_year: formValue.academic_year,
      is_active: formValue.is_active
    };
  }

  /**
   * Format date for API
   */
  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get current academic year
   */
  getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    return month < 4 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
  }

  /**
   * Get duration in days
   */
  getDuration(): number {
    const start = this.holidayForm.get('start_date')?.value;
    const end = this.holidayForm.get('end_date')?.value;
    
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    
    return 0;
  }

  /**
   * Cancel and go back
   */
  onCancel(): void {
    this.router.navigate(['/holidays/calendar']);
  }

  /**
   * Get error message for form field
   */
  getErrorMessage(field: string): string {
    const control = this.holidayForm.get(field);
    
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    
    if (control?.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength} characters`;
    }
    
    return '';
  }

  /**
   * Check if user can access this form
   */
  canCreate(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'SuperAdmin' || user?.role === 'BranchAdmin';
  }
}

