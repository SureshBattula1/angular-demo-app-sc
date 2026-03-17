import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { startWith, take } from 'rxjs/operators';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AdmissionService, AdmissionApplication } from '../../services/admission.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';
import { AcademicYearService, AcademicYear } from '../../../settings/services/academic-year.service';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-admission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './admission-form.component.html',
  styleUrls: ['./admission-form.component.scss']
})
export class AdmissionFormComponent implements OnInit {
  admissionForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  applicationId?: number;
  currentApplication?: AdmissionApplication;
  
  branches: any[] = [];
  grades: any[] = [];
  sections: Section[] = [];
  /** Section dropdown options – set when sections load so template updates reliably */
  sectionOptionsList: { value: string; label: string }[] = [];
  loadingSections = false;
  /** Academic years for dropdown – loaded from API */
  academicYears: AcademicYear[] = [];
  loadingAcademicYears = false;

  // Form sections visibility
  showParentInfo = true;
  showGuardianInfo = false;
  showPreviousEducation = true;
  showApplicationDetails = true;
  
  // Same as permanent address
  sameAsPermanent = false;
  
  // Static dropdowns
  genders = ['Male', 'Female', 'Other'].map(g => ({ value: g, label: g }));
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ value: bg, label: bg }));
  categories = [
    'General',
    'SC (Scheduled Caste)',
    'ST (Scheduled Tribe)',
    'OBC (Other Backward Class)',
    'EWS (Economically Weaker Section)',
    'Other'
  ].map(c => ({ value: c, label: c }));
  
  applicationStatuses = [
    { value: 'Applied', label: 'Applied' },
    { value: 'Shortlisted', label: 'Shortlisted' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Admitted', label: 'Admitted' },
    { value: 'Waitlisted', label: 'Waitlisted' }
  ];
  
  schoolBoards = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'];

  constructor(
    private fb: FormBuilder,
    private admissionService: AdmissionService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private academicYearContext: AcademicYearContextService,
    private academicYearService: AcademicYearService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadGrades();
    this.loadAcademicYears();
    this.setupSectionLoading();
    this.academicYearContext.selectedYear$.pipe(take(1)).subscribe(y => {
      if (!this.isEditMode && y?.name) this.admissionForm.patchValue({ academic_year: y.name });
    });
    setTimeout(() => {
      this.ensureGradeControlEnabled();
      this.ensureSectionControlEnabled();
    }, 0);
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.applicationId = +params['id'];
        this.isEditMode = true;
        this.loadApplication(this.applicationId);
      }
    });
  }

  private initForm(): void {
    this.admissionForm = this.fb.group({
      // Branch & Academic
      branch_id: [null, Validators.required],
      academic_year: ['', Validators.required], // Manual entry - no default value
      applying_for_grade: ['', Validators.required],
      applying_for_section: ['', Validators.required],
      
      // Student Personal Information
      first_name: ['', [Validators.required, Validators.maxLength(100)]],
      last_name: ['', [Validators.required, Validators.maxLength(100)]],
      date_of_birth: ['', Validators.required],
      gender: ['', Validators.required],
      blood_group: [null],
      religion: [''],
      nationality: ['Indian'],
      category: [null],
      mother_tongue: [''],
      
      // Contact Information
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      alternate_phone: [''],
      
      // Current Address
      current_address: ['', Validators.required],
      current_city: ['', Validators.required],
      current_state: ['', Validators.required],
      current_country: ['India'],
      current_pincode: ['', Validators.required],
      
      // Permanent Address
      permanent_address: [''],
      permanent_city: [''],
      permanent_state: [''],
      permanent_country: ['India'],
      permanent_pincode: [''],
      
      // Father Information
      father_name: ['', Validators.required],
      father_phone: ['', Validators.required],
      father_email: [''],
      father_occupation: [''],
      father_qualification: [''],
      father_annual_income: [null],
      
      // Mother Information
      mother_name: ['', Validators.required],
      mother_phone: [''],
      mother_email: [''],
      mother_occupation: [''],
      mother_qualification: [''],
      mother_annual_income: [null],
      
      // Guardian Information
      guardian_name: [''],
      guardian_relation: [''],
      guardian_phone: [''],
      guardian_email: [''],
      guardian_address: [''],
      
      // Previous Education
      previous_school: [''],
      previous_grade: [''],
      previous_school_board: [''],
      previous_percentage: [null],
      transfer_certificate_number: [''],
      tc_date: [''],
      
      // Application Status
      application_status: ['Applied', Validators.required],
      application_fee_paid: [false],
      application_fee_amount: [null],
      application_fee_payment_date: [''],
      application_fee_receipt_number: [''],
      
      // Entrance Test
      entrance_test_required: [false],
      entrance_test_date: [''],
      entrance_test_score: [null, [Validators.min(0), Validators.max(999.99)]],
      entrance_test_result: [null],
      
      // Interview
      interview_required: [false],
      interview_date: [''],
      interview_score: [null, [Validators.min(0), Validators.max(999.99)]],
      interview_result: [null],
      
      // Admission Decision
      admission_decision: [null],
      admission_decision_date: [''],
      admission_offer_letter: [''],
      admission_validity_date: [''],
      
      // Registration Fee
      registration_fee_paid: [false],
      registration_fee_amount: [null],
      registration_fee_payment_date: [''],
      
      // Admission Confirmation
      admission_confirmed: [false],
      admission_confirmed_date: [''],
      
      remarks: [''],
      same_as_permanent: [false]
    });
  }
  
  onSameAsPermanentChange(event: any): void {
    if (event.checked) {
      const current = this.admissionForm.value;
      this.admissionForm.patchValue({
        permanent_address: current.current_address,
        permanent_city: current.current_city,
        permanent_state: current.current_state,
        permanent_country: current.current_country || 'India',
        permanent_pincode: current.current_pincode
      });
    }
  }

  private loadApplication(id: number): void {
    this.isLoading = true;
    
    this.admissionService.getApplication(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentApplication = response.data;
          this.admissionForm.patchValue(response.data);
          this.loadSectionsForBranchAndGrade();
          this.ensureGradeControlEnabled();
          this.ensureSectionControlEnabled();
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
        this.router.navigate(['/admissions']);
      }
    });
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data || [];
        }
      },
      error: (error) => {
        console.error('Error loading branches:', error);
        this.branches = [];
      }
    });
  }

  private loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data.filter(grade => grade.is_active);
        }
      },
      error: (error) => {
        console.error('Error loading grades:', error);
        this.grades = [];
      }
    });
  }

  private loadAcademicYears(): void {
    this.loadingAcademicYears = true;
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.academicYears = response.data;
        }
        this.loadingAcademicYears = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.academicYears = [];
        this.loadingAcademicYears = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Keep grade control enabled so user can always change grade (e.g. when no sections found for selected grade).
   */
  private ensureGradeControlEnabled(): void {
    const gradeControl = this.admissionForm.get('applying_for_grade');
    if (gradeControl && gradeControl.disabled) {
      gradeControl.enable({ emitEvent: false });
    }
  }

  /**
   * Keep section control enabled so the dropdown is always clickable.
   */
  private ensureSectionControlEnabled(): void {
    const sectionControl = this.admissionForm.get('applying_for_section');
    if (sectionControl && sectionControl.disabled) {
      sectionControl.enable({ emitEvent: false });
    }
  }

  /**
   * Load sections when branch and grade are selected. Reacts to both so section dropdown works when grade is selected.
   */
  private setupSectionLoading(): void {
    const branchControl = this.admissionForm.get('branch_id');
    const gradeControl = this.admissionForm.get('applying_for_grade');
    if (!branchControl || !gradeControl) return;

    combineLatest([
      branchControl.valueChanges.pipe(startWith(branchControl.value)),
      gradeControl.valueChanges.pipe(startWith(gradeControl.value))
    ]).subscribe(([_branch, _grade]) => {
      this.admissionForm.patchValue({ applying_for_section: '' }, { emitEvent: false });
      this.loadingSections = true;
      this.loadSectionsForBranchAndGrade();
      this.ensureGradeControlEnabled();
      this.ensureSectionControlEnabled();
      this.cdr.markForCheck();
    });
  }

  private loadSectionsForBranchAndGrade(): void {
    const branchId = this.admissionForm.get('branch_id')?.value;
    const grade = this.admissionForm.get('applying_for_grade')?.value;
    console.log('[Section] loadSectionsForBranchAndGrade called', { branchId, grade });
    if (grade == null || grade === '' || branchId == null || branchId === '') {
      console.log('[Section] Skipping load – branch or grade missing');
      this.sections = [];
      this.sectionOptionsList = [];
      this.loadingSections = false;
      this.ensureGradeControlEnabled();
      this.ensureSectionControlEnabled();
      this.cdr.markForCheck();
      return;
    }
    console.log('[Section] Loading sections for grade_level=' + grade + ', branch_id=' + branchId);
    const requestedBranchId = branchId;
    const requestedGrade = String(grade);
    this.loadingSections = true;
    this.ensureGradeControlEnabled();
    this.ensureSectionControlEnabled();
    this.sectionService.getSections({
      grade_level: requestedGrade,
      branch_id: requestedBranchId,
      per_page: 100
    }).subscribe({
      next: (response) => {
        const currentBranchId = this.admissionForm.get('branch_id')?.value;
        const currentGrade = this.admissionForm.get('applying_for_grade')?.value;
        if (currentBranchId !== requestedBranchId || String(currentGrade) !== requestedGrade) {
          console.log('[Section] Ignoring stale response (branch/grade changed)', { requested: { requestedBranchId, requestedGrade }, current: { currentBranchId, currentGrade } });
          return;
        }
        const list = Array.isArray(response.data)
          ? response.data
          : (response as any).data?.data;
        if (response.success && Array.isArray(list)) {
          const filtered = list.filter((s: Section) => s.is_active !== false);
          this.sections = [...filtered];
          this.sectionOptionsList = this.sections.map(s => ({
            value: s.name ?? s.code ?? String(s.id),
            label: s.name ?? s.code ?? String(s.id)
          }));
          const copyForConsole = this.sectionOptionsList.map(o => ({ value: o.value, label: o.label }));
          console.log('[Section] Loaded', this.sections.length, 'sections. Options:', JSON.parse(JSON.stringify(copyForConsole)));
        } else {
          this.sections = [];
          this.sectionOptionsList = [];
          console.log('[Section] No sections in response', { success: response.success, hasData: !!response.data, listIsArray: Array.isArray(list) });
        }
        this.loadingSections = false;
        this.ensureGradeControlEnabled();
        this.ensureSectionControlEnabled();
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        const currentBranchId = this.admissionForm.get('branch_id')?.value;
        const currentGrade = this.admissionForm.get('applying_for_grade')?.value;
        if (currentBranchId !== requestedBranchId || String(currentGrade) !== requestedGrade) {
          console.log('[Section] Ignoring stale error (branch/grade changed)');
          return;
        }
        console.log('[Section] Load error', err);
        this.sections = [];
        this.sectionOptionsList = [];
        this.loadingSections = false;
        this.ensureGradeControlEnabled();
        this.ensureSectionControlEnabled();
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  /** Section options for dropdown – use sectionOptionsList so template updates when data loads */
  get sectionOptions(): { value: string; label: string }[] {
    return this.sectionOptionsList;
  }

  onSubmit(): void {
    if (this.admissionForm.invalid) {
      this.markFormGroupTouched(this.admissionForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = { ...this.admissionForm.value };
    
    // Convert empty strings to null for optional fields
    Object.keys(formData).forEach(key => {
      if (formData[key] === '') {
        formData[key] = null;
      }
    });

    const request = this.isEditMode && this.applicationId
      ? this.admissionService.updateApplication(this.applicationId, formData)
      : this.admissionService.createApplication(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode 
              ? 'Admission application updated successfully' 
              : 'Admission application created successfully'
          );
          this.router.navigate(['/admissions']);
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admissions']);
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

  getErrorMessage(controlName: string): string {
    const control = this.admissionForm.get(controlName);
    if (control?.hasError('required')) {
      if (controlName === 'applying_for_section') return 'Section is required';
      return `${controlName.replace(/_/g, ' ')} is required`;
    }
    if (control?.hasError('email')) {
      return 'Invalid email format';
    }
    return '';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Applied': 'primary',
      'Shortlisted': 'accent',
      'Rejected': 'warn',
      'Admitted': 'primary',
      'Waitlisted': 'accent'
    };
    return colors[status] || 'primary';
  }
}

