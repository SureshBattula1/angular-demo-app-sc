import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ClassCrudService } from '../../services/class-crud.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Class } from '../../../../core/models/class.model';

@Component({
  selector: 'app-class-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './class-view.component.html',
  styleUrls: ['./class-view.component.scss']
})
export class ClassViewComponent implements OnInit {
  classData?: Class;
  isLoading = true;
  classId!: number;

  constructor(
    private classCrudService: ClassCrudService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.classId = +params['id'];
        this.loadClass();
      }
    });
  }

  loadClass(): void {
    this.isLoading = true;
    
    this.classCrudService.getClass(this.classId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.classData = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/classes']);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/classes/edit', this.classId]);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete class "${this.classData?.class_name}"?`)) {
      this.classCrudService.deleteClass(this.classId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Class deleted successfully');
            this.router.navigate(['/classes']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/classes']);
  }

  getAvailableSeats(): number {
    if (!this.classData) return 0;
    return this.classData.capacity - this.classData.current_strength;
  }

  getOccupancyPercentage(): number {
    if (!this.classData || this.classData.capacity === 0) return 0;
    return Math.round((this.classData.current_strength / this.classData.capacity) * 100);
  }

  getOccupancyColor(): string {
    const percentage = this.getOccupancyPercentage();
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }
}

