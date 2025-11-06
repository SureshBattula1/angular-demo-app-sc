import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ExamTermService } from '../../services/exam-term.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-exam-term-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './exam-term-view.component.html',
  styleUrls: ['./exam-term-view.component.scss']
})
export class ExamTermViewComponent implements OnInit {
  term: any = null;
  loading = false;
  termId?: number;
  returnTab?: string;

  constructor(
    private examTermService: ExamTermService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.termId = +params['id'];
        this.loadTerm();
      }
    });
    
    // Capture returnTab from query parameters
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'];
    });
  }

  loadTerm(): void {
    if (!this.termId) return;
    
    this.loading = true;
    this.examTermService.getExamTerm(this.termId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.term = response.data;
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
    if (this.termId) {
      this.router.navigate(['/exams/term/edit', this.termId], {
        queryParams: { returnTab: this.returnTab }
      });
    }
  }

  onDelete(): void {
    if (!this.termId) return;
    
    if (confirm('Are you sure you want to delete this exam term?')) {
      this.examTermService.deleteExamTerm(this.termId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Exam term deleted successfully');
            this.router.navigate(['/exams'], { queryParams: { tab: this.returnTab } });
          }
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/exams'], { queryParams: { tab: this.returnTab } });
  }

  getDuration(): string {
    if (!this.term?.start_date || !this.term?.end_date) return 'N/A';
    
    const start = new Date(this.term.start_date);
    const end = new Date(this.term.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} year${Math.ceil(diffDays / 365) > 1 ? 's' : ''}`;
  }
}
