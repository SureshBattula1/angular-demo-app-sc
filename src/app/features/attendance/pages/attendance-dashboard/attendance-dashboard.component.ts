import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AttendanceService } from '../../services/attendance.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-attendance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule,
    MatTableModule
  ],
  templateUrl: './attendance-dashboard.component.html',
  styleUrls: ['./attendance-dashboard.component.scss']
})
export class AttendanceDashboardComponent implements OnInit {
  loading = false;
  activeTab: 'teacher' | 'student' = 'teacher';
  
  // Dashboard data
  teacherAttendanceDashboard: any = null;
  studentAttendanceDashboard: any = null;
  
  // Counts for tab badges
  teacherAttendanceCount = 0;
  studentAttendanceCount = 0;
  
  // Current filters
  teacherFilters: Record<string, unknown> = {};
  studentFilters: Record<string, unknown> = {};
  branches: any[] = [];
  grades: any[] = [];
  sections: any[] = [];
  selectedBranch: string | number | null = null;
  
  // Date range filters
  selectedPeriod = new FormControl('today');
  customFromDate = new FormControl();
  customToDate = new FormControl();
  
  // Selected grade and section for student attendance breakdown
  selectedGrade: string | null = null;
  selectedSection: string | null = null;
  studentAttendanceByClassSection: any = null;

  constructor(
    private attendanceService: AttendanceService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadGrades();
    
    // Check query parameters to restore active tab
    this.route.queryParams.subscribe(params => {
      const targetTab = params['tab'];
      if (targetTab === 'student') {
        this.activeTab = 'student';
      } else {
        this.activeTab = 'teacher';
      }
    });
    
    // Load data for the active tab
    this.loadActiveTabData();
    
    // Listen to period changes
    this.selectedPeriod.valueChanges.subscribe(() => {
      this.loadActiveTabData();
    });
  }

  // Tab switching method
  switchTab(tab: 'teacher' | 'student'): void {
    this.activeTab = tab;
    
    // Update URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    
    // Load data for the tab
    this.loadActiveTabData();
  }

  // Load data for active tab
  private loadActiveTabData(): void {
    if (this.activeTab === 'teacher') {
      this.loadTeacherAttendance();
    } else {
      this.loadStudentAttendance();
    }
  }

  // Load teacher attendance dashboard
  loadTeacherAttendance(filters: Record<string, any> = {}): void {
    this.loading = true;
    
    // Build filters with date range
    const dateFilters: Record<string, any> = {
      period: this.selectedPeriod.value || 'today',
      type: 'teacher'
    };
    
    // Add custom date range if selected
    if (this.selectedPeriod.value === 'custom') {
      if (this.customFromDate.value) {
        dateFilters['from_date'] = this.formatDate(this.customFromDate.value);
      }
      if (this.customToDate.value) {
        dateFilters['to_date'] = this.formatDate(this.customToDate.value);
      }
    }
    
    // Merge with existing filters
    this.teacherFilters = { ...this.teacherFilters, ...filters, ...dateFilters };
    
    this.attendanceService.getTodayAttendance(this.teacherFilters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.teacherAttendanceDashboard = response.data;
          this.teacherAttendanceCount = response.data.summary?.total_count || 0;
        } else {
          this.teacherAttendanceDashboard = null;
          this.teacherAttendanceCount = 0;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.teacherAttendanceDashboard = null;
        this.teacherAttendanceCount = 0;
        this.loading = false;
      }
    });
  }

  // Load student attendance dashboard
  loadStudentAttendance(filters: Record<string, any> = {}): void {
    this.loading = true;
    
    // Build filters with date range
    const dateFilters: Record<string, any> = {
      period: this.selectedPeriod.value || 'today',
      type: 'student'
    };
    
    // Add custom date range if selected
    if (this.selectedPeriod.value === 'custom') {
      if (this.customFromDate.value) {
        dateFilters['from_date'] = this.formatDate(this.customFromDate.value);
      }
      if (this.customToDate.value) {
        dateFilters['to_date'] = this.formatDate(this.customToDate.value);
      }
    }
    
    // Merge with existing filters
    this.studentFilters = { ...this.studentFilters, ...filters, ...dateFilters };
    
    this.attendanceService.getTodayAttendance(this.studentFilters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.studentAttendanceDashboard = response.data;
          this.studentAttendanceCount = response.data.summary?.total_count || 0;
        } else {
          this.studentAttendanceDashboard = null;
          this.studentAttendanceCount = 0;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.studentAttendanceDashboard = null;
        this.studentAttendanceCount = 0;
        this.loading = false;
      }
    });
  }

  // Load student attendance by class and section
  loadStudentAttendanceByClassSection(): void {
    if (!this.selectedGrade || !this.selectedSection) {
      this.errorHandler.showWarning('Please select both grade and section');
      return;
    }

    this.loading = true;
    
    const filters: Record<string, any> = {
      grade: this.selectedGrade,
      section: this.selectedSection,
      period: this.selectedPeriod.value || 'today',
      type: 'student'
    };
    
    // Add custom date range if selected
    if (this.selectedPeriod.value === 'custom') {
      if (this.customFromDate.value) {
        filters['from_date'] = this.formatDate(this.customFromDate.value);
      }
      if (this.customToDate.value) {
        filters['to_date'] = this.formatDate(this.customToDate.value);
      }
    }
    
    // Add branch filter if selected
    if (this.selectedBranch) {
      filters['branch_id'] = this.selectedBranch;
    }
    
    this.attendanceService.getTodayAttendance(filters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.studentAttendanceByClassSection = response.data;
        } else {
          this.studentAttendanceByClassSection = null;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.studentAttendanceByClassSection = null;
        this.loading = false;
      }
    });
  }

  onBranchFilterChange(): void {
    const filters: Record<string, any> = {};
    if (this.selectedBranch) {
      filters['branch_id'] = this.selectedBranch;
    }
    
    if (this.activeTab === 'teacher') {
      this.loadTeacherAttendance(filters);
    } else {
      this.loadStudentAttendance(filters);
    }
  }

  onCustomRangeChange(): void {
    if (this.customFromDate.value && this.customToDate.value) {
      this.loadActiveTabData();
    }
  }

  onGradeChange(): void {
    if (this.selectedGrade) {
      this.loadSections();
    } else {
      this.sections = [];
      this.selectedSection = null;
    }
  }

  onSectionChange(): void {
    if (this.selectedGrade && this.selectedSection) {
      this.loadStudentAttendanceByClassSection();
    }
  }

  // Load branches
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
      },
      error: (error: any) => {
        // Silently handle error
      }
    });
  }

  // Load grades
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data;
        }
      },
      error: (error) => {
        // Silently handle error
      }
    });
  }

  // Load sections based on selected grade and branch
  loadSections(): void {
    if (!this.selectedGrade) {
      this.sections = [];
      return;
    }

    const filters: any = {
      grade_level: this.selectedGrade,
      is_active: true,
      per_page: 1000
    };

    if (this.selectedBranch) {
      filters.branch_id = this.selectedBranch;
    }

    this.sectionService.getSections(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sections = response.data;
        } else {
          this.sections = [];
        }
      },
      error: (error) => {
        this.sections = [];
      }
    });
  }

  // Format date for API
  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get grade label
  getGradeLabel(gradeValue: string): string {
    const grade = this.grades.find(g => g.value === gradeValue);
    return grade ? grade.label : `Grade ${gradeValue}`;
  }
}

