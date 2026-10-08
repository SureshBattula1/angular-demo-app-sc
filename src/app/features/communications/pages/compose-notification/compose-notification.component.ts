import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CommunicationService,
  NotificationAttachment,
  StaffRecipientGroup
} from '../../services/communication.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationCampaignService } from '../../../notification-campaigns/services/notification-campaign.service';
import { AssignmentService } from '../../../assignments/services/assignment.service';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { FileUploadResponse } from '../../../../core/services/file-upload.service';
import { StaffGroupPickerComponent, StaffPersonOption } from '../../../notification-campaigns/components/staff-group-picker/staff-group-picker.component';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface SectionRow {
  grade: string;
  section: string;
  label: string;
  studentCount?: number;
}

interface EligibleStudentRow {
  id: number | string;
  name: string;
  admission_number?: string | null;
  grade: string;
  section: string;
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
    MatRadioModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    FormsModule,
    FileUploadComponent,
    StaffGroupPickerComponent
  ],
  templateUrl: './compose-notification.component.html',
  styleUrls: ['./compose-notification.component.scss']
})
export class ComposeNotificationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly communicationService = inject(CommunicationService);
  private readonly campaignService = inject(NotificationCampaignService);
  private readonly assignmentService = inject(AssignmentService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  loadingSections = false;
  loadingStudents = false;
  loadingStaff = false;
  submitting = false;

  branchIdValue: number | undefined;
  sectionSearch = '';
  studentSearch = '';
  staffGroups: StaffRecipientGroup[] = [];
  staffPeopleFlat: StaffPersonOption[] = [];
  allSections: SectionRow[] = [];
  selectedSectionKeys = new Set<string>();
  eligibleStudents: EligibleStudentRow[] = [];
  selectedStudentIds = new Set<number | string>();
  selectedStaffIds: number[] = [];
  attachments: NotificationAttachment[] = [];

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.required]],
    optional_description: [''],
    include_students: [true],
    include_staff: [false],
    student_audience_mode: this.fb.nonNullable.control<'all' | 'custom'>('all'),
    staff_audience_mode: this.fb.nonNullable.control<'all' | 'custom'>('all')
  });

  ngOnInit(): void {
    void this.initBranchAndSections();
    this.form.controls.include_students.valueChanges.subscribe(() => {
      void this.reloadStudentsIfNeeded();
    });
    this.form.controls.student_audience_mode.valueChanges.subscribe(() => {
      void this.reloadStudentsIfNeeded();
    });
    this.form.controls.include_staff.valueChanges.subscribe((on) => {
      if (on && this.staffGroups.length === 0) {
        void this.loadStaff();
      }
    });
  }

  get attachmentUploadPath(): string {
    return this.branchIdValue
      ? `notification-campaigns/custom/${this.branchIdValue}`
      : 'notification-campaigns/custom';
  }

  get filteredSections(): SectionRow[] {
    const q = this.sectionSearch.trim().toLowerCase();
    if (!q) {
      return this.allSections;
    }
    return this.allSections.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q)
    );
  }

  get filteredStudents(): EligibleStudentRow[] {
    const q = this.studentSearch.trim().toLowerCase();
    if (!q) {
      return this.eligibleStudents;
    }
    return this.eligibleStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.admission_number ?? '').toLowerCase().includes(q) ||
        `${s.grade} ${s.section}`.toLowerCase().includes(q)
    );
  }

  get allFilteredSectionsSelected(): boolean {
    const list = this.filteredSections;
    return list.length > 0 && list.every((s) => this.isSectionSelected(s));
  }

  get someFilteredSectionsSelected(): boolean {
    const list = this.filteredSections;
    const n = list.filter((s) => this.isSectionSelected(s)).length;
    return n > 0 && n < list.length;
  }

  sectionKey(row: SectionRow): string {
    return `${row.grade}::${row.section}`;
  }

  isSectionSelected(row: SectionRow): boolean {
    return this.selectedSectionKeys.has(this.sectionKey(row));
  }

  toggleSection(row: SectionRow, checked: boolean): void {
    const key = this.sectionKey(row);
    if (checked) {
      this.selectedSectionKeys.add(key);
    } else {
      this.selectedSectionKeys.delete(key);
    }
    void this.reloadStudentsIfNeeded();
  }

  toggleAllFilteredSections(checked: boolean): void {
    for (const row of this.filteredSections) {
      const key = this.sectionKey(row);
      if (checked) {
        this.selectedSectionKeys.add(key);
      } else {
        this.selectedSectionKeys.delete(key);
      }
    }
    void this.reloadStudentsIfNeeded();
  }

  isStudentSelected(id: number | string): boolean {
    return this.selectedStudentIds.has(id);
  }

  toggleStudent(id: number | string, checked: boolean): void {
    if (checked) {
      this.selectedStudentIds.add(id);
    } else {
      this.selectedStudentIds.delete(id);
    }
  }

  onAttachmentUploaded(data: FileUploadResponse['data']): void {
    if (!data?.file_path) {
      return;
    }
    if (this.attachments.length >= 15) {
      this.errorHandler.showError('Maximum 15 attachments allowed.');
      return;
    }
    this.attachments = [
      ...this.attachments,
      {
        file_path: data.file_path,
        file_name: data.file_name,
        original_name: data.file_name,
        file_type: data.file_type,
        file_size: data.file_size
      }
    ];
  }

  removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, i) => i !== index);
  }

  cancel(): void {
    this.router.navigate(['/notifications']);
  }

  canSubmit(): boolean {
    if (this.form.invalid) {
      return false;
    }
    const v = this.form.getRawValue();
    if (!v.include_students && !v.include_staff) {
      return false;
    }
    if (v.include_students) {
      if (this.selectedSectionKeys.size === 0) {
        return false;
      }
      if (v.student_audience_mode === 'custom' && this.selectedStudentIds.size === 0) {
        return false;
      }
    }
    if (v.include_staff && v.staff_audience_mode === 'custom' && this.selectedStaffIds.length === 0) {
      return false;
    }
    return true;
  }

  async submit(): Promise<void> {
    if (!this.canSubmit() || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const targets = [...this.selectedSectionKeys].map((key) => {
      const [grade, section] = key.split('::');
      return { grade, section };
    });

    const studentCount = v.include_students
      ? v.student_audience_mode === 'all'
        ? 'all students in selected sections'
        : `${this.selectedStudentIds.size} students`
      : 'none';
    const staffCount =
      v.include_staff && v.staff_audience_mode === 'custom'
        ? `${this.selectedStaffIds.length} branch team`
        : v.include_staff
          ? 'all branch team'
          : 'none';

    const confirmed = confirm(
      `Send notification?\n\nStudents: ${studentCount}\nBranch team: ${staffCount}\nSections: ${targets.length}\nAttachments: ${this.attachments.length}`
    );
    if (!confirmed) {
      return;
    }

    this.submitting = true;
    const branchId = this.branchIdValue;

    const body = {
      title: v.title.trim(),
      description: v.description.trim(),
      optional_description: v.optional_description?.trim() || null,
      include_students: v.include_students,
      include_staff: v.include_staff,
      student_audience_mode: v.student_audience_mode,
      staff_audience_mode: v.staff_audience_mode,
      targets: v.include_students ? targets : [],
      student_ids: v.include_students && v.student_audience_mode === 'custom'
        ? [...this.selectedStudentIds].map((id) => Number(id))
        : [],
      staff_user_ids: v.include_staff && v.staff_audience_mode === 'custom' ? [...this.selectedStaffIds] : [],
      attachments: this.attachments,
      branch_id: branchId ?? null
    };

    this.communicationService.broadcastNotification(body).subscribe({
      next: (res) => {
        this.submitting = false;
        const count = res.data?.recipient_count ?? res.data?.student_count;
        this.errorHandler.showSuccess(
          count != null ? `Notification sent to ${count} recipients` : res.message || 'Notification sent'
        );
        this.router.navigate(['/notifications']);
      },
      error: (err) => {
        this.submitting = false;
        this.errorHandler.handleError(err);
      }
    });
  }

  private async branchId(): Promise<number | undefined> {
    const user = await firstValueFrom(this.authService.getCurrentUser());
    return user?.data?.branch_id ?? undefined;
  }

  private async initBranchAndSections(): Promise<void> {
    this.branchIdValue = await this.branchId();
    if (!this.branchIdValue) {
      return;
    }
    this.loadingSections = true;
    const today = new Date().toISOString().slice(0, 10);
    this.campaignService.eligibleTargets('custom', this.branchIdValue, today).subscribe({
      next: (res) => {
        const rows = res.data ?? [];
        this.allSections = rows.map((r) => ({
          grade: String(r.grade ?? ''),
          section: String(r.section ?? ''),
          label: `Class ${r.grade} · ${r.section}`,
          studentCount: r.student_count
        }));
        this.loadingSections = false;
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.loadingSections = false;
      }
    });
  }

  loadStaff(): void {
    void this.fetchStaff();
  }

  private async fetchStaff(): Promise<void> {
    if (!this.branchIdValue) {
      return;
    }
    this.loadingStaff = true;
    this.communicationService.composeStaffRecipientOptions(this.branchIdValue).subscribe({
      next: (res) => {
        this.staffGroups = res.data?.groups ?? [];
        this.staffPeopleFlat = this.staffGroups.flatMap((g) =>
          (g.people ?? []).map((p) => ({
            user_id: p.user_id,
            name: p.name,
            subtitle: `${g.label} · ${p.subtitle}`
          }))
        );
        this.loadingStaff = false;
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.loadingStaff = false;
      }
    });
  }

  private async reloadStudentsIfNeeded(): Promise<void> {
    const v = this.form.getRawValue();
    if (!v.include_students || v.student_audience_mode !== 'custom') {
      this.eligibleStudents = [];
      this.selectedStudentIds.clear();
      return;
    }
    if (this.selectedSectionKeys.size === 0 || !this.branchIdValue) {
      this.eligibleStudents = [];
      return;
    }

    this.loadingStudents = true;
    const calls = [...this.selectedSectionKeys].map((key) => {
      const [grade, section] = key.split('::');
      return this.assignmentService.getEligibleStudents({
        grade,
        section,
        branch_id: this.branchIdValue
      }).pipe(catchError(() => of({ data: [] as { id: number; name: string; admission_number?: string }[] })));
    });

    forkJoin(calls).subscribe({
      next: (responses) => {
        const merged: EligibleStudentRow[] = [];
        let i = 0;
        for (const key of this.selectedSectionKeys) {
          const [grade, section] = key.split('::');
          const rows = responses[i]?.data ?? [];
          i++;
          for (const row of rows) {
            merged.push({
              id: row.id,
              name: row.name,
              admission_number: row.admission_number,
              grade,
              section
            });
          }
        }
        this.eligibleStudents = merged;
        const valid = new Set(merged.map((s) => s.id));
        this.selectedStudentIds = new Set([...this.selectedStudentIds].filter((id) => valid.has(id)));
        this.loadingStudents = false;
      },
      error: () => {
        this.loadingStudents = false;
      }
    });
  }
}
