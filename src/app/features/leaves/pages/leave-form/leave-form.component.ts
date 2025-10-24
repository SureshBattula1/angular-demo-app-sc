import { Component, OnInit } from '@angular/core';
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
import { Leave, LeaveType, LeaveStatus } from '../../../../core/models/leave.model';
import { Grade } from '../../../../core/models/grade.model';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './leave-form.component.html',
  styleUrls: ['./leave-form.component.scss']
})
export class LeaveFormComponent implements OnInit {
  loading = false;
  submitting = false;
  isEditMode = false;
  leaveId?: number;
  
  leaveType: 'student' | 'teacher' = 'student';
  
  branches: any[] = [];
  grades: Grade[] = [];
  sections: Section[] = [];
  allSections: Section[] = [];
  students: any[] = [];
  teachers: any[] = [];
  
  // Form data
  selectedBranch: number | null = null;
  selectedGrade: string | null = null;
  selectedSection: string | null = null;
  selectedUser: string | null = null; // student_id or teacher_id
  fromDate: string = '';
  toDate: string = '';
  selectedLeaveType: LeaveType = 'Casual Leave';
  reason: string = '';
  remarks: string = '';
  substituteTeacherId: string | null = null;
  
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
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.leaveId = +params['id'];
        this.isEditMode = true;
        this.loadLeaveData();
      }
    });
    
    // Get leave type from query parameters
    this.route.queryParams.subscribe(params => {
      const typeFromQuery = params['type'];
      if (typeFromQuery === 'student' || typeFromQuery === 'teacher') {
        this.leaveType = typeFromQuery;
      }
    });
    
    this.loadBranches();
    this.loadGrades();
    this.loadAllSections();
  }
  
  loadLeaveData(): void {
    if (!this.leaveId) return;
    
    this.loading = true;
    this.leaveService.getLeave(this.leaveId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const leave = Array.isArray(response.data) ? response.data[0] : response.data;
          this.leaveType = leave.leave_for || 'student';
          this.selectedBranch = leave.branch_id ? +leave.branch_id : null;
          this.fromDate = leave.from_date;
          this.toDate = leave.to_date;
          this.selectedLeaveType = leave.leave_type;
          this.reason = leave.reason;
          this.remarks = leave.remarks || '';
          
          if (this.leaveType === 'student') {
            this.selectedUser = leave.student_id || null;
            this.selectedGrade = leave.grade || null;
            this.selectedSection = leave.section || null;
          } else {
            this.selectedUser = leave.teacher_id || null;
            this.substituteTeacherId = leave.substitute_teacher_id || null;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
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
  
  onGradeChange(): void {
    if (this.selectedGrade) {
      this.sections = this.allSections.filter(
        section => section.grade_level === this.selectedGrade
      );
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
    }
  }
  
  loadStudents(): void {
    if (!this.selectedGrade || !this.selectedSection) return;
    
    this.loading = true;
    this.studentService.getStudents({
      grade: this.selectedGrade,
      section: this.selectedSection,
      student_status: 'Active'
    }).subscribe({
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
    // Reset form
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
    
    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);
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
    
    if (!this.fromDate || !this.toDate) {
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
      from_date: this.fromDate,
      to_date: this.toDate,
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
  
  getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }
  
  getStudentName(student: any): string {
    return `${student.first_name} ${student.last_name} (${student.admission_number})`;
  }
  
  getTeacherName(teacher: any): string {
    return `${teacher.first_name} ${teacher.last_name}${teacher.employee_id ? ' (' + teacher.employee_id + ')' : ''}`;
  }
}

