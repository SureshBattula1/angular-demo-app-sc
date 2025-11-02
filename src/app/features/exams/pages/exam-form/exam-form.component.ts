import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ExamService, Exam } from '../../services/exam.service';
import { ExamTermService, ExamTerm } from '../../services/exam-term.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
            <h1>
            <mat-icon>assignment</mat-icon>
            <span *ngIf="!examId">Create Exam</span>
            <span *ngIf="examId && !isEditMode">View Exam</span>
            <span *ngIf="examId && isEditMode">Edit Exam</span>
          </h1>
          <p class="subtitle">
            <span *ngIf="!examId">Add a new exam</span>
            <span *ngIf="examId && !isEditMode">View exam details</span>
            <span *ngIf="examId && isEditMode">Update exam details</span>
          </p>
        </div>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="examForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Exam Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g., Mid-Term Examination 2024" [readonly]="!isEditMode">
                <mat-error *ngIf="examForm.get('name')?.hasError('required')">Name is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <ng-container *ngIf="!isEditMode">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Exam Term</mat-label>
                  <input matInput [value]="getTermName(examForm.get('exam_term_id')?.value)" [readonly]="true">
                </mat-form-field>
              </ng-container>
              <ng-container *ngIf="isEditMode">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Exam Term</mat-label>
                  <mat-select formControlName="exam_term_id">
                    <mat-option [value]="null">-- None --</mat-option>
                    <mat-option *ngFor="let term of examTerms" [value]="term.id">
                      {{ term.name }} ({{ term.academic_year }})
                    </mat-option>
                  </mat-select>
                  <mat-hint>Optional: Link to exam term</mat-hint>
                </mat-form-field>
              </ng-container>

              <ng-container *ngIf="!isEditMode">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Branch</mat-label>
                  <input matInput [value]="getBranchName(examForm.get('branch_id')?.value)" [readonly]="true">
                  <mat-error *ngIf="examForm.get('branch_id')?.hasError('required')">Branch is required</mat-error>
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
                  <mat-error *ngIf="examForm.get('branch_id')?.hasError('required')">Branch is required</mat-error>
                </mat-form-field>
              </ng-container>
            </div>

            <div class="form-row">
              <ng-container *ngIf="!isEditMode">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Exam Type</mat-label>
                  <input matInput [value]="examForm.get('exam_type')?.value" [readonly]="true">
                  <mat-error *ngIf="examForm.get('exam_type')?.hasError('required')">Type is required</mat-error>
                </mat-form-field>
              </ng-container>
              <ng-container *ngIf="isEditMode">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Exam Type</mat-label>
                  <mat-select formControlName="exam_type">
                    <mat-option value="Midterm">Mid-term</mat-option>
                    <mat-option value="Final">Final</mat-option>
                    <mat-option value="Quiz">Quiz</mat-option>
                    <mat-option value="Assignment">Assignment</mat-option>
                    <mat-option value="Practical">Practical</mat-option>
                    <mat-option value="Other">Other</mat-option>
                  </mat-select>
                  <mat-error *ngIf="examForm.get('exam_type')?.hasError('required')">Type is required</mat-error>
                </mat-form-field>
              </ng-container>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Academic Year</mat-label>
                <input matInput formControlName="academic_year" placeholder="e.g., 2024-2025" [readonly]="!isEditMode">
                <mat-error *ngIf="examForm.get('academic_year')?.hasError('required')">Academic year is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="start_date" [readonly]="!isEditMode">
                <mat-datepicker-toggle matSuffix [for]="startPicker" *ngIf="isEditMode"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error *ngIf="examForm.get('start_date')?.hasError('required')">Start date is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="end_date" [readonly]="!isEditMode">
                <mat-datepicker-toggle matSuffix [for]="endPicker" *ngIf="isEditMode"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
                <mat-error *ngIf="examForm.get('end_date')?.hasError('required')">End date is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Total Marks</mat-label>
                <input matInput type="number" formControlName="total_marks" placeholder="e.g., 100" [readonly]="!isEditMode">
                <mat-hint>Total marks for this exam</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Passing Marks</mat-label>
                <input matInput type="number" formControlName="passing_marks" placeholder="e.g., 40" [readonly]="!isEditMode">
                <mat-hint>Minimum marks to pass</mat-hint>
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
              <button mat-raised-button color="primary" type="submit" [disabled]="examForm.invalid || saving">
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
export class ExamFormComponent implements OnInit {
  examForm!: FormGroup;
  isEditMode = false;
  saving = false;
  examId?: string;
  branches: any[] = [];
  examTerms: ExamTerm[] = [];

  constructor(
    private fb: FormBuilder,
    private examService: ExamService,
    private examTermService: ExamTermService,
    private branchService: BranchService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadExamTerms();
    
    // Check if this is a view mode (read-only) from the URL
    const currentUrl = this.router.url;
    const isViewMode = currentUrl.includes('/view/');
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.examId = params['id'];
        this.isEditMode = !isViewMode;
        this.loadExam();
      }
    });
  }

  initForm(): void {
    this.examForm = this.fb.group({
      name: ['', Validators.required],
      exam_term_id: [null],
      branch_id: ['', Validators.required],
      exam_type: ['', Validators.required],
      academic_year: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      total_marks: [100],
      passing_marks: [40],
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

  loadExamTerms(): void {
    this.examTermService.getExamTerms().subscribe({
      next: (response) => {
        if (response.success) {
          this.examTerms = response.data || [];
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  loadExam(): void {
    if (!this.examId) return;
    
    this.examService.getExam(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.examForm.patchValue(response.data);
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  onSubmit(): void {
    if (this.examForm.invalid) return;

    this.saving = true;
    const formData = this.examForm.value;

    const request = this.isEditMode
      ? this.examService.updateExam(this.examId!, formData)
      : this.examService.createExam(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess(`Exam ${this.isEditMode ? 'updated' : 'created'} successfully`);
          this.router.navigate(['/exams'], { queryParams: { tab: 'exams' } });
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
    this.router.navigate(['/exams'], { queryParams: { tab: 'exams' } });
  }

  onEditMode(): void {
    if (this.examId) {
      this.router.navigate(['/exams/edit', this.examId]);
    }
  }

  getBranchName(branchId: number): string {
    const branch = this.branches.find(b => b.id === branchId);
    return branch ? branch.name : '';
  }

  getTermName(termId: number): string {
    const term = this.examTerms.find(t => t.id === termId);
    return term ? term.name : '';
  }
}

