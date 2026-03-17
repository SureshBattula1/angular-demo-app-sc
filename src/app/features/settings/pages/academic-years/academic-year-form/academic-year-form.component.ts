import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { AcademicYearService } from '../../../services/academic-year.service';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';

@Component({
  selector: 'app-academic-year-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './academic-year-form.component.html',
  styleUrls: ['./academic-year-form.component.scss']
})
export class AcademicYearFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  id: number | null = null;
  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private service: AcademicYearService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{4}$/), Validators.maxLength(9)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      is_current: [false],
      is_active: [true],
      description: [null]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
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
          const d = res.data;
          const startStr = d.start_date?.toString().slice(0, 10);
          const endStr = d.end_date?.toString().slice(0, 10);
          this.form.patchValue({
            name: d.name,
            start_date: startStr ? new Date(startStr) : null,
            end_date: endStr ? new Date(endStr) : null,
            is_current: d.is_current ?? false,
            is_active: d.is_active ?? true,
            description: d.description ?? null
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = { ...this.form.value };
    if (value.start_date instanceof Date) {
      value.start_date = this.formatDateForApi(value.start_date);
    }
    if (value.end_date instanceof Date) {
      value.end_date = this.formatDateForApi(value.end_date);
    }
    if (value.start_date && value.end_date && value.start_date > value.end_date) {
      this.errorHandler.showWarning('End date must be on or after start date.');
      return;
    }
    this.submitting = true;
    const req = this.isEditMode && this.id
      ? this.service.update(this.id, value)
      : this.service.create(value);
    req.subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess(this.isEditMode ? 'Academic year updated.' : 'Academic year created.');
          this.router.navigate(['/settings/academic-years']);
        }
        this.submitting = false;
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/settings/academic-years']);
  }

  private formatDateForApi(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
