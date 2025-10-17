import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AttendanceService } from '../../services/attendance.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AttendanceStudent, BulkAttendanceRequest } from '../../../../core/models/attendance.model';

@Component({
  selector: 'app-attendance-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './attendance-form.component.html',
  styleUrls: ['./attendance-form.component.scss']
})
export class AttendanceFormComponent implements OnInit {
  loading = false;
  submitting = false;
  studentsLoaded = false;
  
  branches: any[] = [];
  students: AttendanceStudent[] = [];
  
  selectedBranch: number | null = null;
  selectedGrade: string | null = null;
  selectedSection: string | null = null;
  selectedDate: string = this.getTodayDate();
  academicYear: string = this.getCurrentAcademicYear();
  
  grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  sections = ['A', 'B', 'C', 'D', 'E'];
  
  statusOptions = [
    { value: 'Present', label: 'Present', icon: 'check_circle', color: 'success' },
    { value: 'Absent', label: 'Absent', icon: 'cancel', color: 'danger' },
    { value: 'Late', label: 'Late', icon: 'schedule', color: 'warning' },
    { value: 'Half-Day', label: 'Half Day', icon: 'timelapse', color: 'info' },
    { value: 'Sick Leave', label: 'Sick Leave', icon: 'local_hospital', color: 'secondary' },
    { value: 'Leave', label: 'Leave', icon: 'event_busy', color: 'secondary' }
  ];
  
  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentCrudService,
    private branchService: BranchService,
    private errorHandler: ErrorHandlerService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
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
  
  loadStudents(): void {
    if (!this.selectedBranch || !this.selectedGrade || !this.selectedSection) {
      this.errorHandler.showWarning('Please select Branch, Grade, and Section');
      return;
    }
    
    this.loading = true;
    this.studentsLoaded = false;
    
    this.studentService.getStudents({
      branch_id: this.selectedBranch,
      grade: this.selectedGrade,
      section: this.selectedSection
    }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.students = response.data.map((student: any) => ({
            id: student.user_id || student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            admission_number: student.admission_number,
            roll_number: student.roll_number,
            grade: student.grade,
            section: student.section,
            status: 'Present',
            remarks: ''
          }));
          this.studentsLoaded = true;
          
          if (this.students.length === 0) {
            this.errorHandler.showWarning('No students found for selected class');
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }
  
  setStatusForAll(status: string): void {
    this.students.forEach(student => {
      student.status = status as any;
    });
  }
  
  setStudentStatus(student: AttendanceStudent, status: string): void {
    student.status = status as any;
  }
  
  getCheckboxColor(status: string): 'primary' | 'accent' | 'warn' {
    if (status === 'Present') return 'primary';
    if (status === 'Absent') return 'warn';
    return 'accent';
  }
  
  onSubmit(): void {
    if (!this.selectedBranch || !this.selectedDate) {
      this.errorHandler.showWarning('Please select Branch and Date');
      return;
    }
    
    if (this.students.length === 0) {
      this.errorHandler.showWarning('No students to mark attendance');
      return;
    }
    
    this.submitting = true;
    
    const bulkData: BulkAttendanceRequest = {
      type: 'student',
      date: this.selectedDate,
      branch_id: this.selectedBranch,
      academic_year: this.academicYear,
      attendance: this.students.map(student => ({
        id: student.id,
        status: student.status || 'Present',
        remarks: student.remarks || '',
        grade_level: student.grade,
        section: student.section
      }))
    };
    
    this.attendanceService.markBulkAttendance(bulkData).subscribe({
      next: (response: any) => {
        this.submitting = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            `Attendance marked successfully for ${response.data?.marked || this.students.length} students`
          );
          
          if (response.data?.errors && response.data.errors.length > 0) {
            console.warn('Some errors occurred:', response.data.errors);
          }
          
          this.router.navigate(['/attendance']);
        }
      },
      error: (error: any) => {
        this.submitting = false;
        this.errorHandler.showError(error);
      }
    });
  }
  
  onCancel(): void {
    this.router.navigate(['/attendance']);
  }
  
  getStudentFullName(student: AttendanceStudent): string {
    return `${student.first_name} ${student.last_name}`;
  }
  
  getPresentCount(): number {
    return this.students.filter(s => s.status === 'Present').length;
  }
  
  getAbsentCount(): number {
    return this.students.filter(s => s.status === 'Absent').length;
  }
  
  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
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

