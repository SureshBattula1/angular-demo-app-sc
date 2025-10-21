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
  teacher: Teacher | null = null;
  isLoading = false;
  teacherId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
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
      next: (response) => {
        if (response.success && response.data) {
          this.teacher = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/teachers']);
      }
    });
  }

  getFullName(): string {
    if (!this.teacher) return '';
    const firstName = this.teacher.user?.first_name || this.teacher.first_name || '';
    const lastName = this.teacher.user?.last_name || this.teacher.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  getAge(): number {
    if (!this.teacher?.date_of_birth) return 0;
    const today = new Date();
    const birthDate = new Date(this.teacher.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getYearsOfService(): number {
    if (!this.teacher?.joining_date) return 0;
    const today = new Date();
    const joiningDate = new Date(this.teacher.joining_date);
    let years = today.getFullYear() - joiningDate.getFullYear();
    const monthDiff = today.getMonth() - joiningDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joiningDate.getDate())) {
      years--;
    }
    return years;
  }

  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'Active': 'status-active',
      'OnLeave': 'status-warning',
      'Resigned': 'status-info',
      'Retired': 'status-info',
      'Terminated': 'status-danger'
    };
    return statusColors[status] || 'status-default';
  }

  getCategoryColor(category: string): string {
    return category === 'Teaching' ? 'category-teaching' : 'category-non-teaching';
  }

  onBack(): void {
    this.router.navigate(['/teachers']);
  }

  onEdit(): void {
    this.router.navigate(['/teachers/edit', this.teacherId]);
  }

  onDelete(): void {
    const teacherName = this.getFullName();
    if (confirm(`Are you sure you want to delete teacher "${teacherName}"?`)) {
      this.teacherService.deleteTeacher(this.teacherId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Teacher deleted successfully');
            this.router.navigate(['/teachers']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
}
