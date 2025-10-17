import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { SubjectService } from '../../services/subject.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Subject } from '../../../../core/models/subject.model';

@Component({
  selector: 'app-subject-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './subject-view.component.html',
  styleUrls: ['./subject-view.component.scss']
})
export class SubjectViewComponent implements OnInit {
  subject?: Subject;
  isLoading = true;
  subjectId!: number;

  constructor(
    private subjectService: SubjectService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.subjectId = +params['id'];
        this.loadSubject();
      }
    });
  }

  loadSubject(): void {
    this.isLoading = true;
    
    this.subjectService.getSubject(this.subjectId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.subject = response.data;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/subjects']);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/subjects/edit', this.subjectId]);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete subject "${this.subject?.name}"?`)) {
      this.subjectService.deleteSubject(this.subjectId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.errorHandler.showSuccess('Subject deleted successfully');
            this.router.navigate(['/subjects']);
          }
        },
        error: (error: any) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/subjects']);
  }
}
