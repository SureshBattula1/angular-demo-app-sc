import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Student } from '../../../../../../core/models/student.model';

@Component({
  selector: 'app-student-header',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './student-header.component.html',
  styleUrls: ['./student-header.component.scss']
})
export class StudentHeaderComponent {
  @Input() student!: Student;
  @Input() showProfilePicture = false;
  @Input() profilePictureUrl = '';
  @Input() activeMenu: 'info' | 'attendance' | 'leaves' | 'exams' | 'fees' | 'library' = 'info';
  
  @Output() menuClick = new EventEmitter<'info' | 'attendance' | 'leaves' | 'exams' | 'fees' | 'library'>();
  @Output() imageLoad = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<void>();

  getFullName(): string {
    if (!this.student) return '';
    const firstName = this.student.user?.first_name || this.student.first_name || '';
    const lastName = this.student.user?.last_name || this.student.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  getGradeLabel(): string {
    if (!this.student?.grade) return '';
    const gradeNumber = parseInt(this.student.grade);
    if (gradeNumber === 1) return `${gradeNumber}st Grade`;
    if (gradeNumber === 2) return `${gradeNumber}nd Grade`;
    if (gradeNumber === 3) return `${gradeNumber}rd Grade`;
    return `${gradeNumber}th Grade`;
  }

  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'Active': 'status-active',
      'Inactive': 'status-inactive',
      'Graduated': 'status-graduated',
      'Transferred': 'status-transferred',
      'Suspended': 'status-suspended',
      'Expelled': 'status-expelled'
    };
    return statusColors[status] || 'status-default';
  }

  onMenuClick(menu: 'info' | 'attendance' | 'leaves' | 'exams' | 'fees' | 'library'): void {
    this.menuClick.emit(menu);
  }

  onImageLoad(): void {
    this.imageLoad.emit();
  }

  onImageError(): void {
    this.imageError.emit();
  }
}

