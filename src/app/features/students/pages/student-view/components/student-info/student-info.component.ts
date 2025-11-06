import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Student } from '../../../../../../core/models/student.model';

@Component({
  selector: 'app-student-info',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './student-info.component.html',
  styleUrls: ['./student-info.component.scss']
})
export class StudentInfoComponent {
  @Input() student?: Student;

  getFullName(): string {
    if (!this.student) return '';
    return `${this.student.first_name || ''} ${this.student.last_name || ''}`.trim();
  }

  getAge(): number {
    if (!this.student?.date_of_birth) return 0;
    const dob = new Date(this.student.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  getGradeLabel(): string {
    if (!this.student) return 'N/A';
    return this.student.grade_label || `Grade ${this.student.grade}` || 'N/A';
  }
}
