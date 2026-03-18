import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { PromotionService } from '../../services/promotion.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Student } from '../../../../core/models/student.model';
import { Grade } from '../../../../core/models/grade.model';
import { AcademicYearService, AcademicYear } from '../../../settings/services/academic-year.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';

@Component({
  selector: 'app-student-promotion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './student-promotion.component.html',
  styleUrls: ['./student-promotion.component.scss']
})
export class StudentPromotionComponent implements OnInit {
  promotionForm!: FormGroup;
  isLoading = false;
  isPreviewing = false;
  previewData: any = null;
  showPreview = false;
  
  branches: any[] = [];
  grades: Grade[] = [];
  fromGradeStudents: Student[] = [];
  selectedStudents: Student[] = [];
  
  // Academic years (Option A: use ids everywhere)
  academicYears: AcademicYear[] = [];
  
  // Filters
  filterBranchId: number | null = null;
  filterFromGrade: string | null = null;
  
  // Promotion options
  promotionMode: 'basic' | 'with_fees' = 'with_fees';
  checkEligibility = false;

  constructor(
    private fb: FormBuilder,
    private promotionService: PromotionService,
    private studentCrudService: StudentCrudService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private academicYearService: AcademicYearService,
    private academicYearContext: AcademicYearContextService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadGrades();
    this.loadAcademicYears();
    
    // Get student IDs from query params if coming from list page
    this.route.queryParams.subscribe(params => {
      if (params['student_ids']) {
        const studentIds = Array.isArray(params['student_ids']) 
          ? params['student_ids'].map((id: string) => parseInt(id))
          : [parseInt(params['student_ids'])];
        // Store for later use
        this.route.snapshot.queryParams['student_ids'] = studentIds;
      }
      
      if (params['from_grade']) {
        this.promotionForm.patchValue({ from_grade: params['from_grade'] });
        this.filterFromGrade = params['from_grade'];
      }
      
      if (params['branch_id']) {
        this.promotionForm.patchValue({ branch_id: params['branch_id'] });
        this.filterBranchId = parseInt(params['branch_id']);
      }
    });
  }

