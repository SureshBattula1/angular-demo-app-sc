import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ExamScheduleService, ExamSchedule } from '../../services/exam-schedule.service';
import { ExamService } from '../../services/exam.service';
import { SubjectService } from '../../../subjects/services/subject.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-exam-schedule-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon>schedule</mat-icon>
            {{ isEditMode ? 'Edit Exam Schedule' : 'Create Exam Schedule' }}
          </h1>
          <p class="subtitle">{{ isEditMode ? 'Update exam schedule details' : 'Schedule a subject exam' }}</p>
        </div>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="scheduleForm" (ngSubmit)="onSubmit()">
            <!-- Exam Selection -->
            <div class="form-section">
              <h3 class="section-title">Exam Details</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Exam</mat-label>
                  <mat-select formControlName="exam_id">
                    <mat-option *ngFor="let exam of exams" [value]="exam.id">
                      {{ exam.name }} - {{ exam.academic_year }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="scheduleForm.get('exam_id')?.hasError('required')">Exam is required</mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Subject</mat-label>
                  <mat-select formControlName="subject_id">
                    <mat-option *ngFor="let subject of subjects" [value]="subject.id">
                      {{ subject.name }} ({{ subject.code }})
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="scheduleForm.get('subject_id')?.hasError('required')">Subject is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Branch</mat-label>
                  <mat-select formControlName="branch_id">
                    <mat-option *ngFor="let branch of branches" [value]="branch.id">
                      {{ branch.name }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="scheduleForm.get('branch_id')?.hasError('required')">Branch is required</mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- Class/Section Details -->
            <div class="form-section">
              <h3 class="section-title">Class & Section</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Grade Level</mat-label>
                  <mat-select formControlName="grade_level">
                    <mat-option *ngFor="let grade of grades" [value]="grade.value">
                      {{ grade.label }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="scheduleForm.get('grade_level')?.hasError('required')">Grade is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Section</mat-label>
                  <input matInput formControlName="section" placeholder="e.g., A, B, C">
                  <mat-hint>Optional - leave empty for all sections</mat-hint>
                </mat-form-field>
              </div>
            </div>

            <!-- Schedule Details -->
            <div class="form-section">
              <h3 class="section-title">Schedule & Timing</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Exam Date</mat-label>
                  <input matInput [matDatepicker]="datePicker" formControlName="exam_date">
                  <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
                  <mat-datepicker #datePicker></mat-datepicker>
                  <mat-error *ngIf="scheduleForm.get('exam_date')?.hasError('required')">Date is required</mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="third-width">
                  <mat-label>Start Time</mat-label>
                  <input matInput type="time" formControlName="start_time">
                  <mat-error *ngIf="scheduleForm.get('start_time')?.hasError('required')">Start time is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="third-width">
                  <mat-label>End Time</mat-label>
                  <input matInput type="time" formControlName="end_time">
                  <mat-error *ngIf="scheduleForm.get('end_time')?.hasError('required')">End time is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="third-width">
                  <mat-label>Duration (minutes)</mat-label>
                  <input matInput type="number" formControlName="duration" placeholder="e.g., 180">
                  <mat-error *ngIf="scheduleForm.get('duration')?.hasError('required')">Duration is required</mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- Marks & Room -->
            <div class="form-section">
              <h3 class="section-title">Marks & Location</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Total Marks</mat-label>
                  <input matInput type="number" formControlName="total_marks" placeholder="e.g., 100">
                  <mat-error *ngIf="scheduleForm.get('total_marks')?.hasError('required')">Total marks is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Passing Marks</mat-label>
                  <input matInput type="number" formControlName="passing_marks" placeholder="e.g., 40">
                  <mat-error *ngIf="scheduleForm.get('passing_marks')?.hasError('required')">Passing marks is required</mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Room Number</mat-label>
                  <input matInput formControlName="room_number" placeholder="e.g., Hall-A, Room 101">
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Invigilator (Teacher)</mat-label>
                  <mat-select formControlName="invigilator_id">
                    <mat-option [value]="null">-- None --</mat-option>
                    <mat-option *ngFor="let teacher of teachers" [value]="teacher.user_id">
                      {{ teacher.user?.first_name }} {{ teacher.user?.last_name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <!-- Additional Details -->
            <div class="form-section">
              <h3 class="section-title">Additional Information</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Status</mat-label>
                  <mat-select formControlName="status">
                    <mat-option value="Scheduled">Scheduled</mat-option>
                    <mat-option value="Ongoing">Ongoing</mat-option>
                    <mat-option value="Completed">Completed</mat-option>
                    <mat-option value="Cancelled">Cancelled</mat-option>
                  </mat-select>
                </mat-form-field>

                <div class="half-width">
                  <mat-slide-toggle formControlName="is_active" color="primary">
                    Active
                  </mat-slide-toggle>
                </div>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Instructions</mat-label>
                  <textarea matInput formControlName="instructions" rows="3" placeholder="Special instructions for students"></textarea>
                </mat-form-field>
              </div>
            </div>

            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="onCancel()">
                <mat-icon>cancel</mat-icon>
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="scheduleForm.invalid || saving">
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
    .page-container { max-width: 1000px; margin: 0 auto; padding: 24px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; margin: 0 0 8px 0; font-size: 28px; font-weight: 600; color: var(--text-primary); }
    .page-header h1 mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--primary-color); }
    .subtitle { margin: 0; color: var(--text-secondary); font-size: 14px; }
    .form-card { padding: 24px; }
    .form-section { margin-bottom: 32px; }
    .section-title { font-size: 18px; font-weight: 500; color: var(--primary-color); margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid var(--primary-color); }
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start; }
    .full-width { width: 100%; }
    .half-width { flex: 1; }
    .third-width { flex: 1; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color); }
    mat-form-field { width: 100%; }
    mat-slide-toggle { margin-top: 8px; }
  `]
})
export class ExamScheduleFormComponent implements OnInit {
  scheduleForm!: FormGroup;
  isEditMode = false;
  saving = false;
  scheduleId?: number;
  
  exams: any[] = [];
  subjects: any[] = [];
  branches: any[] = [];
  grades: any[] = [];
  teachers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private examScheduleService: ExamScheduleService,
    private examService: ExamService,
    private subjectService: SubjectService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private teacherService: TeacherService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.scheduleId = +params['id'];
        this.loadSchedule();
      }
    });

    // Pre-fill exam_id from query params if creating from exam
    this.route.queryParams.subscribe(params => {
      if (params['exam_id'] && !this.isEditMode) {
        this.scheduleForm.patchValue({ exam_id: params['exam_id'] });
      }
    });
  }

  initForm(): void {
    this.scheduleForm = this.fb.group({
      exam_id: ['', Validators.required],
      subject_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      grade_level: ['', Validators.required],
      section: [''],
      exam_date: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      duration: ['', Validators.required],
      total_marks: ['', Validators.required],
      passing_marks: ['', Validators.required],
      room_number: [''],
      invigilator_id: [null],
      instructions: [''],
      status: ['Scheduled'],
      is_active: [true]
    });
  }

  loadData(): void {
    // Load all required data
    this.examService.getExams().subscribe({
      next: (response) => {
        if (response.success) this.exams = response.data || [];
      },
      error: (error) => this.errorHandler.showError(error)
    });

    this.subjectService.getSubjects().subscribe({
      next: (response) => {
        if (response.success) this.subjects = response.data || [];
      },
      error: (error) => this.errorHandler.showError(error)
    });

    this.branchService.getBranches().subscribe({
      next: (response) => {
        if (response.success) this.branches = response.data || [];
      },
      error: (error) => this.errorHandler.showError(error)
    });

    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success) this.grades = response.data || [];
      },
      error: (error) => this.errorHandler.showError(error)
    });

    this.teacherService.getTeachers().subscribe({
      next: (response) => {
        if (response.success) this.teachers = response.data || [];
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  loadSchedule(): void {
    if (!this.scheduleId) return;
    
    this.examScheduleService.getSchedule(this.scheduleId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.scheduleForm.patchValue(response.data);
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  onSubmit(): void {
    if (this.scheduleForm.invalid) return;

    this.saving = true;
    const formData = this.scheduleForm.value;

    const request = this.isEditMode
      ? this.examScheduleService.updateSchedule(this.scheduleId!, formData)
      : this.examScheduleService.createSchedule(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess(`Exam schedule ${this.isEditMode ? 'updated' : 'created'} successfully`);
          this.router.navigate(['/exams'], { queryParams: { tab: 'schedules' } });
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
    this.router.navigate(['/exams'], { queryParams: { tab: 'schedules' } });
  }
}

