import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { AcademicYearService, AcademicYear } from '../../../services/academic-year.service';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';

@Component({
  selector: 'app-academic-year-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './academic-year-view.component.html',
  styleUrls: ['./academic-year-view.component.scss']
})
export class AcademicYearViewComponent implements OnInit {
  academicYear: AcademicYear | null = null;
  id: number | null = null;
  loading = false;

  constructor(
    private service: AcademicYearService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.loadAcademicYear();
    }
  }

  loadAcademicYear(): void {
    if (this.id == null) return;
    this.loading = true;
    this.service.getById(this.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.academicYear = res.data;
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/settings/academic-years']);
  }

  onEdit(): void {
    if (this.id) this.router.navigate(['/settings/academic-years/edit', this.id]);
  }

  onDelete(): void {
    if (!this.academicYear) return;
    if (!confirm(`Delete academic year "${this.academicYear.name}"?`)) return;
    this.service.delete(this.academicYear.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Academic year deleted successfully');
          this.router.navigate(['/settings/academic-years']);
        }
      },
      error: (err) => this.errorHandler.handleError(err)
    });
  }
}
