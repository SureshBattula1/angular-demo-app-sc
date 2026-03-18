import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { GradeService } from '../../services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { Grade, GradeStats } from '../../../../core/models/grade.model';

@Component({
  selector: 'app-grade-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './grade-view.component.html',
  styleUrls: ['./grade-view.component.scss']
})
export class GradeViewComponent implements OnInit {
  loading = false;
  gradeValue?: string;
  grade?: Grade;
  stats?: GradeStats;
  branchId?: number;
  
  // Permission checks
  hasEditPermission = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gradeService: GradeService,
    private errorHandler: ErrorHandlerService,
    private permissionService: PermissionService
  ) {
    this.hasEditPermission = this.permissionService.hasPermission('grades.edit');
  }
  
  ngOnInit(): void {
    this.route.queryParamMap.subscribe(qp => {
      const raw = qp.get('branch_id');
      this.branchId = raw ? Number(raw) : undefined;
    });
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.gradeValue = params['id'];
        this.loadGradeDetails();
      }
    });
  }
  
  loadGradeDetails(): void {
    if (!this.gradeValue) return;
    
    this.loading = true;

    this.gradeService.getGrade(this.gradeValue, this.branchId ? { branch_id: this.branchId } : undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grade = response.data;
          this.loadStats();
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.router.navigate(['/grades']);
      }
    });
  }
  
  loadStats(): void {
    if (!this.gradeValue) return;
    
    this.gradeService.getGradeStats(this.gradeValue).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error) => {
      }
    });
  }
  
  onBack(): void {
    this.router.navigate(['/grades']);
  }
  
  onEdit(): void {
    if (!this.hasEditPermission) {
      this.errorHandler.showError('You do not have permission to edit grades');
      return;
    }
    if (this.gradeValue) {
      this.router.navigate(['/grades/edit', this.gradeValue], {
        queryParams: { branch_id: this.branchId ?? null }
      });
    }
  }
  
  viewStudents(): void {
    if (this.gradeValue) {
      this.router.navigate(['/students'], { 
        queryParams: { grade: this.gradeValue }
      });
    }
  }
  
  viewSections(): void {
    if (this.gradeValue) {
      this.router.navigate(['/sections'], { 
        queryParams: { grade: this.gradeValue }
      });
    }
  }
}

