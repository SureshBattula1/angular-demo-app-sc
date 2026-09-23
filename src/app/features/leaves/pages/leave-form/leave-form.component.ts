import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { LeaveService } from '../../services/leave.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ApiService } from '../../../../core/services/api.service';
import { Leave, LeaveType, LeaveStatus } from '../../../../core/models/leave.model';
import { Grade } from '../../../../core/models/grade.model';
import { Section } from '../../../../core/models/section.model';
import { Class } from '../../../../core/models/class.model';
import { AcademicYear, AcademicYearService } from '../../../settings/services/academic-year.service';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './leave-form.component.html',
  styleUrls: ['./leave-form.component.scss']
})
export class LeaveFormComponent implements OnInit, AfterViewInit {
  loading = false;
  submitting = false;
  isEditMode = false;
  leaveId?: string;
  isLoadingData = false; // Flag to prevent form reset during data load

  leaveType: 'student' | 'teacher' = 'student';

  branches: any[] = [];
  grades: Grade[] = [];
  sections: Section[] = [];
  allSections: Section[] = [];
  classes: Class[] = [];
  students: any[] = [];
  teachers: any[] = [];
  academicYears: AcademicYear[] = [];

  // Form data
  selectedBranch: number | string | null = null;
  selectedGrade: string | null = null;
  selectedSection: string | null = null;
  selectedUser: string | null = null; // student_id or teacher_id
  fromDate: Date | null = null;
  toDate: Date | null = null;
  selectedLeaveType: LeaveType = 'Casual Leave';
  reason: string = '';
  remarks: string = '';
  substituteTeacherId: string | null = null;
  selectedAcademicYearId: string | number | null = null;

  studentLeaveTypes: LeaveType[] = [
    'Sick Leave',
    'Casual Leave',
    'Medical Leave',
    'Family Emergency',
    'Other'
  ];

  teacherLeaveTypes: LeaveType[] = [
    'Sick Leave',
    'Casual Leave',
    'Medical Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Compensatory Leave',
    'Unpaid Leave',
    'Other'
  ];

  constructor(
    private leaveService: LeaveService,
    private studentService: StudentCrudService,
    private teacherService: TeacherService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private academicYearService: AcademicYearService,
    private apiService: ApiService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    // Set leaveType from query params in constructor to ensure it's available before view renders
    const querySnapshot = this.route.snapshot.queryParams;
    if (querySnapshot['type'] === 'student' || querySnapshot['type'] === 'teacher') {
      this.leaveType = querySnapshot['type'] as 'student' | 'teacher';
    }
  }

