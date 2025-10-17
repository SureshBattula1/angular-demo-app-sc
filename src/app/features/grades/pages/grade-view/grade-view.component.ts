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
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gradeService: GradeService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
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
    
    // Load grade basic info from grades list
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grade = response.data.find(g => g.value === this.gradeValue);
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
        console.error('Error loading stats:', error);
      }
    });
  }
  
  onBack(): void {
    this.router.navigate(['/grades']);
  }
  
  onEdit(): void {
    if (this.gradeValue) {
      this.router.navigate(['/grades/edit', this.gradeValue]);
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

