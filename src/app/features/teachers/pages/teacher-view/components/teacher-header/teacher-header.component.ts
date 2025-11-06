import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Teacher } from '../../../../../../core/models/teacher.model';

@Component({
  selector: 'app-teacher-header',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './teacher-header.component.html',
  styleUrls: ['./teacher-header.component.scss']
})
export class TeacherHeaderComponent {
  @Input() teacher!: Teacher;
  @Input() showProfilePicture = false;
  @Input() profilePictureUrl = '';
  @Input() activeMenu: 'info' | 'attendance' | 'leaves' = 'info';
  
  @Output() menuClick = new EventEmitter<'info' | 'attendance' | 'leaves'>();
  @Output() imageLoad = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<void>();

  getFullName(): string {
    if (!this.teacher) return '';
    const firstName = this.teacher.user?.first_name || this.teacher.first_name || '';
    const lastName = this.teacher.user?.last_name || this.teacher.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  onMenuClick(menu: 'info' | 'attendance' | 'leaves'): void {
    this.menuClick.emit(menu);
  }

  onImageLoad(): void {
    this.imageLoad.emit();
  }

  onImageError(): void {
    this.imageError.emit();
  }
}

