import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Student } from '../../../../../../core/models/student.model';
import { ExamScheduleService } from '../../../../../exams/services/exam-schedule.service';
import { ApiService } from '../../../../../../core/services/api.service';
import { ErrorHandlerService } from '../../../../../../core/services/error-handler.service';

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './student-exams.component.html',
  styleUrls: ['./student-exams.component.scss']
})
export class StudentExamsComponent implements OnInit {
  @Input() student?: Student;
  
  upcomingExams: any[] = [];
  examResults: any[] = [];
  isLoading = false;

  constructor(
    private examScheduleService: ExamScheduleService,
    private apiService: ApiService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadExamsData();
  }

  loadExamsData(): void {
    if (!this.student || !this.student.user_id) {
      return;
    }
    
    this.isLoading = true;
    const userId = this.student.user_id || this.student.id;
    
    // Load upcoming exam schedules
    this.examScheduleService.getSchedules({
      student_id: this.student.id,
      upcoming: true
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.upcomingExams = response.data.map((schedule: any) => ({
            exam_name: schedule.exam?.name || 'Exam',
            subject_name: schedule.subject?.name || 'Subject',
            exam_date: schedule.exam_date,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            duration: schedule.duration,
            room_number: schedule.room_number,
            total_marks: schedule.total_marks,
            passing_marks: schedule.passing_marks
          }));
        } else {
          this.upcomingExams = [];
        }
      },
      error: (error) => {
        console.error('Error loading upcoming exams:', error);
        this.upcomingExams = [];
      }
    });

    // Load exam results
    this.apiService.get(`/exam-marks/student/${userId}`).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.examResults = response.data.map((result: any) => ({
            exam_name: result.exam_name || 'Exam',
            subject_name: result.subject_name || 'Subject',
            exam_date: result.exam_date,
            marks_obtained: result.marks_obtained,
            total_marks: result.total_marks,
            passing_marks: result.passing_marks,
            percentage: result.percentage,
            grade: result.grade,
            is_pass: result.is_pass
          }));
        } else {
          this.examResults = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading exam results:', error);
        if (error.status !== 404) {
          this.errorHandler.showError('Failed to load exam results');
        }
        this.examResults = [];
        this.isLoading = false;
      }
    });
  }

  getExamStatusClass(examDate: string): string {
    const examDateTime = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDateTime.setHours(0, 0, 0, 0);
    
    if (examDateTime < today) return 'status-past';
    if (examDateTime.getTime() === today.getTime()) return 'status-today';
    return 'status-upcoming';
  }

  getExamStatusText(examDate: string): string {
    const examDateTime = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDateTime.setHours(0, 0, 0, 0);
    
    const diffTime = examDateTime.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return 'Upcoming';
  }

  getResultClass(obtained: number, total: number, passing: number): string {
    const percentage = (obtained / total) * 100;
    if (percentage >= 90) return 'score-excellent';
    if (percentage >= 75) return 'score-good';
    if (percentage >= 60) return 'score-average';
    if (obtained >= passing) return 'score-pass';
    return 'score-fail';
  }

  getPercentage(obtained: number, total: number): number {
    return Math.round((obtained / total) * 100);
  }

  getStatusClass(isPass: boolean): string {
    return isPass ? 'status-pass' : 'status-fail';
  }
}
