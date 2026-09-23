import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommunicationService } from '../../services/communication.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { GradeService } from '../../../grades/services/grade.service';
import { AuthService } from '../../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

interface OptionItem {
  value: string;
  label: string;
}

@Component({
  selector: 'app-compose-notification',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './compose-notification.component.html',
  styleUrls: ['./compose-notification.component.scss']
})
export class ComposeNotificationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly communicationService = inject(CommunicationService);
  private readonly gradeService = inject(GradeService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loadingGrades = false;
  loadingSections = false;
  submitting = false;
  grades: OptionItem[] = [];
  sections: OptionItem[] = [];

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.required]],
    optional_description: [''],
    grade: ['', Validators.required],
    section: ['', Validators.required],
    audience_mode: this.fb.nonNullable.control<'all' | 'custom'>('all')
  });

  ngOnInit(): void {
    this.loadGrades();
    this.form.controls.grade.valueChanges.subscribe((grade) => {
      this.form.controls.section.setValue('');
      this.sections = [];
      if (grade) {
        this.loadSections(grade);
      }
    });
  }

  // ✅ FIXED: branchId now unwraps observable
  private async branchId(): Promise<number | undefined> {
    const user = await firstValueFrom(this.authService.getCurrentUser());
    return user?.data?.branch_id ?? undefined;
  }

  async loadGrades(): Promise<void> {
    this.loadingGrades = true;
    const branchId = await this.branchId();
    const params = branchId ? { branch_id: branchId } : undefined;

    this.gradeService.getGrades(params).subscribe({
      next: (res) => {
        const rows = res.data || [];
        this.grades = rows.map((g: any) => ({
          value: String(g.value ?? g.id ?? g.name),
          label: String(g.label ?? g.name ?? g.value)
        }));
        this.loadingGrades = false;
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.loadingGrades = false;
      }
    });
  }

  async loadSections(grade: string): Promise<void> {
    this.loadingSections = true;
    const branchId = await this.branchId();

    this.gradeService.getGradeSections(grade, branchId).subscribe({
      next: (res: any) => {
        const rows = res.data || [];
        this.sections = rows.map((s: any) => {
          if (typeof s === 'string') {
            return { value: s, label: s };
          }
          return {
            value: String(s.value ?? s.name ?? s.section ?? ''),
            label: String(s.label ?? s.name ?? s.value ?? s.section ?? '')
          };
        }).filter((s: OptionItem) => !!s.value);
        this.loadingSections = false;
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.loadingSections = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/communications/notifications']);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitting = true;
    const branchId = await this.branchId();

    this.communicationService
      .broadcastNotification({
        title: value.title.trim(),
        description: value.description.trim(),
        optional_description: value.optional_description?.trim() || null,
        grade: value.grade,
        section: value.section,
        audience_mode: value.audience_mode,
        branch_id: branchId ?? null
      })
      .subscribe({
        next: (res) => {
          this.submitting = false;
          const count = res.data?.student_count;
          this.errorHandler.showSuccess(
            count != null
              ? `Notification sent to ${count} students`
              : res.message || 'Notification sent'
          );
          this.router.navigate(['/communications/notifications']);
        },
        error: (err) => {
          this.submitting = false;
          this.errorHandler.handleError(err);
        }
      });
  }
}
