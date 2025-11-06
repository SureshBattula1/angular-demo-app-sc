import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ExamScheduleService } from '../../services/exam-schedule.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ApiService } from '../../../../core/services/api.service';

interface StudentMark {
  id: number;
  student_id: number;
  roll_number: string;
  name: string;
  admission_number: string;
  marks_obtained?: number | null;
  grade?: string;
  is_absent?: boolean;
  remarks?: string;
}

@Component({
  selector: 'app-enter-marks',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './enter-marks.component.html',
  styleUrls: ['./enter-marks.component.scss']
})
export class EnterMarksComponent implements OnInit {
  loading = false;
  saving = false;
  scheduleId?: number;
  schedule: any = null;
  students: StudentMark[] = [];
  marksForm!: FormGroup;
  returnTab?: string;
  
  // Statistics
  totalStudents = 0;
  passedStudents = 0;
  failedStudents = 0;
  absentStudents = 0;
  averageMarks = 0;

  constructor(
    private fb: FormBuilder,
    private examScheduleService: ExamScheduleService,
    private errorHandler: ErrorHandlerService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.marksForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.scheduleId = +params['schedule_id'];
      this.returnTab = params['returnTab'] || 'schedules';
      if (this.scheduleId) {
        this.loadScheduleData();
      }
    });
  }

  loadScheduleData(): void {
    if (!this.scheduleId) {
      this.errorHandler.showError('Schedule ID is missing');
      return;
    }
    
    this.loading = true;
    this.examScheduleService.getSchedule(this.scheduleId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.schedule = response.data;


          this.loadStudents();
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  loadStudents(): void {
    if (!this.scheduleId) {
      console.error('No schedule ID');
      return;
    }
    
    this.loading = true;

    
    this.examScheduleService.getStudents(this.scheduleId).subscribe({
      next: (response) => {

        if (response.success && response.data && response.data.length > 0) {
          // Transform student data
          this.students = response.data.map((student: any, index: number) => ({
            id: index + 1,
            student_id: student.student_id,
            roll_number: student.roll_number || '',
            name: `${student.first_name} ${student.last_name}`.trim(),
            admission_number: student.admission_number || '',
            marks_obtained: null,
            grade: '',
            is_absent: false,
            remarks: ''
          }));
          

          this.initMarksForm();
          this.totalStudents = this.students.length;
          this.updateStatistics();
        } else {
          console.warn('No students found');
          this.students = [];
          this.totalStudents = 0;
          this.errorHandler.showWarning('No students found for this exam schedule. Please check if students exist for Grade: ' + this.schedule?.grade + ', Section: ' + this.schedule?.section);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.errorHandler.showError(error);
        this.students = [];
        this.totalStudents = 0;
        this.loading = false;
      }
    });
  }

  initMarksForm(): void {
    const formControls: { [key: string]: FormGroup } = {};
    const maxMarks = this.schedule?.total_marks || 100;
    
    this.students.forEach(student => {
      formControls[`student_${student.student_id}`] = this.fb.group({
        marks_obtained: [student.marks_obtained, [
          Validators.required, 
          Validators.min(0), 
          Validators.max(maxMarks)
        ]],
        grade: [student.grade],
        is_absent: [student.is_absent || false],
        remarks: [student.remarks || '']
      });
    });
    
    this.marksForm = this.fb.group(formControls);
    
    // Load existing marks if available
    this.loadExistingMarks();
  }

  onMarkChange(studentId: number): void {
    this.updateStatistics();
  }

  onMarksInput(event: any, studentId: number): void {
    let value = event.target.value;
    const maxMarks = Number(this.schedule?.total_marks) || 100;
    const numericValue = Number(value);
    
    // Validate the value
    if (!isNaN(numericValue) && value !== '') {
      if (numericValue < 0) {
        value = '0';
      } else if (numericValue > maxMarks) {
        value = maxMarks.toString();
      }
    }
    
    this.marksForm.get(`student_${studentId}`)?.get('marks_obtained')?.patchValue(value === '' ? null : value);
    
    // Update grade based on marks
    const gradeControl = this.marksForm.get(`student_${studentId}`)?.get('grade');
    if (gradeControl && value !== '' && !isNaN(numericValue)) {
      gradeControl.patchValue(this.calculateGrade(numericValue, maxMarks));
    }
    
    this.updateStatistics();
  }

  onMarksBlur(event: any, studentId: number): void {
    const value = event.target.value;
    const maxMarks = Number(this.schedule?.total_marks) || 100;
    const numericValue = Number(value);
    
    if (value === '' || isNaN(numericValue)) {
      return;
    }
    
    // Enforce max marks
    let validValue = numericValue;
    if (validValue < 0) {
      validValue = 0;
    } else if (validValue > maxMarks) {
      validValue = maxMarks;
      this.errorHandler.showWarning(`Marks cannot exceed ${maxMarks} (max marks)`);
    }
    
    this.marksForm.get(`student_${studentId}`)?.get('marks_obtained')?.patchValue(validValue);
    
    // Recalculate grade
    const gradeControl = this.marksForm.get(`student_${studentId}`)?.get('grade');
    if (gradeControl) {
      gradeControl.patchValue(this.calculateGrade(validValue, maxMarks));
    }
    
    this.updateStatistics();
  }

  calculateGrade(marks: number, maxMarks: number): string {
    const percentage = (marks / maxMarks) * 100;
    
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  }

  onGradeInput(event: any, studentId: number): void {
    const value = event.target.value;
    this.marksForm.get(`student_${studentId}`)?.get('grade')?.patchValue(value);
  }

  onRemarksInput(event: any, studentId: number): void {
    const value = event.target.value;
    this.marksForm.get(`student_${studentId}`)?.get('remarks')?.patchValue(value);
  }

  onAbsentToggle(event: any, studentId: number): void {
    const checked = event.checked;
    const control = this.marksForm.get(`student_${studentId}`);
    control?.get('is_absent')?.patchValue(checked);
    
    if (checked) {
      control?.get('marks_obtained')?.patchValue(null);
    }
    this.updateStatistics();
  }

  loadExistingMarks(): void {
    if (!this.scheduleId) return;
    
    this.apiService.get(`/exam-marks/schedule/${this.scheduleId}`).subscribe({
      next: (response: any) => {
        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Populate form with existing marks
          response.data.forEach((mark: any) => {
            const studentControl = this.marksForm.get(`student_${mark.student_id}`);
            if (studentControl) {
              studentControl.patchValue({
                marks_obtained: mark.marks_obtained,
                grade: mark.grade,
                is_absent: mark.is_absent,
                remarks: mark.remarks
              });
            }
          });
          this.updateStatistics();
        }
      },
      error: (error) => {
        console.error('Error loading existing marks:', error);
        this.updateStatistics();
      }
    });
  }

  updateStatistics(): void {
    this.totalStudents = this.students.length;
    this.absentStudents = 0;
    this.passedStudents = 0;
    this.failedStudents = 0;
    
    let totalMarks = 0;
    let studentsWithMarks = 0;
    const passingMarks = Number(this.schedule?.passing_marks) || 0;
    


    this.students.forEach(student => {
      const control = this.marksForm.get(`student_${student.student_id}`);
      if (!control) return;
      
      const isAbsent = control.get('is_absent')?.value || false;
      const marks = control.get('marks_obtained')?.value;
      
      if (isAbsent) {
        this.absentStudents++;
      } else if (marks !== null && marks !== undefined && marks !== '') {
        const numericMarks = Number(marks);

        
        if (!isNaN(numericMarks) && numericMarks >= 0) {
          totalMarks += numericMarks;
          studentsWithMarks++;
          
          if (numericMarks >= passingMarks) {
            this.passedStudents++;

          } else {
            this.failedStudents++;
          }
        }
      }
    });

    this.averageMarks = studentsWithMarks > 0 ? Math.round((totalMarks / studentsWithMarks) * 100) / 100 : 0;

  }

  markAllAbsent(): void {
    this.students.forEach(student => {
      this.marksForm.get(`student_${student.student_id}`)?.get('is_absent')?.patchValue(true);
    });
    this.updateStatistics();
  }

  onSubmit(): void {
    this.saving = true;
    const marksData = this.prepareMarksData();
    
    if (!this.scheduleId) {
      this.errorHandler.showError('Schedule ID is missing');
      this.saving = false;
      return;
    }
    
    this.apiService.post(`/exam-marks/schedule/${this.scheduleId}`, { marks: marksData })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Marks submitted successfully');
            this.onBack();
          } else {
            this.errorHandler.showError('Failed to submit marks');
          }
          this.saving = false;
        },
        error: (error) => {
          this.errorHandler.showError(error);
          this.saving = false;
        }
      });
  }

  prepareMarksData(): any[] {
    const marksData: any[] = [];
    
    this.students.forEach(student => {
      const control = this.marksForm.get(`student_${student.student_id}`);
      if (!control) return;
      
      const marks = control.get('marks_obtained')?.value;
      const isAbsent = control.get('is_absent')?.value || false;
      const remarks = control.get('remarks')?.value || '';
      
      // Include all students, with null marks if not entered yet
      marksData.push({
        student_id: student.student_id,
        marks_obtained: isAbsent ? 0 : (marks ?? null),
        is_absent: isAbsent,
        remarks: remarks
      });
    });
    
    return marksData;
  }

  onBack(): void {
    this.router.navigate(['/exams'], { queryParams: { tab: this.returnTab } });
  }
}

