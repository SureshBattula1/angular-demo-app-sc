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
  subjectId?: string;
  currentSubject?: Subject;
  returnTab?: string;
  
  branches: any[] = [];
  departments: Department[] = [];
  teachers: Teacher[] = [];
  grades: Grade[] = [];
  
  loadingBranches = false;
  loadingDepartments = false;
  loadingTeachers = false;
  loadingGrades = false;
  
  private selectedBranchId: string | number | null = null;

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
    this.loadTeachers();
    this.setupBranchDependentDropdowns();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.subjectId = params['id'];
        this.isEditMode = true;
        this.loadSubject(this.subjectId!);
      }
    });
    
    // Capture returnTab from query parameters
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'];
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

  private loadSubject(id: string | number): void {
    this.isLoading = true;
    
    this.subjectService.getSubject(id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.currentSubject = response.data;
          // Patch without triggering branch change handlers; hydrate dropdowns first.
          this.subjectForm.patchValue(response.data, { emitEvent: false });

          // branch_id is an opaque hashid string when HASHIDS_ENABLED is on; never Number() it (→ NaN).
          const branchId = (response.data as any).branch_id ?? null;
          this.selectedBranchId = branchId;
          if (branchId) {
            this.loadDepartmentsForBranch(branchId, () => {
              this.subjectForm.patchValue({ department_id: (response.data as any).department_id ?? null }, { emitEvent: false });
            });
            this.loadGradesForBranch(branchId, () => {
              this.subjectForm.patchValue({ grade_level: (response.data as any).grade_level ?? '' }, { emitEvent: false });
            });
            this.loadTeachersForBranch(branchId, () => {
              const teacherId =
                (response.data as any).teacher_id ??
                (response.data as any).teacher?.id ??
                null;
              this.subjectForm.patchValue({ teacher_id: teacherId }, { emitEvent: false });
            });
          } else {
            this.departments = [];
            this.grades = [];
            this.teachers = [];
          }

          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/subjects'], { queryParams: { tab: this.returnTab } });
      }
    });
  }

  private loadBranches(): void {
    this.loadingBranches = true;
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
        this.loadingBranches = false;
      },
      error: (error: any) => {
        this.errorHandler.showError('Failed to load branches');
        this.loadingBranches = false;
      }
    });
  }

  private setupBranchDependentDropdowns(): void {
    this.subjectForm.get('branch_id')?.valueChanges.subscribe((branchId: string | number | null) => {
      // branchId is an opaque hashid string when HASHIDS_ENABLED is on; never Number() it (→ NaN).
      this.selectedBranchId = branchId ?? null;

      // Clear dependent fields + options
      this.departments = [];
      this.grades = [];
      this.teachers = [];
      this.subjectForm.patchValue({ department_id: null, grade_level: '', teacher_id: null }, { emitEvent: false });

      if (this.selectedBranchId) {
        this.loadDepartmentsForBranch(this.selectedBranchId);
        this.loadGradesForBranch(this.selectedBranchId);
        this.loadTeachersForBranch(this.selectedBranchId);
      } else {
        this.loadingDepartments = false;
        this.loadingGrades = false;
        this.loadingTeachers = false;
      }
    });
  }

  private loadDepartmentsForBranch(branchId: string | number, done?: () => void): void {
    this.loadingDepartments = true;
    this.departmentService.getDepartments({ is_active: true, branch_id: branchId }).subscribe({
      next: (response: any) => {
        this.departments = (response.success && response.data) ? response.data : [];
        this.loadingDepartments = false;
        done?.();
      },
      error: () => {
        this.departments = [];
        this.loadingDepartments = false;
        done?.();
      }
    });
  }

  private loadGradesForBranch(branchId: string | number, done?: () => void): void {
    this.loadingGrades = true;
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response: any) => {
        this.grades = (response.success && response.data)
          ? response.data.filter((g: Grade) => g.is_active)
          : [];
        this.loadingGrades = false;
        done?.();
      },
      error: () => {
        this.grades = [];
        this.loadingGrades = false;
        done?.();
      }
    });
  }

  private loadTeachers(): void {
    // Teachers are branch-scoped; load after branch selection.
    this.teachers = [];
    this.loadingTeachers = false;
  }

  private loadTeachersForBranch(branchId: string | number, done?: () => void): void {
    this.loadingTeachers = true;
    this.teacherService.getTeachers({ is_active: true, branch_id: branchId, per_page: 1000 }).subscribe({
      next: (response: any) => {
        this.teachers = (response.success && response.data) ? response.data : [];
        this.loadingTeachers = false;
        done?.();
      },
      error: () => {
        this.teachers = [];
        this.loadingTeachers = false;
        done?.();
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
          this.router.navigate(['/subjects'], { queryParams: { tab: this.returnTab } });
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/subjects'], { queryParams: { tab: this.returnTab } });
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

