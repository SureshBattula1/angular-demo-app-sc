import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { SubjectService } from '../../services/subject.service';
import { SectionSubjectService, BulkAssignmentRequest } from '../../services/section-subject.service';
import { SectionService } from '../../../sections/services/section.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Subject } from '../../../../core/models/subject.model';
import { Section } from '../../../../core/models/section.model';
import { Grade } from '../../../../core/models/grade.model';
import { AcademicYear, AcademicYearService } from '../../../settings/services/academic-year.service';

interface SubjectAssignment {
  subject: Subject;
  teacher_id: number | string | null;
  selected: boolean;
}

@Component({
  selector: 'app-subject-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './subject-assignment.component.html',
  styleUrls: ['./subject-assignment.component.scss']
})
export class SubjectAssignmentComponent implements OnInit {
  loading = false;
  submitting = false;
  subjectsLoaded = false;
  loadingBranches = false;
  loadingGrades = false;
  loadingSections = false;
  loadingAcademicYears = false;
  
  // Data
  branches: any[] = [];
  grades: Grade[] = [];
  sections: Section[] = [];
  availableSubjects: Subject[] = [];
  teachers: any[] = [];
  subjectAssignments: SubjectAssignment[] = [];
  academicYears: AcademicYear[] = [];
  
  // Selections
  selectedBranch: number | string | null = null;
  selectedGrade: string | null = null;
  selectedSection: Section | null = null;
  selectedAcademicYearId: number | string | null = null;
  academicYear: string = this.getCurrentAcademicYear();
  
  constructor(
    private subjectService: SubjectService,
    private sectionSubjectService: SectionSubjectService,
    private sectionService: SectionService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private teacherService: TeacherService,
    private academicYearService: AcademicYearService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.loadAcademicYears();
  }
  
  loadBranches(): void {
    this.loadingBranches = true;
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.branches = response.data;
        }
        this.loadingBranches = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.loadingBranches = false;
      }
    });
  }
  
  loadAcademicYears(): void {
    this.loadingAcademicYears = true;
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response) => {
        this.loadingAcademicYears = false;
        this.academicYears = (response.success && response.data) ? response.data : [];
        const current = this.academicYears.find(y => y.is_current) || this.academicYears.find(y => y.is_active);
        if (current) {
          this.selectedAcademicYearId = current.id;
          this.academicYear = current.name;
        }
      },
      error: () => {
        this.loadingAcademicYears = false;
        this.academicYears = [];
      }
    });
  }

  onAcademicYearChange(): void {
    const selected = this.academicYears.find(y => y.id === this.selectedAcademicYearId);
    if (selected) this.academicYear = selected.name;
  }

  onBranchChange(): void {
    this.subjectsLoaded = false;
    this.availableSubjects = [];
    this.subjectAssignments = [];

    this.selectedGrade = null;
    this.selectedSection = null;
    this.grades = [];
    this.sections = [];

    if (!this.selectedBranch) return;

    this.loadingGrades = true;
    this.gradeService.getGrades({ branch_id: this.selectedBranch }).subscribe({
      next: (response: any) => {
        this.grades = (response.success && response.data)
          ? response.data.filter((g: Grade) => g.is_active)
          : [];
        this.loadingGrades = false;
      },
      error: () => {
        this.grades = [];
        this.loadingGrades = false;
      }
    });
  }

  onGradeChange(): void {
    this.subjectsLoaded = false;
    this.availableSubjects = [];
    this.subjectAssignments = [];

    this.selectedSection = null;
    this.sections = [];

    if (!this.selectedBranch || !this.selectedGrade) return;

    this.loadingSections = true;
    this.sectionService.getSections({ branch_id: this.selectedBranch, grade_level: this.selectedGrade, per_page: 1000, is_active: true }).subscribe({
      next: (response: any) => {
        this.sections = (response.success && response.data) ? response.data : [];
        this.loadingSections = false;
      },
      error: () => {
        this.sections = [];
        this.loadingSections = false;
      }
    });
  }
  
  loadSubjects(): void {
    if (!this.selectedBranch || !this.selectedGrade) {
      this.errorHandler.showWarning('Please select Branch and Grade');
      return;
    }
    
    this.loading = true;
    this.subjectsLoaded = false;
    this.loadAvailableSubjects();
    this.loadTeachers();
  }
  
  loadAvailableSubjects(): void {
    if (!this.selectedGrade || !this.selectedBranch) return;
    
    this.subjectService.getSubjects({
      grade_level: this.selectedGrade,
      branch_id: this.selectedBranch,
      is_active: true,
      per_page: 100
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableSubjects = response.data;
          this.subjectAssignments = this.availableSubjects.map(subject => ({
            subject: subject,
            teacher_id: subject.teacher?.id || subject.teacher_id || null,
            selected: false
          }));
          
          if (this.subjectAssignments.length === 0) {
            this.errorHandler.showWarning('No subjects found for this grade');
          }
          
          this.subjectsLoaded = true;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }
  
  loadTeachers(): void {
    if (!this.selectedBranch) return;
    
    this.teacherService.getTeachers({
      branch_id: this.selectedBranch,
      is_active: true,
      per_page: 100
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teachers = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
      }
    });
  }
  
  selectAllSubjects(): void {
    this.subjectAssignments.forEach(assignment => {
      assignment.selected = true;
    });
  }
  
  deselectAllSubjects(): void {
    this.subjectAssignments.forEach(assignment => {
      assignment.selected = false;
    });
  }
  
  getSelectedCount(): number {
    return this.subjectAssignments.filter(a => a.selected).length;
  }
  
  canSubmit(): boolean {
    return this.getSelectedCount() > 0 && !this.submitting;
  }
  
  onSubmit(): void {
    if (!this.canSubmit()) {
      this.errorHandler.showWarning('Please select at least one subject');
      return;
    }
    
    if (!this.selectedSection) {
      this.errorHandler.showWarning('Section not selected');
      return;
    }
    
    this.submitting = true;
    
    const selectedAssignments = this.subjectAssignments.filter(a => a.selected);
    
    const bulkData: BulkAssignmentRequest = {
      section_id: this.selectedSection.id,
      subjects: selectedAssignments.map(assignment => ({
        subject_id: assignment.subject.id,
        teacher_id: assignment.teacher_id || undefined
      })),
      branch_id: this.selectedBranch!,
      academic_year_id: this.selectedAcademicYearId!,
      academic_year: this.academicYear
    };
    
    this.sectionSubjectService.bulkAssign(bulkData).subscribe({
      next: (response: any) => {
        this.submitting = false;
        if (response.success) {
          const count = response.data?.assigned?.length || selectedAssignments.length;
          this.errorHandler.showSuccess(
            `Successfully assigned ${count} subject(s) to section ${this.selectedSection!.name}`
          );
          
          this.router.navigate(['/subjects']);
        }
      },
      error: (error: any) => {
        this.submitting = false;
        this.errorHandler.showError(error);
      }
    });
  }
  
  onCancel(): void {
    this.router.navigate(['/subjects']);
  }
  
  private getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Academic year starts in April (month 3)
    if (month >= 3) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }
}

