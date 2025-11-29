import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AdmissionService, AdmissionApplication } from '../../services/admission.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

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
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadGrades();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.applicationId = +params['id'];
        this.isEditMode = true;
        this.loadApplication(this.applicationId);
      }
    });
  }

  private initForm(): void {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    this.admissionForm = this.fb.group({
      // Branch & Academic
      branch_id: [null, Validators.required],
      academic_year: [`${currentYear}-${nextYear}`, Validators.required],
      applying_for_grade: ['', Validators.required],
      applying_for_section: [null],
      
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
      application_status: ['Applied'],
      application_fee_paid: [false],
      application_fee_amount: [null],
      application_fee_payment_date: [''],
      application_fee_receipt_number: [''],
      
      // Entrance Test
      entrance_test_required: [false],
      entrance_test_date: [''],
      entrance_test_score: [null],
      entrance_test_result: [null],
      
      // Interview
      interview_required: [false],
      interview_date: [''],
      interview_score: [null],
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
      return `${controlName.replace('_', ' ')} is required`;
    }
    if (control?.hasError('email')) {
      return 'Invalid email format';
    }
    return '';
  }
}

