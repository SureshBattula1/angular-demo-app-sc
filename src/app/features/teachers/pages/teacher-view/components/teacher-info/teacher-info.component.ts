import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Teacher } from '../../../../../../core/models/teacher.model';
import { UniversalAttachmentsComponent } from '../../../../../../shared/components/universal-attachments/universal-attachments.component';

@Component({
  selector: 'app-teacher-info',
  standalone: true,
  imports: [CommonModule, MaterialModule, UniversalAttachmentsComponent],
  templateUrl: './teacher-info.component.html',
  styleUrls: ['./teacher-info.component.scss']
})
export class TeacherInfoComponent {
  @Input() teacher!: Teacher;

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

  getCategoryColor(category: string): string {
    return category === 'Teaching' ? 'category-teaching' : 'category-non-teaching';
  }
}

