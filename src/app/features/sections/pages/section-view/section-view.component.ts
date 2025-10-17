import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { SectionService } from '../../services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-section-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './section-view.component.html',
  styleUrls: ['./section-view.component.scss']
})
export class SectionViewComponent implements OnInit {
  sectionData?: Section;
  isLoading = true;
  sectionId!: number;

  constructor(
    private sectionService: SectionService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.sectionId = +params['id'];
        this.loadSection();
      }
    });
  }

  loadSection(): void {
    this.isLoading = true;
    
    this.sectionService.getSection(this.sectionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sectionData = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/sections']);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/sections/edit', this.sectionId]);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete section "${this.sectionData?.name}"?`)) {
      this.sectionService.deleteSection(this.sectionId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Section deleted successfully');
            this.router.navigate(['/sections']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/sections']);
  }

  getAvailableSeats(): number {
    if (!this.sectionData) return 0;
    return this.sectionData.capacity - this.sectionData.current_strength;
  }

  getOccupancyPercentage(): number {
    if (!this.sectionData || this.sectionData.capacity === 0) return 0;
    return Math.round((this.sectionData.current_strength / this.sectionData.capacity) * 100);
  }

  getOccupancyColor(): string {
    const percentage = this.getOccupancyPercentage();
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }
}

