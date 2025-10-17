import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { StudentCrudService } from '../../services/student-crud.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Student } from '../../../../core/models/student.model';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss']
})
export class StudentFormComponent implements OnInit {
  studentForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  studentId?: number;
  currentStudent?: Student;
  
  branches: any[] = [];
  grades = Array.from({length: 12}, (_, i) => ({ value: `${i + 1}`, label: `Grade ${i + 1}` }));
  sections = ['A', 'B', 'C', 'D', 'E', 'F'].map(s => ({ value: s, label: `Section ${s}` }));
  genders = ['Male', 'Female', 'Other'].map(g => ({ value: g, label: g }));
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ value: bg, label: bg }));
  categories = ['General', 'SC', 'ST', 'OBC', 'Other'].map(c => ({ value: c, label: c }));

  constructor(
    private fb: FormBuilder,
    private studentCrudService: StudentCrudService,
    private branchService: BranchService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.studentId = +params['id'];
        this.isEditMode = true;
        this.loadStudent(this.studentId);
      }
    });
  }

  private initForm(): void {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    this.studentForm = this.fb.group({
      // User Details
      first_name: ['', [Validators.required, Validators.maxLength(255)]],
      last_name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      
      // Admission
      branch_id: [null, Validators.required],
      admission_number: ['', Validators.required],
      admission_date: ['', Validators.required],
      roll_number: [''],
      
      // Academic
      grade: ['', Validators.required],
      section: [null],
      academic_year: [`${currentYear}-${nextYear}`, Validators.required],
      stream: [null],
      
      // Personal
      date_of_birth: ['', Validators.required],
      gender: ['', Validators.required],
      blood_group: [null],
      religion: [''],
      category: [null],
      
      // Address
      current_address: ['', Validators.required],
      permanent_address: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['India'],
      pincode: ['', Validators.required],
      
      // Father
      father_name: ['', Validators.required],
      father_phone: ['', Validators.required],
      father_email: [''],
      father_occupation: [''],
      
      // Mother
      mother_name: ['', Validators.required],
      mother_phone: [''],
      mother_email: [''],
      mother_occupation: [''],
      
      // Guardian (if different)
      guardian_name: [''],
      guardian_phone: [''],
      
      // Emergency
      emergency_contact_name: ['', Validators.required],
      emergency_contact_phone: ['', Validators.required],
      emergency_contact_relation: [''],
      
      // Previous Education
      previous_school: [''],
      previous_grade: [''],
      
      // Medical
      medical_history: [''],
      allergies: [''],
      
      remarks: ['']
    });
  }

  private loadStudent(id: number): void {
    this.isLoading = true;
    
    this.studentCrudService.getStudent(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentStudent = response.data;
          this.studentForm.patchValue(response.data);
          // Remove password requirement for edit
          this.studentForm.get('password')?.clearValidators();
          this.studentForm.get('password')?.updateValueAndValidity();
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/students']);
      }
    });
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.studentForm.invalid) {
      this.markFormGroupTouched(this.studentForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = { ...this.studentForm.value };
    
    // Remove password if empty in edit mode
    if (this.isEditMode && !formData.password) {
      delete formData.password;
    }

    const request = this.isEditMode && this.studentId
      ? this.studentCrudService.updateStudent(this.studentId, formData)
      : this.studentCrudService.createStudent(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Student updated successfully' : 'Student created successfully'
          );
          this.router.navigate(['/students']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/students']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.studentForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      first_name: 'First Name',
      last_name: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      password: 'Password',
      branch_id: 'Branch',
      admission_number: 'Admission Number',
      admission_date: 'Admission Date',
      grade: 'Grade',
      date_of_birth: 'Date of Birth',
      gender: 'Gender',
      current_address: 'Current Address',
      city: 'City',
      state: 'State',
      pincode: 'PIN Code',
      father_name: 'Father Name',
      father_phone: 'Father Phone',
      mother_name: 'Mother Name',
      emergency_contact_name: 'Emergency Contact Name',
      emergency_contact_phone: 'Emergency Contact Phone',
      academic_year: 'Academic Year'
    };
    return labels[fieldName] || fieldName;
  }
}

