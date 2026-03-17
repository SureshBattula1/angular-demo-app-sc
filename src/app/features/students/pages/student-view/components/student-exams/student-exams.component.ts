import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { jsPDF } from 'jspdf';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Student } from '../../../../../../core/models/student.model';
import { ExamScheduleService } from '../../../../../exams/services/exam-schedule.service';
import { ApiService } from '../../../../../../core/services/api.service';
import { ErrorHandlerService } from '../../../../../../core/services/error-handler.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './student-exams.component.html',
  styleUrls: ['./student-exams.component.scss']
})
export class StudentExamsComponent implements OnInit, OnChanges {
  @Input() student?: Student;
  
  upcomingExams: any[] = [];
  examResults: any[] = [];
  /** Upcoming exams grouped by exam (e.g. Mid1 -> [Maths, Computer]) */
  upcomingExamsByExam: { examId: number; examName: string; examTermName?: string; schedules: any[] }[] = [];
  /** Exam results grouped by exam (e.g. Mid1 -> [Maths result, Computer result]) */
  examResultsByExam: { examId: number; examName: string; examTermName?: string; results: any[] }[] = [];
  isLoading = false;
  downloadingSchedulesPdf = false;
  downloadingResultsPdf = false;
  downloadingScheduleGroupId: number | string | null = null;
  downloadingResultGroupId: number | string | null = null;

