import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ExamTermService, ExamTerm } from '../../services/exam-term.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-exam-term-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon>calendar_today</mat-icon>
            <span *ngIf="!termId">Create Exam Term</span>
            <span *ngIf="termId && !isEditMode">View Exam Term</span>
            <span *ngIf="termId && isEditMode">Edit Exam Term</span>
          </h1>
          <p class="subtitle">
            <span *ngIf="!termId">Add a new exam term</span>
            <span *ngIf="termId && !isEditMode">View exam term details</span>
            <span *ngIf="termId && isEditMode">Update exam term details</span>
          </p>
        </div>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="termForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Term Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g., Term 1, Mid-Term" [readonly]="!isEditMode">
                <mat-error *ngIf="termForm.get('name')?.hasError('required')">Name is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Code</mat-label>
                <input matInput formControlName="code" placeholder="e.g., TERM1-2024" [readonly]="!isEditMode">
                <mat-error *ngIf="termForm.get('code')?.hasError('required')">Code is required</mat-error>
              </mat-form-field>

              <ng-container *ngIf="!isEditMode">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Branch</mat-label>
                  <input matInput [value]="getBranchName(termForm.get('branch_id')?.value)" [readonly]="true">
                  <mat-error *ngIf="termForm.get('branch_id')?.hasError('required')">Branch is required</mat-error>
                </mat-form-field>
              </ng-container>

              <ng-container *ngIf="isEditMode">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Branch</mat-label>
                  <mat-select formControlName="branch_id">
                    <mat-option *ngFor="let branch of branches" [value]="branch.id">
                      {{ branch.name }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="termForm.get('branch_id')?.hasError('required')">Branch is required</mat-error>
                </mat-form-field>
              </ng-container>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Academic Year</mat-label>
                <input matInput formControlName="academic_year" placeholder="e.g., 2024-2025" [readonly]="!isEditMode">
                <mat-error *ngIf="termForm.get('academic_year')?.hasError('required')">Academic year is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Weightage (%)</mat-label>
                <input matInput type="number" formControlName="weightage" placeholder="e.g., 30" [readonly]="!isEditMode">
                <mat-hint>Percentage of total annual marks</mat-hint>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="start_date" [readonly]="!isEditMode">
                <mat-datepicker-toggle matSuffix [for]="startPicker" *ngIf="isEditMode"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error *ngIf="termForm.get('start_date')?.hasError('required')">Start date is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="end_date" [readonly]="!isEditMode">
                <mat-datepicker-toggle matSuffix [for]="endPicker" *ngIf="isEditMode"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
                <mat-error *ngIf="termForm.get('end_date')?.hasError('required')">End date is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3" placeholder="Optional description" [readonly]="!isEditMode"></textarea>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-slide-toggle formControlName="is_active" color="primary" [disabled]="!isEditMode">
                Active
              </mat-slide-toggle>
            </div>

            <div class="form-actions" *ngIf="isEditMode">
              <button mat-stroked-button type="button" (click)="onCancel()">
                <mat-icon>cancel</mat-icon>
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="termForm.invalid || saving">
                <mat-icon>save</mat-icon>
                {{ saving ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
              </button>
            </div>
            <div class="form-actions" *ngIf="!isEditMode">
              <button mat-stroked-button type="button" (click)="onCancel()">
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button mat-raised-button color="primary" (click)="onEditMode()">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 24px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; margin: 0 0 8px 0; font-size: 28px; font-weight: 600; color: var(--text-primary); }
    .page-header h1 mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--primary-color); }
    .subtitle { margin: 0; color: var(--text-secondary); font-size: 14px; }
    .form-card { padding: 24px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .half-width { flex: 1; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color); }
    mat-form-field { width: 100%; }
  `]
})
export class ExamTermFormComponent implements OnInit {
  termForm!: FormGroup;
  isEditMode = false;
  saving = false;
  termId: number | undefined = undefined;
  branches: any[] = [];

  constructor(
    private fb: FormBuilder,
    private examTermService: ExamTermService,
    private branchService: BranchService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    
    // Check if this is a view mode (read-only) from the URL
    const currentUrl = this.router.url;
    const isViewMode = currentUrl.includes('/view/');
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.termId = +params['id'];
        this.isEditMode = !isViewMode; // Only edit mode if NOT view mode
        this.loadTerm();
      }
    });
  }

  initForm(): void {
    this.termForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      branch_id: ['', Validators.required],
      academic_year: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      weightage: [0],
      description: [''],
      is_active: [true]
    });
  }

  loadBranches(): void {
    this.branchService.getBranches().subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data || [];
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  loadTerm(): void {
    if (!this.termId) return;
    
    this.examTermService.getExamTerm(this.termId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.termForm.patchValue(response.data);
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  onSubmit(): void {
    if (this.termForm.invalid) return;

    this.saving = true;
    const formData = this.termForm.value;

    const request = this.isEditMode
      ? this.examTermService.updateExamTerm(this.termId!, formData)
      : this.examTermService.createExamTerm(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess(`Exam term ${this.isEditMode ? 'updated' : 'created'} successfully`);
          this.router.navigate(['/exams']);
        }
        this.saving = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.saving = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/exams']);
  }

  onEditMode(): void {
    if (this.termId) {
      this.router.navigate(['/exams/term/edit', this.termId]);
    }
  }

  getBranchName(branchId: number): string {
    const branch = this.branches.find(b => b.id === branchId);
    return branch ? branch.name : '';
  }
}

