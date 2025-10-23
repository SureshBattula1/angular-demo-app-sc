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

interface SubjectAssignment {
  subject: Subject;
  teacher_id: number | null;
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
  
  // Data
  branches: any[] = [];
  grades: Grade[] = [];
  sections: Section[] = [];
  allSections: Section[] = [];
  availableSubjects: Subject[] = [];
  teachers: any[] = [];
  subjectAssignments: SubjectAssignment[] = [];
  
  // Selections
  selectedBranch: number | null = null;
  selectedGrade: string | null = null;
  selectedSection: Section | null = null;
  academicYear: string = this.getCurrentAcademicYear();
  
  constructor(
    private subjectService: SubjectService,
    private sectionSubjectService: SectionSubjectService,
    private sectionService: SectionService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private teacherService: TeacherService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.loadGrades();
    this.loadAllSections();
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
  
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading grades:', error);
      }
    });
  }
  
  loadAllSections(): void {
    this.sectionService.getSections().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allSections = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading sections:', error);
      }
    });
  }
  
  onBranchOrGradeChange(): void {
    if (this.selectedGrade && this.selectedBranch) {
      this.sections = this.allSections.filter(
        section => section.grade_level === this.selectedGrade && 
                   section.branch_id === this.selectedBranch
      );
    } else if (this.selectedGrade) {
      this.sections = this.allSections.filter(
        section => section.grade_level === this.selectedGrade
      );
    } else if (this.selectedBranch) {
      this.sections = this.allSections.filter(
        section => section.branch_id === this.selectedBranch
      );
    } else {
      this.sections = [];
    }
    
    this.selectedSection = null;
  }
  
  onSectionChange(): void {
    if (this.selectedSection) {
      this.selectedBranch = this.selectedSection.branch_id;
      this.selectedGrade = this.selectedSection.grade_level || '';
    }
  }
  
  loadSubjects(): void {
    if (!this.selectedBranch || !this.selectedGrade || !this.selectedSection) {
      this.errorHandler.showWarning('Please select Branch, Grade, and Section');
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