  constructor(
    private examScheduleService: ExamScheduleService,
    private apiService: ApiService,
    private errorHandler: ErrorHandlerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadExamsData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['student'] && this.student?.user_id) {
      this.loadExamsData();
    }
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
          this.upcomingExams = response.data.map((schedule: any) => {
            const inv = schedule.invigilator;
            const invigilatorName = inv ? `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || null : null;
            return {
              exam_id: schedule.exam_id ?? schedule.exam?.id,
              exam_name: schedule.exam?.name || 'Exam',
              exam_term_name: schedule.exam?.exam_term?.name ?? null,
              subject_name: schedule.subject?.name || 'Subject',
              exam_date: schedule.exam_date,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              duration: schedule.duration,
              room_number: schedule.room_number,
              invigilator_name: invigilatorName,
              instructions: schedule.instructions || null,
              total_marks: schedule.total_marks,
              passing_marks: schedule.passing_marks
            };
          });
          this.upcomingExamsByExam = this.groupSchedulesByExam(this.upcomingExams);
        } else {
          this.upcomingExams = [];
          this.upcomingExamsByExam = [];
        }
      },
      error: (error) => {
        console.error('Error loading upcoming exams:', error);
        this.upcomingExams = [];
        this.upcomingExamsByExam = [];
      }
    });

    // Load exam results
    this.apiService.get(`/exam-marks/student/${userId}`).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.examResults = response.data.map((result: any) => ({
            exam_id: result.exam_id ?? null,
            exam_name: result.exam_name || 'Exam',
            exam_term_name: result.exam_term_name ?? null,
            subject_name: result.subject_name || 'Subject',
            exam_date: result.exam_date,
            marks_obtained: result.marks_obtained,
            total_marks: result.total_marks,
            passing_marks: result.passing_marks,
            percentage: result.percentage,
            grade: result.grade,
            is_pass: result.is_pass,
            remarks: result.remarks || null
          }));
          this.examResultsByExam = this.groupResultsByExam(this.examResults);
        } else {
          this.examResults = [];
          this.examResultsByExam = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading exam results:', error);
        if (error.status !== 404) {
          this.errorHandler.showError('Failed to load exam results');
        }
        this.examResults = [];
        this.examResultsByExam = [];
        this.isLoading = false;
      }
    });
  }

  /** Group upcoming schedules by exam (e.g. Mid1 -> [Maths, Computer]) */
  private groupSchedulesByExam(schedules: any[]): { examId: number; examName: string; examTermName?: string; schedules: any[] }[] {
    const map = new Map<number | string, { examId: number; examName: string; examTermName?: string; schedules: any[] }>();
    for (const s of schedules) {
      const key = s.exam_id ?? s.exam_name;
      if (!map.has(key)) {
        map.set(key, {
          examId: s.exam_id ?? 0,
          examName: s.exam_name,
          examTermName: s.exam_term_name ?? undefined,
          schedules: []
        });
      }
      map.get(key)!.schedules.push(s);
    }
    return Array.from(map.values());
  }

  /** Group exam results by exam (e.g. Mid1 -> [Maths result, Computer result]) */
  private groupResultsByExam(results: any[]): { examId: number; examName: string; examTermName?: string; results: any[] }[] {
    const map = new Map<number | string, { examId: number; examName: string; examTermName?: string; results: any[] }>();
    for (const r of results) {
      const key = r.exam_id ?? r.exam_name;
      if (!map.has(key)) {
        map.set(key, {
          examId: r.exam_id ?? 0,
          examName: r.exam_name,
          examTermName: r.exam_term_name ?? undefined,
          results: []
        });
      }
      map.get(key)!.results.push(r);
    }
    return Array.from(map.values());
  }

  getExamStatusClass(examDate: string | undefined): string {
    if (!examDate) return 'status-upcoming';
    const examDateTime = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDateTime.setHours(0, 0, 0, 0);
    
    if (examDateTime < today) return 'status-past';
    if (examDateTime.getTime() === today.getTime()) return 'status-today';
    return 'status-upcoming';
  }

  getExamStatusText(examDate: string | undefined): string {
    if (!examDate) return 'Upcoming';
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

  downloadUpcomingSchedulesPdf(): void {
    if (this.upcomingExamsByExam.length === 0) {
      this.snackBar.open('No upcoming exams to download', 'Close', { duration: 3000 });
      return;
    }
    this.downloadingSchedulesPdf = true;
    try {
      const doc = new jsPDF();
      const studentName = this.student ? `${this.student.first_name || ''} ${this.student.last_name || ''}`.trim() : 'Student';
      const pageW = 210;
      let y = 18;

      // Header banner - blue
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Upcoming Exam Schedules', 14, 16);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Student: ${studentName}`, 14, 24);
      doc.setTextColor(31, 41, 55);
      y = 38;

      for (const group of this.upcomingExamsByExam) {
        if (y > 255) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        const examTitle = group.examTermName ? `${group.examTermName} - ${group.examName}` : group.examName;
        doc.text(examTitle, 14, y);
        y += 10;

        // Table header
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 4, pageW - 28, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, y - 4, pageW - 28, 8);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('Subject', 18, y + 1);
        doc.text('Date', 52, y + 1);
        doc.text('Time', 78, y + 1);
        doc.text('Room', 118, y + 1);
        doc.text('Marks', 168, y + 1);
        y += 12;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        let rowAlt = false;
        for (const s of group.schedules) {
          if (y > 268) { doc.addPage(); y = 20; }
          if (rowAlt) { doc.setFillColor(248, 250, 252); doc.rect(14, y - 5, pageW - 28, 9, 'F'); }
          doc.setFontSize(10);
          const dateStr = s.exam_date ? new Date(s.exam_date).toLocaleDateString() : 'TBA';
          doc.text(s.subject_name, 18, y + 1);
          doc.text(dateStr, 52, y + 1);
          doc.text(`${s.start_time || '–'} - ${s.end_time || '–'}`, 78, y + 1);
          doc.text(s.room_number || 'TBA', 118, y + 1);
          doc.text(String(s.total_marks), 168, y + 1);
          y += 8;
          if (s.instructions) {
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
            doc.text(`Instructions: ${String(s.instructions).substring(0, 90)}${String(s.instructions).length > 90 ? '...' : ''}`, 18, y + 1);
            y += 7;
            doc.setTextColor(31, 41, 55);
          }
          rowAlt = !rowAlt;
        }
        y += 10;
      }

