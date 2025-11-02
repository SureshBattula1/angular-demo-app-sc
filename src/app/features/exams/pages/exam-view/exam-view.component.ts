import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ExamService } from '../../services/exam.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-exam-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './exam-view.component.html',
  styleUrls: ['./exam-view.component.scss']
})
export class ExamViewComponent implements OnInit {
  exam: any = null;
  loading = false;
  examId?: string;

  constructor(
    private examService: ExamService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.examId = params['id'];
        this.loadExam();
      }
    });
  }

  loadExam(): void {
    if (!this.examId) return;
    
    this.loading = true;
    this.examService.getExam(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.exam = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  onEdit(): void {
    if (this.examId) {
      this.router.navigate(['/exams/edit', this.examId]);
    }
  }

  onDelete(): void {
    if (!this.examId) return;
    
    if (confirm('Are you sure you want to delete this exam?')) {
      this.examService.deleteExam(this.examId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Exam deleted successfully');
            this.router.navigate(['/exams']);
          }
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/exams']);
  }

  getDuration(): string {
    if (!this.exam?.start_date || !this.exam?.end_date) return 'N/A';
    
    const start = new Date(this.exam.start_date);
    const end = new Date(this.exam.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} year${Math.ceil(diffDays / 365) > 1 ? 's' : ''}`;
  }
}

