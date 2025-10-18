import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { SubjectService } from '../../services/subject.service';
import { BranchService } from '../../../branches/services/branch.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { GradeService } from '../../../grades/services/grade.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Subject } from '../../../../core/models/subject.model';
import { Department } from '../../../../core/models/department.model';
import { Grade } from '../../../../core/models/grade.model';
import { Teacher } from '../../../../core/models/teacher.model';

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './subject-form.component.html',
  styleUrls: ['./subject-form.component.scss']
})
export class SubjectFormComponent implements OnInit {
  subjectForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  subjectId?: number;
  currentSubject?: Subject;
  
  branches: any[] = [];
  departments: Department[] = [];
  teachers: Teacher[] = [];
  grades: Grade[] = [];
  
  loadingBranches = false;
  loadingDepartments = false;
  loadingTeachers = false;
  loadingGrades = false;
  
  subjectTypes = [
    { value: 'Core', label: 'Core', icon: 'star' },
    { value: 'Elective', label: 'Elective', icon: 'check_box' },
    { value: 'Language', label: 'Language', icon: 'language' },
    { value: 'Lab', label: 'Lab', icon: 'science' },
    { value: 'Activity', label: 'Activity', icon: 'sports' }
  ];

  constructor(
    private fb: FormBuilder,
    private subjectService: SubjectService,
    private branchService: BranchService,
    private departmentService: DepartmentService,
    private gradeService: GradeService,
    private teacherService: TeacherService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadDepartments();
    this.loadGrades();
    this.loadTeachers();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.subjectId = +params['id'];
        this.isEditMode = true;
        this.loadSubject(this.subjectId);
      }
    });
  }

  private initForm(): void {
    this.subjectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      department_id: [null, Validators.required],
      grade_level: ['', Validators.required],
      type: ['Core', Validators.required],
      branch_id: [null, Validators.required],
      teacher_id: [null],
      credits: [0, [Validators.min(0), Validators.max(10)]],
      description: [''],
      is_active: [true]
    });
  }

  private loadSubject(id: number): void {
    this.isLoading = true;
    
    this.subjectService.getSubject(id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.currentSubject = response.data;
          this.subjectForm.patchValue(response.data);
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/subjects']);
      }
    });
  }

  private loadBranches(): void {
    this.loadingBranches = true;
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
          console.log('Branches loaded:', this.branches.length);
        }
        this.loadingBranches = false;
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
        this.errorHandler.showError('Failed to load branches');
        this.loadingBranches = false;
      }
    });
  }

  private loadDepartments(): void {
    this.loadingDepartments = true;
    console.log('Loading departments from API...');
    
    this.departmentService.getDepartments({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.departments = response.data;
          console.log('Departments loaded:', this.departments.length);
        }
        this.loadingDepartments = false;
      },
      error: (error: any) => {
        console.error('Error loading departments:', error);
        this.errorHandler.showError('Failed to load departments');
        this.loadingDepartments = false;
      }
    });
  }

  private loadGrades(): void {
    this.loadingGrades = true;
    console.log('Loading grades from API...');
    
    this.gradeService.getGrades().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.grades = response.data.filter((grade: Grade) => grade.is_active);
          console.log('Grades loaded:', this.grades.length);
        }
        this.loadingGrades = false;
      },
      error: (error: any) => {
        console.error('Error loading grades:', error);
        this.errorHandler.showError('Failed to load grades');
        this.loadingGrades = false;
      }
    });
  }

  private loadTeachers(): void {
    this.loadingTeachers = true;
    console.log('Loading teachers from API...');
    
    this.teacherService.getTeachers({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.teachers = response.data;
          console.log('Teachers loaded:', this.teachers.length);
        }
        this.loadingTeachers = false;
      },
      error: (error: any) => {
        console.error('Error loading teachers:', error);
        this.errorHandler.showError('Failed to load teachers');
        this.loadingTeachers = false;
      }
    });
  }

  onSubmit(): void {
    if (this.subjectForm.invalid) {
      this.markFormGroupTouched(this.subjectForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = this.subjectForm.value;

    const request = this.isEditMode && this.subjectId
      ? this.subjectService.updateSubject(this.subjectId, formData)
      : this.subjectService.createSubject(formData);

    request.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Subject updated successfully' : 'Subject created successfully'
          );
          this.router.navigate(['/subjects']);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/subjects']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.subjectForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['min'].min}`;
    }
    
    if (control?.hasError('max')) {
      return `${this.getFieldLabel(fieldName)} cannot exceed ${control.errors?.['max'].max}`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      branch_id: 'Branch',
      name: 'Subject Name',
      code: 'Subject Code',
      grade_level: 'Grade Level',
      capacity: 'Capacity',
      room_number: 'Room Number'
    };
    return labels[fieldName] || fieldName;
  }
}

