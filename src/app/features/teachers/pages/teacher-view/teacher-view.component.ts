import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TeacherService } from '../../services/teacher.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Teacher } from '../../../../core/models/teacher.model';

@Component({
  selector: 'app-teacher-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './teacher-view.component.html',
  styleUrls: ['./teacher-view.component.scss']
})
export class TeacherViewComponent implements OnInit {
  teacher?: Teacher;
  isLoading = true;
  teacherId!: number;

  constructor(
    private teacherService: TeacherService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.teacherId = +params['id'];
        this.loadTeacher();
      }
    });
  }

  loadTeacher(): void {
    this.isLoading = true;
    
    this.teacherService.getTeacher(this.teacherId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.teacher = response.data;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/teachers']);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/teachers/edit', this.teacherId]);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to deactivate teacher "${this.getFullName()}"?`)) {
      this.teacherService.deleteTeacher(this.teacherId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.errorHandler.showSuccess('Teacher deactivated successfully');
            this.router.navigate(['/teachers']);
          }
        },
        error: (error: any) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/teachers']);
  }

  getFullName(): string {
    return `${this.teacher?.first_name || ''} ${this.teacher?.last_name || ''}`.trim();
  }
}