  ngOnInit(): void {
    // Leave type is already set in constructor from query params

    // Subscribe to query params for future changes
    this.route.queryParams.subscribe(params => {
      const typeFromQuery = params['type'];
      if (typeFromQuery === 'student' || typeFromQuery === 'teacher') {
        this.leaveType = typeFromQuery as 'student' | 'teacher';
        this.cdr.detectChanges();
      }
    });

    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.leaveId = params['id'];
        this.isEditMode = true;
        // Ensure type is set from query params before loading data
        const snapshot = this.route.snapshot.queryParams;
        if (snapshot['type'] === 'student' || snapshot['type'] === 'teacher') {
          this.leaveType = snapshot['type'] as 'student' | 'teacher';
          this.cdr.detectChanges();
        }
        this.loadLeaveData();
      }
    });

    this.loadBranches();
    this.loadGrades();
    this.loadAllSections();
    this.loadAcademicYears();

    // Load teachers if leave type is teacher
    if (this.leaveType === 'teacher') {
      this.loadTeachers();
    }
  }

  ngAfterViewInit(): void {
    // Ensure toggle is set after view initializes
    const querySnapshot = this.route.snapshot.queryParams;
    if (querySnapshot['type'] === 'student' || querySnapshot['type'] === 'teacher') {
      // Use setTimeout to ensure the view is fully rendered and Material components are initialized
      setTimeout(() => {
        const typeValue = querySnapshot['type'] as 'student' | 'teacher';
        if (this.leaveType !== typeValue) {
          this.leaveType = typeValue;
        }
        // Force change detection
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 50);
    }
  }

  loadLeaveData(): void {
    if (!this.leaveId) return;

    this.loading = true;
    this.isLoadingData = true; // Set flag to prevent form reset
    // Use type from query params or leaveType, fallback to 'student'
    const type = this.leaveType || 'student';
    this.leaveService.getLeave(this.leaveId, type as 'student' | 'teacher').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const leave = Array.isArray(response.data) ? response.data[0] : response.data;
          // Ensure leaveType is set correctly - prioritize leave_for from data, then current value, then default
          const newLeaveType = (leave.leave_for || this.leaveType || 'student') as 'student' | 'teacher';
          // Always set leaveType to ensure toggle button reflects the correct value
          this.leaveType = newLeaveType;
          // branch_id is an opaque hashid string when HASHIDS_ENABLED is on — never +/Number() it (→ NaN).
          this.selectedBranch = leave.branch_id ?? null;
          this.selectedAcademicYearId = leave.academic_year_id ?? null;
          this.fromDate = leave.from_date ? new Date(leave.from_date) : null;
          this.toDate = leave.to_date ? new Date(leave.to_date) : null;
          this.selectedLeaveType = leave.leave_type;
          this.reason = leave.reason;
          this.remarks = leave.remarks || '';

          if (this.leaveType === 'student') {
            this.selectedUser = leave.student_id || null;
            this.selectedGrade = leave.grade || null;
            this.selectedSection = leave.section || null;

            // Load students list after setting form values so the dropdown can show the selected student
            // First ensure sections are loaded and filtered
            if (this.selectedGrade && this.selectedSection) {
              // If branch is selected, load sections from backend with filters
              if (this.selectedBranch !== null) {
                this.sectionService.getSections({
                  grade_level: this.selectedGrade,
                  branch_id: this.selectedBranch,
                  is_active: true,
                  per_page: 1000
                }).subscribe({
                  next: (response) => {
                    if (response.success && response.data) {
                      this.sections = response.data;
                      // Verify selected section is still valid
                      if (this.selectedSection && !this.sections.find(s => s.name === this.selectedSection)) {
                        this.selectedSection = null;
                        this.selectedUser = null;
                      }
                    }
                    // Load students after sections are ready
                    if (this.selectedGrade && this.selectedSection) {
                      this.loadStudents();
                    }
                  },
                  error: () => {
                    // Fallback to client-side filtering
                    this.filterSectionsClientSide();
                    if (this.selectedGrade && this.selectedSection) {
                      this.loadStudents();
                    }
                  }
                });
              } else {
                // No branch selected, use client-side filtering
                this.filterSectionsClientSide();
                if (this.selectedGrade && this.selectedSection) {
                  this.loadStudents();
                }
              }
            }
          } else {
            this.selectedUser = leave.teacher_id || null;
            this.substituteTeacherId = leave.substitute_teacher_id || null;
            // Load teachers list for teacher leaves
            this.loadTeachers();
          }
        }
        this.loading = false;
        this.isLoadingData = false; // Reset flag after data is loaded
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.isLoadingData = false; // Reset flag on error
      }
    });
  }

  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.branches = response.data;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
      }
    });
  }

  loadGrades(branchId?: number | string | null): void {
    const params: any = {};
    if (branchId !== null && branchId !== undefined) {
      params.branch_id = branchId;
    }

    this.gradeService.getGrades(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data;
          // Reset grade selection if current selection is not in filtered list
          if (this.selectedGrade && !this.grades.find(g => g.value === this.selectedGrade)) {
            this.selectedGrade = null;
            this.selectedSection = null;
            this.selectedUser = null;
            this.students = [];
          }
          // After grades are loaded, filter sections if we have a grade selected
          if (this.selectedGrade && this.selectedBranch !== null) {
            this.filterSectionsAfterGradeLoad();
          }
        }
      },
      error: (error) => {
        console.error('Error loading grades:', error);
      }
    });
  }

  /**
   * Load classes from API when branch is selected
   */
  loadClasses(branchId: number | string | null): void {
    if (!branchId) {
      this.classes = [];
      return;
    }

    const params: any = {
      branch_id: branchId,
      is_active: true
    };

    this.apiService.get<Class[]>('/classes', params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.classes = Array.isArray(response.data) ? response.data : [];
          console.log('Classes loaded:', this.classes.length);
        } else {
          this.classes = [];
        }
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.classes = [];
        this.errorHandler.showError('Failed to load classes');
      }
    });
  }

  /**
   * Filter sections after grades are loaded (used when branch changes)
   */
  private filterSectionsAfterGradeLoad(): void {
    if (this.selectedGrade && this.selectedBranch !== null) {
      // Load sections filtered by grade and branch from backend
      this.sectionService.getSections({
        grade_level: this.selectedGrade,
        branch_id: this.selectedBranch,
        is_active: true,
        per_page: 1000
      }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.sections = response.data;
            // Reset section selection if current selection is not in filtered list
            if (this.selectedSection && !this.sections.find(s => s.name === this.selectedSection)) {
              this.selectedSection = null;
              this.selectedUser = null;
              this.students = [];
            }
          } else {
            this.sections = [];
            this.selectedSection = null;
            this.selectedUser = null;
            this.students = [];
          }
        },
        error: (error) => {
          console.error('Error loading filtered sections:', error);
          // Fallback to client-side filtering
          this.filterSectionsClientSide();
        }
      });
    } else {
      // Use client-side filtering
      this.filterSectionsClientSide();
    }
  }

  /**
   * Load all sections for filtering
   * Load with high per_page limit to get all sections, or filter by branch/grade on backend
   */
  loadAllSections(): void {
    // Load all sections with a high per_page limit and filter active sections
    this.sectionService.getSections({
      per_page: 1000, // High limit to get all sections
      is_active: true  // Only load active sections
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allSections = response.data;
          // Trigger filtering if branch/grade already selected
          if (this.selectedBranch || this.selectedGrade) {
            this.onGradeChange();
          }
        }
      },
      error: (error) => {
        console.error('Error loading sections:', error);
      }
    });
  }

  /**
   * Update sections when grade or branch changes
   */
  onGradeChange(): void {
    // Reload grades when branch changes (for student leaves)
    // Only reload if we have a branch selected and we're in student mode
    if (this.leaveType === 'student' && this.selectedBranch !== null) {
      const currentGrade = this.selectedGrade; // Save current selection
      this.loadGrades(this.selectedBranch);
      // Load classes when branch is selected
      this.loadClasses(this.selectedBranch);
      // Note: loadGrades will handle resetting selectedGrade if it's not in the filtered list
      // Sections will be filtered after grades are loaded via the callback
    }

    // If both grade and branch are selected (branch not null), load sections from backend with filters
    if (this.selectedGrade && this.selectedBranch !== null) {
      // Load sections filtered by grade and branch from backend for better performance
      this.sectionService.getSections({
        grade_level: this.selectedGrade,
        branch_id: this.selectedBranch,
        is_active: true,
        per_page: 1000
      }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.sections = response.data;
            // Reset section selection if current selection is not in filtered list
            if (this.selectedSection && !this.sections.find(s => s.name === this.selectedSection)) {
              this.selectedSection = null;
              this.selectedUser = null;
              this.students = [];
            }
          } else {
            this.sections = [];
            this.selectedSection = null;
            this.selectedUser = null;
            this.students = [];
          }
        },
        error: (error) => {
          console.error('Error loading filtered sections:', error);
          // Fallback to client-side filtering
          this.filterSectionsClientSide();
        }
      });
    } else {
      // Use client-side filtering when only one filter is selected or branch is null
      this.filterSectionsClientSide();
    }
  }

  /**
   * Client-side filtering fallback
   */
  private filterSectionsClientSide(): void {
    if (this.selectedGrade && this.selectedBranch) {
      // Filter sections by selected grade and branch
      this.sections = this.allSections.filter(
        section => {
          // Ensure section is active
          if (!section.is_active) return false;
          // Type-safe comparison: convert both to strings for grade_level
          const matchesGrade = String(section.grade_level) === String(this.selectedGrade);
          // Compare as strings: ids are opaque hashid strings when HASHIDS_ENABLED is on (Number() → NaN).
          const matchesBranch = String(section.branch_id) === String(this.selectedBranch);
          return matchesGrade && matchesBranch;
        }
      );
    } else if (this.selectedGrade) {
      // Filter by grade only (branch is null or not selected)
      this.sections = this.allSections.filter(
        section => section.is_active && String(section.grade_level) === String(this.selectedGrade)
      );
    } else if (this.selectedBranch) {
      // Filter by branch only (grade not selected)
      this.sections = this.allSections.filter(
        section => section.is_active && String(section.branch_id) === String(this.selectedBranch)
      );
    } else {
      // No filters selected - show all active sections
      this.sections = this.allSections.filter(section => section.is_active);
    }

    // Reset section selection if current selection is not in filtered list
    if (this.selectedSection && !this.sections.find(s => s.name === this.selectedSection)) {
      this.selectedSection = null;
      this.selectedUser = null;
      this.students = [];
    }
  }

  onSectionChange(): void {
    if (this.selectedGrade && this.selectedSection) {
      this.loadStudents();
    }
  }

  onBranchChange(): void {
    if (this.leaveType === 'teacher') {
      this.loadTeachers();
      // Load classes when branch changes for teacher leaves too
      this.loadClasses(this.selectedBranch);
    }
  }

  loadStudents(): void {
    if (!this.selectedGrade || !this.selectedSection) return;

    this.loading = true;
    const filters: any = {
      grade: this.selectedGrade,
      section: this.selectedSection,
      student_status: 'Active'
    };

    // Include branch_id if selected
    if (this.selectedBranch) {
      filters.branch_id = this.selectedBranch;
    }

    this.studentService.getStudents(filters).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.students = response.data || [];
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  loadTeachers(): void {
    this.loading = true;
    const filters: any = { status: 'Active' };
    if (this.selectedBranch) {
      filters.branch_id = this.selectedBranch;
    }

    this.teacherService.getTeachers(filters).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.teachers = response.data || [];
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  onTypeChange(): void {
    // Don't reset form if we're currently loading data (edit mode)
    if (this.isLoadingData) {
      return;
    }

    // Reset form only when user manually changes the type
    this.selectedBranch = null;
    this.selectedGrade = null;
    this.selectedSection = null;
    this.selectedUser = null;
    this.students = [];
    this.teachers = [];
    this.substituteTeacherId = null;

    if (this.leaveType === 'teacher') {
      this.loadTeachers();
    }
  }

  getTotalDays(): number {
    if (!this.fromDate || !this.toDate) return 0;

    const from = this.fromDate instanceof Date ? this.fromDate : new Date(this.fromDate);
    const to = this.toDate instanceof Date ? this.toDate : new Date(this.toDate);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  onSubmit(): void {
    // Validation
    if (!this.selectedUser) {
      this.errorHandler.showError('Please select a ' + (this.leaveType === 'student' ? 'student' : 'teacher'));
      return;
    }

    const fromDateStr = this.formatDateForApi(this.fromDate);
    const toDateStr = this.formatDateForApi(this.toDate);
    if (!fromDateStr || !toDateStr) {
      this.errorHandler.showError('Please select both from and to dates');
      return;
    }

    if (!this.selectedLeaveType) {
      this.errorHandler.showError('Please select a leave type');
      return;
    }

    if (!this.reason || this.reason.trim() === '') {
      this.errorHandler.showError('Please provide a reason for the leave');
      return;
    }

    const leaveData: any = {
      type: this.leaveType,
      academic_year_id: this.selectedAcademicYearId,
      from_date: fromDateStr,
      to_date: toDateStr,
      leave_type: this.selectedLeaveType,
      reason: this.reason,
      remarks: this.remarks || null
    };

    if (this.leaveType === 'student') {
      leaveData.student_id = this.selectedUser;
      leaveData.branch_id = this.selectedBranch;
    } else {
      leaveData.teacher_id = this.selectedUser;
      leaveData.branch_id = this.selectedBranch;
      if (this.substituteTeacherId) {
        leaveData.substitute_teacher_id = this.substituteTeacherId;
      }
    }

    this.submitting = true;

    if (this.isEditMode && this.leaveId) {
      // Update existing leave
      this.leaveService.updateLeave(this.leaveId, leaveData).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Leave updated successfully');
            this.router.navigate(['/leaves']);
          }
          this.submitting = false;
        },
        error: (error) => {
          this.errorHandler.showError(error);
          this.submitting = false;
        }
      });
    } else {
      // Create new leave
      this.leaveService.createLeave(leaveData).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Leave application submitted successfully');
            this.router.navigate(['/leaves']);
          }
          this.submitting = false;
        },
        error: (error) => {
          this.errorHandler.showError(error);
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/leaves']);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /** Format Date for API (YYYY-MM-DD). Returns empty string if null. */
  formatDateForApi(d: Date | null): string {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split('T')[0];
  }

  getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }

  loadAcademicYears(): void {
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response) => {
        this.academicYears = (response.success && response.data) ? response.data : [];
        if (!this.selectedAcademicYearId) {
          const current = this.academicYears.find(y => y.is_current) || this.academicYears.find(y => y.is_active);
          if (current) this.selectedAcademicYearId = current.id;
        }
      },
      error: () => {
        this.academicYears = [];
      }
    });
  }

  getStudentName(student: any): string {
    return `${student.first_name} ${student.last_name} (${student.admission_number})`;
  }

  getTeacherName(teacher: any): string {
    // Handle both nested user object and flattened structure
    const firstName = teacher.user?.first_name || teacher.first_name || '';
    const lastName = teacher.user?.last_name || teacher.last_name || '';
    const employeeId = teacher.employee_id || '';
    const name = `${firstName} ${lastName}`.trim();
    return name ? `${name}${employeeId ? ' (' + employeeId + ')' : ''}` : 'N/A';
  }
}

