import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { PromotionService } from '../../services/promotion.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { ApiService } from '../../../../core/services/api.service';
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
  loadingGrades = false;
  previewData: any = null;
  showPreview = false;
  
  branches: any[] = [];
  grades: Grade[] = [];
  fromSections: { value: string; label: string }[] = [];
  toSections: { value: string; label: string }[] = [];
  revertFromSections: { value: string; label: string }[] = [];
  revertToSections: { value: string; label: string }[] = [];
  loadingSections = false;
  loadingFromSections = false;
  loadingToSections = false;
  fromGradeStudents: Student[] = [];
  selectedStudents: Student[] = [];
  revertFromGradeStudents: Student[] = [];
  revertSelectedStudents: Student[] = [];
  isLoadingRevert = false;
  
  // Academic years (Option A: use ids everywhere)
  academicYears: AcademicYear[] = [];
  
  // Filters
  filterBranchId: string | null = null;
  filterFromGrade: string | null = null;
  
  // Promotion options
  promotionMode: 'basic' | 'with_fees' = 'with_fees';
  checkEligibility = false;

  // Tab: promote (0) vs revert (1)
  activeTabIndex = 0;

  constructor(
    private fb: FormBuilder,
    private promotionService: PromotionService,
    private studentCrudService: StudentCrudService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private apiService: ApiService,
    private academicYearService: AcademicYearService,
    public academicYearContext: AcademicYearContextService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadAcademicYears();
    
    // Get student IDs from query params if coming from list page
    this.route.queryParams.subscribe(params => {
      if (params['student_ids']) {
        const studentIds = Array.isArray(params['student_ids'])
          ? params['student_ids']
          : [params['student_ids']];
        // Store for later use
        this.route.snapshot.queryParams['student_ids'] = studentIds;
      }
      
      if (params['from_grade']) {
        this.promotionForm.patchValue({ from_grade: params['from_grade'] });
        this.filterFromGrade = params['from_grade'];
      }
      
      if (params['branch_id']) {
        this.promotionForm.patchValue({ branch_id: params['branch_id'] });
        this.filterBranchId = params['branch_id'];
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
      from_section: [null, Validators.required],
      to_grade: [null, Validators.required],
      to_section: [null, Validators.required],
      to_academic_year_id: [null, Validators.required],
      student_ids: [[], Validators.required],
      check_eligibility: [false],
      // Revert form fields
      revert_academic_year_id: [null],
      revert_from_grade: [null],
      revert_from_section: [null],
      revert_to_grade: [null],
      revert_to_section: [null],
      revert_student_ids: [[]]
    });

    // Load students when branch, from_grade, or from_section change
    this.promotionForm.get('branch_id')?.valueChanges.subscribe((branchId) => {
      this.grades = [];
      this.fromSections = [];
      this.toSections = [];
      this.fromGradeStudents = [];
      this.selectedStudents = [];
      this.loadingFromSections = false;
      this.loadingToSections = false;
      this.promotionForm.patchValue(
        { from_grade: null, to_grade: null, from_section: null, to_section: null, student_ids: [] },
        { emitEvent: false }
      );
      this.loadGrades(branchId ?? null);
    });

    this.promotionForm.get('from_grade')?.valueChanges.subscribe(() => {
      this.selectedStudents = [];
      this.promotionForm.patchValue({ from_section: null, student_ids: [] }, { emitEvent: false });
      this.loadSections('from');
      this.loadStudents();
    });

    this.promotionForm.get('from_section')?.valueChanges.subscribe(() => {
      this.selectedStudents = [];
      this.promotionForm.patchValue({ student_ids: [] }, { emitEvent: false });
      this.loadStudents();
    });

    this.promotionForm.get('to_grade')?.valueChanges.subscribe(toGrade => {
      this.promotionForm.patchValue({ to_section: null }, { emitEvent: false });
      this.loadSections('to');
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
  loadGrades(branchId?: number | string | null): void {
    if (!branchId) {
      this.grades = [];
      this.loadingGrades = false;
      return;
    }

    this.loadingGrades = true;
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data.filter((g: any) => g.is_active !== false);
        }
        this.loadingGrades = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loadingGrades = false;
      }
    });
  }

  /**
   * Load sections for a grade (from or to)
   */
  loadSections(which: 'from' | 'to'): void {
    const branchId = this.promotionForm.get('branch_id')?.value;
    const grade = which === 'from'
      ? this.promotionForm.get('from_grade')?.value
      : this.promotionForm.get('to_grade')?.value;

    if (!branchId || !grade) {
      if (which === 'from') {
        this.fromSections = [];
        this.loadingFromSections = false;
      } else {
        this.toSections = [];
        this.loadingToSections = false;
      }
      return;
    }

    if (which === 'from') {
      this.loadingFromSections = true;
      this.fromSections = [];
    } else {
      this.loadingToSections = true;
      this.toSections = [];
    }

    this.apiService.get<{ value: string; label: string }[]>('/classes/sections', {
      grade,
      branch_id: branchId
    }).subscribe({
      next: (res) => {
        const sections = (res.data && Array.isArray(res.data) ? res.data : []) as { value: string; label: string }[];
        if (which === 'from') {
          this.fromSections = sections;
          this.loadingFromSections = false;
        } else {
          this.toSections = sections;
          this.loadingToSections = false;
        }
      },
      error: () => {
        if (which === 'from') {
          this.fromSections = [];
          this.loadingFromSections = false;
        } else {
          this.toSections = [];
          this.loadingToSections = false;
        }
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
    const fromSection = this.promotionForm.get('from_section')?.value;
    if (!fromSection) {
      this.fromGradeStudents = [];
      return;
    }

    const fromYearId = this.academicYearContext.selectedYearId;
    const params: Record<string, unknown> = {
      branch_id: branchId,
      grade: fromGrade,
      section: fromSection,
      is_active: true,
      student_status: 'Active',
      // Show all students in the selected class regardless of which academic year their
      // record carries, so the class list isn't hidden by the toolbar year selection.
      all_academic_years: true,
      per_page: 1000
    };
    if (fromYearId != null) {
      params['academic_year_id'] = fromYearId;
    }

    this.studentCrudService.getStudents(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.fromGradeStudents = response.data;
          
          // Auto-select students from query params if provided
          const queryStudentIds = this.route.snapshot.queryParams['student_ids'];
          if (queryStudentIds && Array.isArray(queryStudentIds)) {
            const idsToSelect = queryStudentIds.map((id: string | number) => id.toString());
            const studentsToSelect = this.fromGradeStudents.filter(s => idsToSelect.includes(s.id.toString()));
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
      to_academic_year_id: formValue.to_academic_year_id,
      academic_year: this.getAcademicYearName(formValue.to_academic_year_id),
      from_section: formValue.from_section,
      to_section: formValue.to_section
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
    const fromYearId = this.academicYearContext.selectedYearId;
    if (fromYearId == null) {
      this.errorHandler.showWarning('Please select an academic year in the toolbar (Promoting from year)');
      return;
    }
    const promotionData = {
      student_ids: formValue.student_ids as number[],
      from_grade: formValue.from_grade as string,
      to_grade: formValue.to_grade as string,
      to_academic_year_id: formValue.to_academic_year_id as number,
      from_academic_year_id: fromYearId,
      check_eligibility: formValue.check_eligibility || false,
      from_section: formValue.from_section as string,
      to_section: formValue.to_section as string
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

  getAcademicYearName(id: string | number | null | undefined): string {
    if (id == null) return '';
    return this.academicYears.find(y => String(y.id) === String(id))?.name ?? '';
  }

  // --- Revert tab ---
  onRevertBranchChange(): void {
    const branchId = this.promotionForm.get('branch_id')?.value;
    this.revertFromGradeStudents = [];
    this.revertSelectedStudents = [];
    this.revertFromSections = [];
    this.revertToSections = [];
    this.promotionForm.patchValue({
      revert_academic_year_id: null,
      revert_from_grade: null,
      revert_to_grade: null,
      revert_from_section: null,
      revert_to_section: null,
      revert_student_ids: []
    }, { emitEvent: false });
    this.loadGrades(branchId ?? null);
  }

  onRevertFromGradeChange(): void {
    this.promotionForm.patchValue({ revert_from_section: null, revert_student_ids: [] }, { emitEvent: false });
    this.loadRevertSections();
    this.loadRevertStudents();
  }

  loadRevertSections(): void {
    const branchId = this.promotionForm.get('branch_id')?.value;
    const fromGrade = this.promotionForm.get('revert_from_grade')?.value;
    const toGrade = this.promotionForm.get('revert_to_grade')?.value;
    if (!branchId || !fromGrade) {
      this.revertFromSections = [];
      this.revertToSections = [];
      return;
    }
    this.loadingSections = true;
    this.apiService.get<{ value: string; label: string }[]>('/classes/sections', { grade: fromGrade, branch_id: branchId }).subscribe({
      next: (res) => {
        this.revertFromSections = (res.data && Array.isArray(res.data) ? res.data : []) as { value: string; label: string }[];
        this.loadingSections = false;
      },
      error: () => { this.revertFromSections = []; this.loadingSections = false; }
    });
    if (toGrade) {
      this.apiService.get<{ value: string; label: string }[]>('/classes/sections', { grade: toGrade, branch_id: branchId }).subscribe({
        next: (res) => {
          this.revertToSections = (res.data && Array.isArray(res.data) ? res.data : []) as { value: string; label: string }[];
        },
        error: () => { this.revertToSections = []; }
      });
    } else {
      this.revertToSections = [];
    }
  }

  loadRevertStudents(): void {
    const branchId = this.promotionForm.get('branch_id')?.value;
    const fromGrade = this.promotionForm.get('revert_from_grade')?.value;
    const academicYearId = this.promotionForm.get('revert_academic_year_id')?.value;
    if (!branchId || !fromGrade || !academicYearId) {
      this.revertFromGradeStudents = [];
      return;
    }
    this.isLoadingRevert = true;
    const params: Record<string, unknown> = {
      branch_id: branchId,
      grade: fromGrade,
      is_active: true,
      student_status: 'Active',
      academic_year_id: academicYearId,
      per_page: 1000
    };
    const section = this.promotionForm.get('revert_from_section')?.value;
    if (section) params['section'] = section;

    this.studentCrudService.getStudents(params).subscribe({
      next: (res) => {
        this.revertFromGradeStudents = (res.success && res.data ? res.data : []) as Student[];
        this.isLoadingRevert = false;
      },
      error: () => {
        this.revertFromGradeStudents = [];
        this.isLoadingRevert = false;
      }
    });
  }

  revertToggleStudent(student: Student): void {
    const idx = this.revertSelectedStudents.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      this.revertSelectedStudents.splice(idx, 1);
    } else {
      this.revertSelectedStudents.push(student);
    }
    this.promotionForm.patchValue({ revert_student_ids: this.revertSelectedStudents.map(s => s.id) });
  }

  revertSelectAll(): void {
    if (this.revertSelectedStudents.length === this.revertFromGradeStudents.length) {
      this.revertSelectedStudents = [];
    } else {
      this.revertSelectedStudents = [...this.revertFromGradeStudents];
    }
    this.promotionForm.patchValue({ revert_student_ids: this.revertSelectedStudents.map(s => s.id) });
  }

  isRevertStudentSelected(student: Student): boolean {
    return this.revertSelectedStudents.some(s => s.id === student.id);
  }

  onRevertSubmit(): void {
    const branchId = this.promotionForm.get('branch_id')?.value;
    const academicYearId = this.promotionForm.get('revert_academic_year_id')?.value;
    const fromGrade = this.promotionForm.get('revert_from_grade')?.value;
    const toGrade = this.promotionForm.get('revert_to_grade')?.value;
    if (!branchId || !academicYearId || !fromGrade || !toGrade) {
      this.errorHandler.showWarning('Please fill Branch, Academic Year, From Grade, and To Grade');
      return;
    }
    if (this.revertSelectedStudents.length === 0) {
      this.errorHandler.showWarning('Please select at least one student to revert');
      return;
    }
    if (!confirm(`Revert ${this.revertSelectedStudents.length} student(s) from ${fromGrade} back to ${toGrade}?`)) {
      return;
    }

    this.isLoadingRevert = true;
    const fromSection = this.promotionForm.get('revert_from_section')?.value;
    const toSection = this.promotionForm.get('revert_to_section')?.value;
    const payload = {
      student_ids: this.revertSelectedStudents.map(s => s.id),
      academic_year_id: academicYearId as number,
      from_grade: fromGrade as string,
      to_grade: toGrade as string,
      ...(fromSection && { from_section: fromSection }),
      ...(toSection && { to_section: toSection })
    };

    this.promotionService.revertPromotion(payload).subscribe({
      next: (res) => {
        this.isLoadingRevert = false;
        if (res.success) {
          const count = (res.data as any)?.reverted_count ?? this.revertSelectedStudents.length;
          this.errorHandler.showSuccess(`Successfully reverted ${count} student(s) to ${toGrade}`);
          this.router.navigate(['/students']);
        }
      },
      error: (err) => {
        this.isLoadingRevert = false;
        this.errorHandler.showError(err);
      }
    });
  }
}