      const fileName = `upcoming-exam-schedules-${studentName.replace(/\s+/g, '-')}.pdf`;
      doc.save(fileName);
      this.snackBar.open('PDF downloaded successfully', 'Close', { duration: 3000 });
    } catch (e) {
      this.errorHandler.handleError(e);
      this.snackBar.open('Failed to generate PDF', 'Close', { duration: 3000 });
    } finally {
      this.downloadingSchedulesPdf = false;
    }
  }

  downloadUpcomingGroupPdf(group: { examId: number; examName: string; examTermName?: string; schedules: any[] }): void {
    const key = group.examId || group.examName;
    this.downloadingScheduleGroupId = key;
    try {
      const doc = new jsPDF();
      const studentName = this.student ? `${this.student.first_name || ''} ${this.student.last_name || ''}`.trim() : 'Student';
      const pageW = 210;
      const examTitle = group.examTermName ? `${group.examTermName} - ${group.examName}` : group.examName;
      let y = 18;

      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Upcoming Exam Schedule', 14, 14);
      doc.setFontSize(12);
      doc.text(examTitle, 14, 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Student: ${studentName}`, 14, 26);
      doc.setTextColor(31, 41, 55);
      y = 38;

      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, pageW - 28, 8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y - 4, pageW - 28, 8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Subject', 18, y + 1);
      doc.text('Date', 52, y + 1);
      doc.text('Time', 78, y + 1);
      doc.text('Room', 118, y + 1);
      doc.text('Marks', 168, y + 1);
      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      let rowAlt = false;
      for (const s of group.schedules) {
        if (rowAlt) { doc.setFillColor(248, 250, 252); doc.rect(14, y - 5, pageW - 28, 9, 'F'); }
        doc.setFontSize(10);
        const dateStr = s.exam_date ? new Date(s.exam_date).toLocaleDateString() : 'TBA';
        doc.text(s.subject_name, 18, y + 1);
        doc.text(dateStr, 52, y + 1);
        doc.text(`${s.start_time || '–'} - ${s.end_time || '–'}`, 78, y + 1);
        doc.text(s.room_number || 'TBA', 118, y + 1);
        doc.text(String(s.total_marks), 168, y + 1);
        y += 8;
        if (s.instructions) {
          doc.setFontSize(9);
          doc.setTextColor(107, 114, 128);
          doc.text(`Instructions: ${String(s.instructions).substring(0, 90)}${String(s.instructions).length > 90 ? '...' : ''}`, 18, y + 1);
          y += 7;
          doc.setTextColor(31, 41, 55);
        }
        rowAlt = !rowAlt;
      }

      const safeName = examTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
      doc.save(`upcoming-schedule-${safeName}.pdf`);
      this.snackBar.open('PDF downloaded successfully', 'Close', { duration: 3000 });
    } catch (e) {
      this.errorHandler.handleError(e);
      this.snackBar.open('Failed to generate PDF', 'Close', { duration: 3000 });
    } finally {
      this.downloadingScheduleGroupId = null;
    }
  }

  downloadExamResultGroupPdf(group: { examId: number; examName: string; examTermName?: string; results: any[] }): void {
    const key = group.examId || group.examName;
    this.downloadingResultGroupId = key;
    try {
      const doc = new jsPDF();
      const studentName = this.student ? `${this.student.first_name || ''} ${this.student.last_name || ''}`.trim() : 'Student';
      const pageW = 210;
      const examTitle = group.examTermName ? `${group.examTermName} - ${group.examName}` : group.examName;
      let y = 18;

      doc.setFillColor(20, 184, 166);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Exam Results', 14, 14);
      doc.setFontSize(12);
      doc.text(examTitle, 14, 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Student: ${studentName}`, 14, 26);
      doc.setTextColor(31, 41, 55);
      y = 38;

      doc.setFillColor(240, 253, 250);
      doc.rect(14, y - 4, pageW - 28, 8, 'F');
      doc.setDrawColor(153, 246, 228);
      doc.rect(14, y - 4, pageW - 28, 8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(19, 78, 74);
      doc.text('Subject', 18, y + 1);
      doc.text('Marks', 60, y + 1);
      doc.text('Grade', 95, y + 1);
      doc.text('Status', 125, y + 1);
      doc.text('Date', 155, y + 1);
      y += 12;

      doc.setFont('helvetica', 'normal');
      let rowAlt = false;
      for (const r of group.results) {
        if (rowAlt) { doc.setFillColor(240, 253, 250); doc.rect(14, y - 5, pageW - 28, 9, 'F'); }
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(10);
        const dateStr = r.exam_date ? new Date(r.exam_date).toLocaleDateString() : '';
        const pct = this.getPercentage(r.marks_obtained, r.total_marks);
        const status = r.is_pass ? 'Pass' : 'Fail';
        doc.text(r.subject_name, 18, y + 1);
        doc.text(`${r.marks_obtained}/${r.total_marks} (${pct}%)`, 60, y + 1);
        doc.setFont('helvetica', 'bold');
        doc.text(r.grade, 95, y + 1);
        doc.setFont('helvetica', 'normal');
        if (r.is_pass) { doc.setTextColor(34, 197, 94); } else { doc.setTextColor(239, 68, 68); }
        doc.text(status, 125, y + 1);
        doc.setTextColor(107, 114, 128);
        doc.text(dateStr, 155, y + 1);
        doc.setTextColor(31, 41, 55);
        y += 8;
        if (r.remarks) {
          doc.setFontSize(9);
          doc.setFillColor(254, 252, 232);
          doc.rect(18, y - 2, pageW - 36, 8, 'F');
          doc.setTextColor(113, 63, 18);
          doc.text(`Comment: ${String(r.remarks).substring(0, 95)}${String(r.remarks).length > 95 ? '...' : ''}`, 22, y + 3);
          y += 12;
        }
        rowAlt = !rowAlt;
      }

      const safeName = examTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
      doc.save(`exam-results-${safeName}.pdf`);
      this.snackBar.open('PDF downloaded successfully', 'Close', { duration: 3000 });
    } catch (e) {
      this.errorHandler.handleError(e);
      this.snackBar.open('Failed to generate PDF', 'Close', { duration: 3000 });
    } finally {
      this.downloadingResultGroupId = null;
    }
  }

  isDownloadingScheduleGroup(group: any): boolean {
    const key = group.examId ?? group.examName;
    return this.downloadingScheduleGroupId === key;
  }

  isDownloadingResultGroup(group: any): boolean {
    const key = group.examId ?? group.examName;
    return this.downloadingResultGroupId === key;
  }

  downloadExamResultsPdf(): void {
    if (this.examResultsByExam.length === 0) {
      this.snackBar.open('No exam results to download', 'Close', { duration: 3000 });
      return;
    }
    this.downloadingResultsPdf = true;
    try {
      const doc = new jsPDF();
      const studentName = this.student ? `${this.student.first_name || ''} ${this.student.last_name || ''}`.trim() : 'Student';
      const pageW = 210;
      let y = 18;

      // Header banner - teal/green
      doc.setFillColor(20, 184, 166);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Exam Results', 14, 16);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Student: ${studentName}`, 14, 24);
      doc.setTextColor(31, 41, 55);
      y = 38;

      for (const group of this.examResultsByExam) {
        if (y > 255) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 148, 136);
        const examTitle = group.examTermName ? `${group.examTermName} - ${group.examName}` : group.examName;
        doc.text(examTitle, 14, y);
        y += 10;

        // Table header
        doc.setFillColor(240, 253, 250);
        doc.rect(14, y - 4, pageW - 28, 8, 'F');
        doc.setDrawColor(153, 246, 228);
        doc.rect(14, y - 4, pageW - 28, 8);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(19, 78, 74);
        doc.text('Subject', 18, y + 1);
        doc.text('Marks', 60, y + 1);
        doc.text('Grade', 95, y + 1);
        doc.text('Status', 125, y + 1);
        doc.text('Date', 155, y + 1);
        y += 12;

        doc.setFont('helvetica', 'normal');
        let rowAlt = false;
        for (const r of group.results) {
          if (y > 268) { doc.addPage(); y = 20; }
          if (rowAlt) { doc.setFillColor(240, 253, 250); doc.rect(14, y - 5, pageW - 28, 9, 'F'); }
          doc.setTextColor(31, 41, 55);
          doc.setFontSize(10);
          const dateStr = r.exam_date ? new Date(r.exam_date).toLocaleDateString() : '';
          const pct = this.getPercentage(r.marks_obtained, r.total_marks);
          const status = r.is_pass ? 'Pass' : 'Fail';
          doc.text(r.subject_name, 18, y + 1);
          doc.text(`${r.marks_obtained}/${r.total_marks} (${pct}%)`, 60, y + 1);
          doc.setFont('helvetica', 'bold');
          doc.text(r.grade, 95, y + 1);
          doc.setFont('helvetica', 'normal');
          if (r.is_pass) { doc.setTextColor(34, 197, 94); } else { doc.setTextColor(239, 68, 68); }
          doc.text(status, 125, y + 1);
          doc.setTextColor(107, 114, 128);
          doc.text(dateStr, 155, y + 1);
          doc.setTextColor(31, 41, 55);
          y += 8;
          if (r.remarks) {
            doc.setFontSize(9);
            doc.setFillColor(254, 252, 232);
            doc.rect(18, y - 2, pageW - 36, 8, 'F');
            doc.setTextColor(113, 63, 18);
            doc.text(`Comment: ${String(r.remarks).substring(0, 95)}${String(r.remarks).length > 95 ? '...' : ''}`, 22, y + 3);
            y += 12;
          }
          rowAlt = !rowAlt;
        }
        y += 10;
      }

      const fileName = `exam-results-${studentName.replace(/\s+/g, '-')}.pdf`;
      doc.save(fileName);
      this.snackBar.open('PDF downloaded successfully', 'Close', { duration: 3000 });
    } catch (e) {
      this.errorHandler.handleError(e);
      this.snackBar.open('Failed to generate PDF', 'Close', { duration: 3000 });
    } finally {
      this.downloadingResultsPdf = false;
    }
  }
}
