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
            {{ isEditMode ? 'Edit Exam' : 'Create Exam' }}
          </h1>
          <p class="subtitle">{{ isEditMode ? 'Update exam details' : 'Add a new exam' }}</p>
        </div>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="examForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Exam Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g., Mid-Term Examination 2024">
                <mat-error *ngIf="examForm.get('name')?.hasError('required')">Name is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
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

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Branch</mat-label>
                <mat-select formControlName="branch_id">
                  <mat-option *ngFor="let branch of branches" [value]="branch.id">
                    {{ branch.name }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="examForm.get('branch_id')?.hasError('required')">Branch is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
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

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Academic Year</mat-label>
                <input matInput formControlName="academic_year" placeholder="e.g., 2024-2025">
                <mat-error *ngIf="examForm.get('academic_year')?.hasError('required')">Academic year is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="start_date">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error *ngIf="examForm.get('start_date')?.hasError('required')">Start date is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="end_date">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
                <mat-error *ngIf="examForm.get('end_date')?.hasError('required')">End date is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Total Marks</mat-label>
                <input matInput type="number" formControlName="total_marks" placeholder="e.g., 100">
                <mat-hint>Total marks for this exam</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Passing Marks</mat-label>
                <input matInput type="number" formControlName="passing_marks" placeholder="e.g., 40">
                <mat-hint>Minimum marks to pass</mat-hint>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3" placeholder="Optional description"></textarea>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-slide-toggle formControlName="is_active" color="primary">
                Active
              </mat-slide-toggle>
            </div>

            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="onCancel()">
                <mat-icon>cancel</mat-icon>
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="examForm.invalid || saving">
                <mat-icon>save</mat-icon>
                {{ saving ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
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
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.examId = params['id'];
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
}

