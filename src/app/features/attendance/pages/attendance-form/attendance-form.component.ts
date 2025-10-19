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
  
  attendanceType: 'student' | 'teacher' = 'student';
  isTypeDisabled = false; // Disable type toggle when coming from specific tab
  returnTab: 'student' | 'teacher' = 'student'; // Track which tab to return to
  
  branches: any[] = [];
  grades: Grade[] = [];
  sections: Section[] = [];
  allSections: Section[] = []; // Store all sections for filtering
  students: AttendanceStudent[] = [];
  teachers: any[] = [];
  
  selectedBranch: number | null = null;
  selectedGrade: string | null = null;
  selectedSection: string | null = null;
  selectedDate: string = this.getTodayDate();
  academicYear: string = this.getCurrentAcademicYear();
  
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
      console.log('Attendance Form - Type:', this.attendanceType, 'Return Tab:', this.returnTab, 'Disabled:', this.isTypeDisabled);
    });
    
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
  
  /**
   * Load grades dynamically
   */
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
  
  /**
   * Load all sections for filtering
   */
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
  
  /**
   * Update sections when grade or branch changes
   */
  onGradeOrBranchChange(): void {
    if (this.selectedGrade && this.selectedBranch) {
      // Filter sections by selected grade and branch
      this.sections = this.allSections.filter(
        section => section.grade_level === this.selectedGrade && 
                   section.branch_id === this.selectedBranch
      );
    } else if (this.selectedGrade) {
      // Filter by grade only
      this.sections = this.allSections.filter(
        section => section.grade_level === this.selectedGrade
      );
    } else if (this.selectedBranch) {
      // Filter by branch only
      this.sections = this.allSections.filter(
        section => section.branch_id === this.selectedBranch
      );
    } else {
      this.sections = [];
    }
    
    // Reset section selection if current selection is not in filtered list
    if (this.selectedSection && !this.sections.find(s => s.name === this.selectedSection)) {
      this.selectedSection = null;
    }
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
          console.log('Students API response:', response.data);
          
          this.students = response.data.map((student: any) => {
            const userId = student.user_id || student.id;
            
            if (!userId) {
              console.error('Student without user_id:', student);
            }
            
            return {
              id: userId,
              first_name: student.first_name || '',
              last_name: student.last_name || '',
              admission_number: student.admission_number || '',
              roll_number: student.roll_number || '',
              grade: student.grade || '',
              section: student.section || '',
              status: 'Present',
              remarks: ''
            };
          });
          
          // Filter out any students without IDs
          this.students = this.students.filter(s => s.id);
          
          if (this.students.length === 0) {
            this.errorHandler.showWarning('No students found for selected class');
          } else {
            console.log('Loaded students:', this.students.length, 'students with IDs');
          }
          
          this.studentsLoaded = true;
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

    this.teacherService.getTeachers({
      branch_id: this.selectedBranch,
      is_active: true
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('Teachers API response:', response.data);
          
          this.teachers = response.data.map((teacher: any) => {
            const userId = teacher.user_id || teacher.id;
            
            if (!userId) {
              console.error('Teacher without user_id:', teacher);
            }
            
            return {
              id: userId,
              first_name: teacher.first_name || '',
              last_name: teacher.last_name || '',
              employee_id: teacher.employee_id || '',
              email: teacher.email || '',
              department: teacher.department?.name || 'N/A',
              status: 'Present',
              remarks: ''
            };
          });
          
          // Filter out any teachers without IDs
          this.teachers = this.teachers.filter(t => t.id);
          
          if (this.teachers.length === 0) {
            this.errorHandler.showWarning('No teachers found for selected branch');
          } else {
            console.log('Loaded teachers:', this.teachers.length, 'teachers with IDs');
          }
          
          this.teachersLoaded = true;
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
      this.students.forEach(student => {
        student.status = status as any;
      });
    } else {
      this.teachers.forEach(teacher => {
        teacher.status = status as any;
      });
    }
  }
  
  setStudentStatus(student: AttendanceStudent, status: string): void {
    student.status = status as any;
  }
  
  setTeacherStatus(teacher: any, status: string): void {
    teacher.status = status;
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
    
    if (this.attendanceType === 'student' && this.students.length === 0) {
      this.errorHandler.showWarning('No students to mark attendance');
      return;
    }
    
    if (this.attendanceType === 'teacher' && this.teachers.length === 0) {
      this.errorHandler.showWarning('No teachers to mark attendance');
      return;
    }
    
    this.submitting = true;
    
    const bulkData: BulkAttendanceRequest = {
      type: this.attendanceType,
      date: this.selectedDate,
      branch_id: this.selectedBranch,
      academic_year: this.academicYear,
      attendance: this.attendanceType === 'student' 
        ? this.students.map(student => {
            // Ensure id exists
            if (!student.id) {
              console.error('Student missing id:', student);
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
              console.error('Teacher missing id:', teacher);
            }
            return {
              id: teacher.id,
              status: teacher.status || 'Present',
              remarks: teacher.remarks || ''
            };
          })
    };
    
    // Debug log
    console.log('Submitting bulk attendance:', bulkData);
    
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
            console.warn('Some errors occurred:', response.data.errors);
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
    return `${student.first_name} ${student.last_name}`;
  }
  
  getTeacherFullName(teacher: any): string {
    return `${teacher.first_name} ${teacher.last_name}`;
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