  loadAcademicYears(): void {
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.academicYears = res.data;
          // Default: select the "next" year after current context if it exists; otherwise leave empty.
          const from = this.academicYearContext.selectedYear;
          if (from?.id != null) {
            const idx = this.academicYears.findIndex(y => y.id === from.id);
            const next = idx >= 0 ? this.academicYears[idx + 1] : null;
            if (next?.id != null) {
              this.promotionForm.patchValue({ to_academic_year_id: next.id }, { emitEvent: false });
            }
          }
        } else {
          this.academicYears = [];
        }
      },
      error: () => (this.academicYears = [])
    });
  }

  /**
   * Initialize promotion form
   */
  initForm(): void {
    this.promotionForm = this.fb.group({
      branch_id: [null, Validators.required],
      from_grade: [null, Validators.required],
      to_grade: [null, Validators.required],
      to_academic_year_id: [null, Validators.required],
      student_ids: [[], Validators.required],
      check_eligibility: [false]
    });

    // Load students when branch and from_grade change
    this.promotionForm.get('branch_id')?.valueChanges.subscribe(() => {
      this.loadStudents();
    });

    this.promotionForm.get('from_grade')?.valueChanges.subscribe(() => {
      this.selectedStudents = [];
      this.promotionForm.patchValue({ student_ids: [] }, { emitEvent: false });
      this.loadStudents();
    });

    // Prevent selecting same grade for from and to
    this.promotionForm.get('to_grade')?.valueChanges.subscribe(toGrade => {
      const fromGrade = this.promotionForm.get('from_grade')?.value;
      if (fromGrade && toGrade === fromGrade) {
        this.errorHandler.showWarning('From Grade and To Grade cannot be the same');
        this.promotionForm.patchValue({ to_grade: null }, { emitEvent: false });
      }
    });
  }

  /**
   * Load branches
   */
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
      }
    });
  }

  /**
   * Load grades
   */
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
      }
    });
  }

  /**
   * Load students for selected branch and from grade
   */
  loadStudents(): void {
    const branchId = this.promotionForm.get('branch_id')?.value;
    const fromGrade = this.promotionForm.get('from_grade')?.value;

    if (!branchId || !fromGrade) {
      this.fromGradeStudents = [];
      return;
    }

    this.isLoading = true;
    const params: Record<string, unknown> = {
      branch_id: branchId,
      grade: fromGrade,
      is_active: true,
      student_status: 'Active',
      per_page: 1000 // Load all students for the grade
    };

    this.studentCrudService.getStudents(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.fromGradeStudents = response.data;
          
          // Auto-select students from query params if provided
          const queryStudentIds = this.route.snapshot.queryParams['student_ids'];
          if (queryStudentIds && Array.isArray(queryStudentIds)) {
            const idsToSelect = queryStudentIds.map((id: string | number) => parseInt(id.toString()));
            const studentsToSelect = this.fromGradeStudents.filter(s => idsToSelect.includes(s.id));
            this.selectedStudents = studentsToSelect;
            this.promotionForm.patchValue({ 
              student_ids: studentsToSelect.map(s => s.id) 
            });
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Toggle student selection
   */
  toggleStudentSelection(student: Student): void {
    const index = this.selectedStudents.findIndex(s => s.id === student.id);
    if (index >= 0) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(student);
    }
    this.updateFormStudentIds();
  }


  /**
   * Select all students
   */
  selectAllStudents(): void {
    if (this.selectedStudents.length === this.fromGradeStudents.length) {
      this.selectedStudents = [];
    } else {
      this.selectedStudents = [...this.fromGradeStudents];
    }
    this.updateFormStudentIds();
  }

  /**
   * Update form with selected student IDs
   */
  updateFormStudentIds(): void {
    const studentIds = this.selectedStudents.map(s => s.id);
    this.promotionForm.patchValue({ student_ids: studentIds });
  }

  /**
   * Check if student is selected
   */
  isStudentSelected(student: Student): boolean {
    return this.selectedStudents.some(s => s.id === student.id);
  }

  /**
   * Get full name
   */
  getFullName(student: Student): string {
    const parts = [];
    if (student.first_name) parts.push(student.first_name);
    if (student.last_name) parts.push(student.last_name);
    return parts.join(' ') || 'N/A';
  }

  /**
   * Preview promotion impact
   */
  previewPromotion(): void {
    if (!this.promotionForm.valid) {
      this.errorHandler.showWarning('Please fill all required fields and select at least one student');
      return;
    }

    if (this.selectedStudents.length === 0) {
      this.errorHandler.showWarning('Please select at least one student to promote');
      return;
    }

    this.isPreviewing = true;
    const formValue = this.promotionForm.value;

    const previewData = {
      student_ids: formValue.student_ids,
      from_grade: formValue.from_grade,
      to_grade: formValue.to_grade,
      academic_year: this.getAcademicYearName(formValue.to_academic_year_id)
    };

    // Call preview API if available, otherwise show basic preview
    this.promotionService.previewPromotion(previewData).subscribe({
      next: (response) => {
        this.isPreviewing = false;
        if (response.success) {
          this.previewData = response.data;
          this.showPreview = true;
        }
      },
      error: (error) => {
        this.isPreviewing = false;
        // If preview API doesn't exist, create basic preview
        if (error.status === 404) {
          this.createBasicPreview();
        } else {
          this.errorHandler.showError(error);
        }
      }
    });
  }

  /**
   * Create basic preview if API doesn't exist
   */
  createBasicPreview(): void {
    const formValue = this.promotionForm.value;
    this.previewData = {
      total_students: this.selectedStudents.length,
      from_grade: formValue.from_grade,
      to_grade: formValue.to_grade,
      academic_year: this.getAcademicYearName(formValue.to_academic_year_id),
      students: this.selectedStudents.map(s => ({
        id: s.id,
        name: this.getFullName(s),
        admission_number: s.admission_number
      }))
    };
    this.showPreview = true;
  }

  /**
   * Close preview
   */
  closePreview(): void {
    this.showPreview = false;
    this.previewData = null;
  }

  /**
   * Submit promotion
   */
  onSubmit(): void {
    if (!this.promotionForm.valid) {
      this.errorHandler.showWarning('Please fill all required fields and select at least one student');
      return;
    }

    if (this.selectedStudents.length === 0) {
      this.errorHandler.showWarning('Please select at least one student to promote');
      return;
    }

    const formValue = this.promotionForm.value;
    const promotionData = {
      student_ids: formValue.student_ids,
      from_grade: formValue.from_grade,
      to_grade: formValue.to_grade,
      to_academic_year_id: formValue.to_academic_year_id,
      check_eligibility: formValue.check_eligibility || false
    };

    // Confirm before promoting
    const studentCount = this.selectedStudents.length;
    const yearName = this.getAcademicYearName(formValue.to_academic_year_id) || 'selected year';
    const confirmMessage = `Are you sure you want to promote ${studentCount} student(s) from ${formValue.from_grade} to ${formValue.to_grade} for academic year ${yearName}?\n\nThis action will:\n- Update student grades\n- Carry forward pending fees (if applicable)\n- Create promotion history`;

    if (!confirm(confirmMessage)) {
      return;
    }

    this.isLoading = true;

    // Use fee handling promotion if available, otherwise basic promotion
    const promotionService = this.promotionMode === 'with_fees' 
      ? this.promotionService.promoteStudentsWithFeeHandling(promotionData)
      : this.promotionService.promoteStudents(promotionData);

    promotionService.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          const promotedCount = (response.data as any)?.promoted_count || studentCount;
          this.errorHandler.showSuccess(
            `Successfully promoted ${promotedCount} student(s) to ${formValue.to_grade}`
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

  /**
   * Cancel and go back
   */
  onCancel(): void {
    this.router.navigate(['/students']);
  }

  getAcademicYearName(id: number | null | undefined): string {
    if (id == null) return '';
    return this.academicYears.find(y => y.id === id)?.name ?? '';
  }
}
