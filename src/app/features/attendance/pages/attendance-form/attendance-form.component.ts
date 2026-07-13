import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AttendanceService } from '../../services/attendance.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AttendanceStudent, BulkAttendanceRequest } from '../../../../core/models/attendance.model';
import { Grade } from '../../../../core/models/grade.model';
import { Section } from '../../../../core/models/section.model';

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
  teachersLoaded = false;

  loadingBranches = false;
  loadingGrades = false;
  loadingSections = false;
  
  attendanceType: 'student' | 'teacher' = 'student';
  isTypeDisabled = false; // Disable type toggle when coming from specific tab
  returnTab: 'student' | 'teacher' = 'student'; // Track which tab to return to
  
  branches: any[] = [];
  grades: Grade[] = [];
  sections: Section[] = [];
  students: AttendanceStudent[] = [];
  teachers: any[] = [];
  
  // IDs are opaque hashid strings once HASHIDS_ENABLED is on (API returns string ids).
  // Keep number for backwards-compatibility when encryption is off.
  selectedBranch: string | number | null = null;
  selectedGrade: string | null = null;
  selectedSection: string | null = null;
  /** Local calendar date for mat-datepicker; API uses {@link formatDateForApi}. */
  selectedDate: Date | null = this.getTodayLocalDate();
  academicYear: string = this.getCurrentAcademicYear();
  
  // Validation tracking
  touchedRows = new Set<number>(); // Track which rows have been interacted with
  showValidation = false; // Show validation errors on submit
  
  // Update mode tracking
  isUpdateMode = false;
  existingAttendanceLoaded = false;
  
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
    private teacherService: TeacherService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    // Get attendance type from query parameters
    this.route.queryParams.subscribe(params => {
      const typeFromQuery = params['type'];
      if (typeFromQuery === 'student' || typeFromQuery === 'teacher') {
        this.attendanceType = typeFromQuery;
        this.isTypeDisabled = true; // Disable toggle when type is specified
        this.returnTab = typeFromQuery; // Set return tab to the same type
      }
    });
    
    this.loadBranches();
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
        console.error('Error loading branches:', error);
        this.errorHandler.showError(error);
        this.loadingBranches = false;
      }
    });
  }
  
  /**
   * Load grades for a branch (branch-wise)
   */
  private loadGradesForBranch(branchId: string | number): void {
    this.loadingGrades = true;
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
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
  
  /**
   * Cascade: Branch -> Grades, Grade -> Sections
   */
  onBranchChange(): void {
    // Reset dependent selections + data
    this.grades = [];
    this.sections = [];
    this.selectedGrade = null;
    this.selectedSection = null;

    // Reset loaded lists
    this.studentsLoaded = false;
    this.teachersLoaded = false;
    this.students = [];
    this.teachers = [];

    if (this.selectedBranch) {
      this.loadGradesForBranch(this.selectedBranch);
    }
  }

  onGradeChange(): void {
    this.sections = [];
    this.selectedSection = null;

    // Reset loaded lists
    this.studentsLoaded = false;
    this.teachersLoaded = false;
    this.students = [];
    this.teachers = [];

    if (!this.selectedBranch || !this.selectedGrade) return;

    this.loadingSections = true;
    this.sectionService.getSections({
      branch_id: this.selectedBranch,
      grade_level: this.selectedGrade,
      is_active: true,
      per_page: 1000
    }).subscribe({
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
  
  loadStudents(): void {
    if (!this.selectedBranch || !this.selectedGrade || !this.selectedSection) {
      this.errorHandler.showWarning('Please select Branch, Grade, and Section');
      return;
    }
    
    this.loading = true;
    this.studentsLoaded = false;
    
    // Reset validation state
    this.touchedRows.clear();
    this.showValidation = false;
    
    this.studentService.getStudents({
      branch_id: this.selectedBranch,
      grade: this.selectedGrade,
      section: this.selectedSection
    }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          
          this.students = response.data.map((student: any) => {
            const userId = student.user_id || student.id;

            // Prefer academic-year-aware fields if present
            const grade = student.current_grade ?? student.grade ?? this.selectedGrade ?? '';
            const section = student.current_section ?? student.section ?? this.selectedSection ?? '';

            return {
              id: userId,
              first_name: student.first_name || '',
              last_name: student.last_name || '',
              admission_number: student.admission_number || '',
              roll_number: student.roll_number || '',
              phone: student.phone || '',
              grade: grade,
              section: section,
              status: 'Present', // Default to Present
              remarks: ''
            };
          });
          
          // Filter out any students without IDs
          this.students = this.students.filter(s => s.id);
          
          // Auto-mark all rows as touched since they all have default "Present" status
          this.students.forEach((_, index) => {
            this.touchedRows.add(index);
          });
          
          if (this.students.length === 0) {
            this.errorHandler.showWarning('No students found for selected class');
          } else {

          }
          
          this.studentsLoaded = true;
          
          // Check for existing attendance after loading students
          this.loadExistingAttendance();
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
    if (!this.selectedBranch) {
      this.errorHandler.showWarning('Please select branch');
      return;
    }

    this.loading = true;
    this.teachersLoaded = false;
    
    // Reset validation state
    this.touchedRows.clear();
    this.showValidation = false;

    this.teacherService.getTeachers({
      branch_id: this.selectedBranch,
      is_active: true
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          
          this.teachers = response.data.map((teacher: any) => {
            const userId = teacher.user_id || teacher.id;
            
            if (!userId) {
            }
            
            // Get name from teacher or user object
            const firstName = teacher.first_name || teacher.user?.first_name || '';
            const lastName = teacher.last_name || teacher.user?.last_name || '';
            const email = teacher.email || teacher.user?.email || '';
            const phone = teacher.phone || teacher.user?.phone || '';
            
            return {
              id: userId,
              first_name: firstName,
              last_name: lastName,
              employee_id: teacher.employee_id || '',
              email: email,
              phone: phone,
              department: teacher.department?.name || 'N/A',
              status: 'Present', // Default to Present
              remarks: ''
            };
          });
          
          // Filter out any teachers without IDs
          this.teachers = this.teachers.filter(t => t.id);
          
          // Auto-mark all rows as touched since they all have default "Present" status
          this.teachers.forEach((_, index) => {
            this.touchedRows.add(index);
          });
          
          if (this.teachers.length === 0) {
            this.errorHandler.showWarning('No teachers found for selected branch');
          } else {

          }
          
          this.teachersLoaded = true;
          
          // Check for existing attendance after loading teachers
          this.loadExistingAttendance();
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }
  
  onAttendanceTypeChange(): void {
    this.studentsLoaded = false;
    this.teachersLoaded = false;
    this.students = [];
    this.teachers = [];
    this.isUpdateMode = false;
    this.existingAttendanceLoaded = false;
    this.touchedRows.clear();
    this.showValidation = false;
    
    // Reset filters when type changes
    this.selectedBranch = null;
    this.selectedGrade = null;
    this.selectedSection = null;
    this.sections = [];
  }
  
  loadAttendance(): void {
    if (this.attendanceType === 'student') {
      this.loadStudents();
    } else {
      this.loadTeachers();
    }
  }
  
  setStatusForAll(status: string): void {
    if (this.attendanceType === 'student') {
      this.students.forEach((student, index) => {
        student.status = status as any;
        this.touchedRows.add(index); // Mark all rows as touched
      });
    } else {
      this.teachers.forEach((teacher, index) => {
        teacher.status = status as any;
        this.touchedRows.add(index); // Mark all rows as touched
      });
    }
  }
  
  setStudentStatus(student: AttendanceStudent, status: string): void {
    const index = this.students.indexOf(student);
    
    // If clicking the same status (unchecking), clear the status
    if (student.status === status) {
      student.status = '' as any;
      // Remove from touched rows when unchecked
      if (index !== -1) {
        this.touchedRows.delete(index);
      }
    } else {
      // Set new status
      student.status = status as any;
      // Mark row as touched
      if (index !== -1) {
        this.touchedRows.add(index);
      }
    }
  }
  
  setTeacherStatus(teacher: any, status: string): void {
    const index = this.teachers.indexOf(teacher);
    
    // If clicking the same status (unchecking), clear the status
    if (teacher.status === status) {
      teacher.status = '';
      // Remove from touched rows when unchecked
      if (index !== -1) {
        this.touchedRows.delete(index);
      }
    } else {
      // Set new status
      teacher.status = status;
      // Mark row as touched
      if (index !== -1) {
        this.touchedRows.add(index);
      }
    }
  }
  
  /**
   * Check if a row has validation errors
   */
  hasRowError(index: number): boolean {
    if (!this.showValidation) return false;
    
    // Check if row is not touched OR has empty status
    if (!this.touchedRows.has(index)) return true;
    
    // Also check if the status is actually selected
    if (this.attendanceType === 'student') {
      const student = this.students[index];
      return !student || !student.status || student.status.trim() === '';
    } else {
      const teacher = this.teachers[index];
      return !teacher || !teacher.status || teacher.status.trim() === '';
    }
  }
  
  /**
   * Validate all rows before submission
   */
  validateRows(): boolean {
    if (this.attendanceType === 'student') {
      // Check each student has a valid status
      for (let i = 0; i < this.students.length; i++) {
        const student = this.students[i];
        if (!student.status || student.status.trim() === '') {
          return false;
        }
      }
    } else {
      // Check each teacher has a valid status
      for (let i = 0; i < this.teachers.length; i++) {
        const teacher = this.teachers[i];
        if (!teacher.status || teacher.status.trim() === '') {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Get untouched rows for error message
   */
  getUntouchedRowsCount(): number {
    let untouched = 0;
    
    if (this.attendanceType === 'student') {
      for (let i = 0; i < this.students.length; i++) {
        const student = this.students[i];
        if (!student.status || student.status.trim() === '') {
          untouched++;
        }
      }
    } else {
      for (let i = 0; i < this.teachers.length; i++) {
        const teacher = this.teachers[i];
        if (!teacher.status || teacher.status.trim() === '') {
          untouched++;
        }
      }
    }
    
    return untouched;
  }
  
  getCheckboxColor(status: string): 'primary' | 'accent' | 'warn' {
    if (status === 'Present') return 'primary';
    if (status === 'Absent') return 'warn';
    return 'accent';
  }
  
  onSubmit(): void {
    // Show validation errors
    this.showValidation = true;
    
    // Basic validations
    if (!this.selectedBranch || !this.selectedDate) {
      this.errorHandler.showWarning('Please select Branch and Date');
      return;
    }
    
    if (this.attendanceType === 'student' && this.students.length === 0) {
      this.errorHandler.showWarning('No students to mark attendance');
      return;
    }
    
    if (this.attendanceType === 'teacher' && this.teachers.length === 0) {
      this.errorHandler.showWarning('No teachers to mark attendance');
      return;
    }
    
    // Validate that all rows have been checked (status selected)
    if (!this.validateRows()) {
      const untouchedCount = this.getUntouchedRowsCount();
      const entityType = this.attendanceType === 'student' ? 'student' : 'teacher';
      this.errorHandler.showWarning(
        `Please select attendance status for all ${entityType}s. ${untouchedCount} ${entityType}${untouchedCount > 1 ? 's' : ''} need attention.`
      );
      
      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('.row-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }
    
    this.submitting = true;
    
    const bulkData: BulkAttendanceRequest = {
      type: this.attendanceType,
      date: this.formatDateForApi(this.selectedDate)!,
      branch_id: this.selectedBranch,
      academic_year: this.academicYear,
      attendance: this.attendanceType === 'student' 
        ? this.students.map(student => {
            // Ensure id exists
            if (!student.id) {
            }
            return {
              id: student.id,
              status: student.status || 'Present',
              remarks: student.remarks || '',
              grade_level: student.grade,
              section: student.section
            };
          })
        : this.teachers.map(teacher => {
            // Ensure id exists
            if (!teacher.id) {
            }
            return {
              id: teacher.id,
              status: teacher.status || 'Present',
              remarks: teacher.remarks || ''
            };
          })
    };
    
    // Debug log
    
    this.attendanceService.markBulkAttendance(bulkData).subscribe({
      next: (response: any) => {
        this.submitting = false;
        if (response.success) {
          const count = response.data?.marked || (this.attendanceType === 'student' ? this.students.length : this.teachers.length);
          const type = this.attendanceType === 'student' ? 'students' : 'teachers';
          this.errorHandler.showSuccess(
            `Attendance marked successfully for ${count} ${type}`
          );
          
          if (response.data?.errors && response.data.errors.length > 0) {
          }
          
          // Navigate back to attendance list with the correct tab active
          this.router.navigate(['/attendance'], {
            queryParams: { tab: this.returnTab }
          });
        }
      },
      error: (error: any) => {
        this.submitting = false;
        this.errorHandler.showError(error);
      }
    });
  }
  
  onCancel(): void {
    // Navigate back to attendance list with the correct tab active
    this.router.navigate(['/attendance'], {
      queryParams: { tab: this.returnTab }
    });
  }
  
  getStudentFullName(student: AttendanceStudent): string {
    const firstName = student.first_name || '';
    const lastName = student.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || student.admission_number || 'Unknown Student';
  }
  
  getTeacherFullName(teacher: any): string {
    const firstName = teacher.first_name || '';
    const lastName = teacher.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || teacher.email || 'Unknown Teacher';
  }
  
  getPresentCount(): number {
    if (this.attendanceType === 'student') {
      return this.students.filter(s => s.status === 'Present').length;
    } else {
      return this.teachers.filter(t => t.status === 'Present').length;
    }
  }
  
  getAbsentCount(): number {
    if (this.attendanceType === 'student') {
      return this.students.filter(s => s.status === 'Absent').length;
    } else {
      return this.teachers.filter(t => t.status === 'Absent').length;
    }
  }
  
  private getTodayLocalDate(): Date {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }

  /** YYYY-MM-DD in local timezone for API requests. */
  private formatDateForApi(d: Date | null): string | null {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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
  
  /**
   * Load existing attendance for the selected date
   */
  loadExistingAttendance(): void {
    if (!this.selectedBranch || !this.selectedDate) return;
    
    if (this.attendanceType === 'student' && (!this.selectedGrade || !this.selectedSection)) {
      return;
    }
    
    const params: any = {
      type: this.attendanceType,
      date: this.formatDateForApi(this.selectedDate),
      branch_id: this.selectedBranch
    };
    
    if (this.attendanceType === 'student') {
      params.grade = this.selectedGrade;
      params.section = this.selectedSection;
    }
    
    // Call attendance service to check existing
    this.attendanceService.getAttendance(params).subscribe({
      next: (response) => {
        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          this.isUpdateMode = true;
          this.existingAttendanceLoaded = true;
          
          // Map existing attendance to students/teachers
          if (this.attendanceType === 'student') {
            this.mapExistingAttendanceToStudents(response.data);
          } else {
            this.mapExistingAttendanceToTeachers(response.data);
          }
          
          this.errorHandler.showInfo(
            `Found existing attendance for ${this.formatDateForApi(this.selectedDate)}. You can update it now.`
          );
        } else {
          this.isUpdateMode = false;
          this.existingAttendanceLoaded = false;
        }
      },
      error: (error) => {

        this.isUpdateMode = false;
        this.existingAttendanceLoaded = false;
      }
    });
  }
  
  /**
   * Map existing attendance to students array
   */
  private mapExistingAttendanceToStudents(existingData: any[]): void {
    existingData.forEach((attendance: any) => {
      const student = this.students.find(s => s.id === attendance.student_id);
      if (student) {
        student.status = this.capitalizeStatus(attendance.status);
        student.remarks = attendance.remarks || '';
        
        // Mark as touched since it has existing data
        const index = this.students.indexOf(student);
        if (index !== -1) {
          this.touchedRows.add(index);
        }
      }
    });
  }
  
  /**
   * Map existing attendance to teachers array
   */
  private mapExistingAttendanceToTeachers(existingData: any[]): void {
    existingData.forEach((attendance: any) => {
      const teacher = this.teachers.find(t => t.id === attendance.teacher_id);
      if (teacher) {
        teacher.status = this.capitalizeStatus(attendance.status);
        teacher.remarks = attendance.remarks || '';
        
        // Mark as touched since it has existing data
        const index = this.teachers.indexOf(teacher);
        if (index !== -1) {
          this.touchedRows.add(index);
        }
      }
    });
  }
  
  /**
   * Capitalize status for consistency with UI
   */
  private capitalizeStatus(status: string): 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Sick Leave' | 'Leave' {
    if (!status) return 'Present';
    
    const statusMap: Record<string, 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Sick Leave' | 'Leave'> = {
      'present': 'Present',
      'absent': 'Absent',
      'late': 'Late',
      'excused': 'Late',
      'half-day': 'Half-Day',
      'sick leave': 'Sick Leave',
      'leave': 'Leave',
      'Present': 'Present',
      'Absent': 'Absent',
      'Late': 'Late',
      'Excused': 'Late',
      'Half-Day': 'Half-Day',
      'Sick Leave': 'Sick Leave',
      'Leave': 'Leave'
    };
    
    return statusMap[status.toLowerCase()] || 'Present';
  }
}

