import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { StudentCrudService } from '../../services/student-crud.service';
import { GradeService } from '../../../grades/services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Student } from '../../../../core/models/student.model';

@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './student-view.component.html',
  styleUrls: ['./student-view.component.scss']
})
export class StudentViewComponent implements OnInit {
  student?: Student;
  isLoading = true;
  studentId!: number;
  gradeLabel: string = '';

  constructor(
    private studentCrudService: StudentCrudService,
    private gradeService: GradeService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.studentId = +params['id'];
        this.loadStudent();
      }
    });
  }

  loadStudent(): void {
    this.isLoading = true;
    
    this.studentCrudService.getStudent(this.studentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.student = response.data;
          
          // Debug: Log student data to check what's received
          console.log('Student Data:', this.student);
          console.log('Additional Info Fields:', {
            previous_school: this.student.previous_school,
            previous_grade: this.student.previous_grade,
            medical_history: this.student.medical_history,
            allergies: this.student.allergies,
            medications: this.student.medications,
            height_cm: this.student.height_cm,
            weight_kg: this.student.weight_kg,
            nationality: this.student.nationality,
            mother_tongue: this.student.mother_tongue,
            elective_subjects: this.student.elective_subjects,
            remarks: this.student.remarks
          });
          
          this.loadGradeLabel();
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/students']);
      }
    });
  }

  loadGradeLabel(): void {
    if (!this.student?.grade) {
      this.gradeLabel = 'N/A';
      return;
    }

    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const grade = response.data.find(g => g.value === this.student?.grade);
          this.gradeLabel = grade ? grade.label : `Grade ${this.student?.grade}`;
        } else {
          this.gradeLabel = `Grade ${this.student?.grade}`;
        }
      },
      error: () => {
        this.gradeLabel = `Grade ${this.student?.grade}`;
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/students/edit', this.studentId]);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete student "${this.student?.first_name} ${this.student?.last_name}"?`)) {
      this.studentCrudService.deleteStudent(this.studentId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Student deleted successfully');
            this.router.navigate(['/students']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/students']);
  }

  getFullName(): string {
    return `${this.student?.first_name || ''} ${this.student?.last_name || ''}`.trim();
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

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Active': 'primary',
      'Graduated': 'accent',
      'Left': 'warn',
      'Suspended': 'warn',
      'Expelled': 'warn'
    };
    return colors[status] || 'primary';
  }
}

