import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  forkJoin,
  map,
  of,
  switchMap
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { Branch } from '../../../../core/models/branch.model';
import { BranchService } from '../../../branches/services/branch.service';
import {
  SmsBulkAudience,
  SmsRecipientGradeRow,
  SmsRecipientTeacherOption,
  SmsStudentSearchItem,
  SmsTemplate,
  SmsTemplateService
} from '../../services/sms-template.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { GlobalLoadingService } from '../../../../core/services/global-loading.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SmsSendConfirmDialogComponent } from '../sms-send-confirm-dialog/sms-send-confirm-dialog.component';

@Component({
  selector: 'app-sms-send-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './sms-send-panel.component.html',
  styleUrls: ['./sms-send-panel.component.scss']
})
export class SmsSendPanelComponent implements OnInit, OnChanges {
  private sms = inject(SmsTemplateService);
  private branchService = inject(BranchService);
  private errorHandler = inject(ErrorHandlerService);
  private permission = inject(PermissionService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private globalLoading = inject(GlobalLoadingService);

  /** Optional: sync initial branch from parent (e.g. bulk shell filter). */
  @Input() branchId: number | string | null = null;

  /** Routes bulk send + recipient APIs to SMS vs WhatsApp endpoints. */
  @Input() messageChannel: 'sms' | 'whatsapp' = 'sms';

  /** Emitted after bulk send is queued so the parent can switch to the delivery log. */
  @Output() bulkQueued = new EventEmitter<{ queue_id?: number }>();

  branches: Branch[] = [];
  selectedBranchId: number | null = null;
  branchesLoading = false;

  loading = false;
  sending = false;
  previewing = false;
  /** Loading preview for confirm dialog. */
  previewLoading = false;

  templates: SmsTemplate[] = [];
  teachers: SmsRecipientTeacherOption[] = [];
  grades: SmsRecipientGradeRow[] = [];
  recipientMeta: { total_students: number; total_teachers: number } | null = null;

  audience: SmsBulkAudience = 'students';
  teacherMode: 'all' | 'selected' = 'all';
  selectedTeacherIds: number[] = [];
  teacherFilter = '';

  studentMode: 'all' | 'filtered' | 'selected' = 'all';
  /** Whole grade selected (all sections in that grade). */
  gradeWholeSelected = new Set<string>();
  /** Specific section keys `${grade}\t${section}`. */
  sectionSelected = new Set<string>();
  /** Picked from name search (choose student). */
  selectedStudents: SmsStudentSearchItem[] = [];
  studentSearchCtrl = new FormControl<string | SmsStudentSearchItem | null>('');
  studentSearchResults: SmsStudentSearchItem[] = [];
  /** Autocomplete display (method reference for template). */
  displayStudentOption = (v: SmsStudentSearchItem | string | null): string => {
    if (!v || typeof v === 'string') {
      return typeof v === 'string' ? v : '';
    }
    return v.name;
  };

  sendTemplateId: number | '' = '';
  sendUseCustomBody = false;
  sendCustomBody = '';

  previewStudentId: number | '' = '';
  previewTeacherId: number | '' = '';
  /** When audience is global, preview as student or teacher. */
  previewGlobalAs: 'student' | 'teacher' = 'student';
  previewOutput = '';

  ngOnInit(): void {
    this.loadBranches();
    this.studentSearchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((v): v is string => typeof v === 'string'),
        switchMap(q => {
          const bid = this.selectedBranchId;
          if (!bid || q.trim().length < 1) {
            return of([] as SmsStudentSearchItem[]);
          }
          return this.sms.searchStudents(bid, q.trim(), this.messageChannel).pipe(
            map(res => (res.success && res.data ? res.data.students : [])),
            catchError(() => of([] as SmsStudentSearchItem[]))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(rows => {
        this.studentSearchResults = rows;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['branchId'] && !changes['branchId'].firstChange && this.branches.length > 0) {
      const wanted = this.parseBranchId(this.branchId);
      if (
        wanted !== null &&
        this.branches.some(b => b.id === wanted) &&
        this.selectedBranchId !== wanted
      ) {
        this.selectedBranchId = wanted;
        this.onBranchChange();
      }
    }
  }

  canEdit(): boolean {
    return true;
  }

  parseBranchId(v: number | string | null | undefined): number | null {
    if (v === '' || v === null || v === undefined) {
      return null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  resolvedBranchId(): number | null {
    return this.selectedBranchId;
  }

  private loadBranches(): void {
    this.branchesLoading = true;
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: res => {
        this.branchesLoading = false;
        this.branches = res.data ?? [];
        if (this.branches.length === 0) {
          this.selectedBranchId = null;
          this.templates = [];
          this.teachers = [];
          this.grades = [];
          this.recipientMeta = null;
          return;
        }
        this.applyParentBranchIfValid();
        this.reload();
      },
      error: err => {
        this.branchesLoading = false;
        this.branches = [];
        this.errorHandler.handleError(err);
      }
    });
  }

  private applyParentBranchIfValid(): void {
    const wanted = this.parseBranchId(this.branchId);
    if (wanted !== null && this.branches.some(b => b.id === wanted)) {
      this.selectedBranchId = wanted;
      return;
    }
    if (
      this.selectedBranchId === null ||
      !this.branches.some(b => b.id === this.selectedBranchId)
    ) {
      this.selectedBranchId = this.branches[0]?.id ?? null;
    }
  }

  onBranchChange(): void {
    this.previewOutput = '';
    this.sendTemplateId = '';
    this.resetRecipientSelections();
    this.reload();
  }

  private resetRecipientSelections(): void {
    this.audience = 'students';
    this.teacherMode = 'all';
    this.selectedTeacherIds = [];
    this.teacherFilter = '';
    this.studentMode = 'all';
    this.gradeWholeSelected = new Set();
    this.sectionSelected = new Set();
    this.selectedStudents = [];
    this.studentSearchCtrl.setValue('', { emitEvent: false });
    this.studentSearchResults = [];
  }

  /** After a successful queue, clear message + recipient UI (branch unchanged). */
  private resetSendFormAfterQueue(): void {
    this.sendTemplateId = '';
    this.sendUseCustomBody = false;
    this.sendCustomBody = '';
    this.previewOutput = '';
    this.previewStudentId = '';
    this.previewTeacherId = '';
    this.previewGlobalAs = 'student';
    this.resetRecipientSelections();
  }

  reload(): void {
    const bid = this.resolvedBranchId();
    if (bid === null) {
      this.templates = [];
      this.teachers = [];
      this.grades = [];
      this.recipientMeta = null;
      return;
    }
    this.loading = true;
    forkJoin({
      templates: this.sms.list(bid),
      options: this.sms.recipientOptions(bid, this.messageChannel)
    }).subscribe({
      next: ({ templates, options }) => {
        this.loading = false;
        if (templates.success && templates.data) {
          this.templates = templates.data.templates ?? [];
        }
        if (options.success && options.data) {
          this.teachers = options.data.teachers ?? [];
          this.grades = options.data.grades ?? [];
          this.recipientMeta = options.data.meta ?? null;
        }
        this.resetRecipientSelections();
      },
      error: err => {
        this.loading = false;
        this.errorHandler.handleError(err);
      }
    });
  }

  /** Templates compatible with current audience (active only). */
  get selectableTemplates(): SmsTemplate[] {
    return this.templates.filter(t => {
      if (!t.is_active) {
        return false;
      }
      if (this.audience === 'global') {
        return t.audience === 'both';
      }
      if (this.audience === 'teachers') {
        return t.audience === 'teacher' || t.audience === 'both';
      }
      return t.audience === 'student' || t.audience === 'both';
    });
  }

  onAudienceChange(): void {
    this.sendTemplateId = '';
    if (this.audience !== 'teachers') {
      this.teacherMode = 'all';
      this.selectedTeacherIds = [];
    }
    if (this.audience !== 'students') {
      this.studentMode = 'all';
      this.gradeWholeSelected = new Set();
      this.sectionSelected = new Set();
      this.selectedStudents = [];
      this.studentSearchCtrl.setValue('', { emitEvent: false });
      this.studentSearchResults = [];
    }
  }

  onTeacherModeChange(): void {
    this.selectedTeacherIds = [];
  }

  onStudentModeChange(): void {
    this.gradeWholeSelected = new Set();
    this.sectionSelected = new Set();
    this.selectedStudents = [];
    this.studentSearchCtrl.setValue('', { emitEvent: false });
    this.studentSearchResults = [];
  }

  onStudentPicked(event: MatAutocompleteSelectedEvent): void {
    const s = event.option.value as SmsStudentSearchItem;
    if (!s || typeof s === 'string') {
      return;
    }
    if (!this.selectedStudents.some(x => x.id === s.id)) {
      this.selectedStudents = [...this.selectedStudents, s];
    }
    this.studentSearchCtrl.setValue('', { emitEvent: false });
    this.studentSearchResults = [];
  }

  removeSelectedStudent(id: number): void {
    this.selectedStudents = this.selectedStudents.filter(x => x.id !== id);
  }

  get filteredTeachers(): SmsRecipientTeacherOption[] {
    const q = this.teacherFilter.trim().toLowerCase();
    if (!q) {
      return this.teachers;
    }
    return this.teachers.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        (t.employee_id || '').toLowerCase().includes(q)
    );
  }

  isTeacherSelected(id: number): boolean {
    return this.selectedTeacherIds.includes(id);
  }

  onTeacherCheck(id: number, checked: boolean): void {
    if (checked) {
      if (!this.selectedTeacherIds.includes(id)) {
        this.selectedTeacherIds = [...this.selectedTeacherIds, id].sort((a, b) => a - b);
      }
    } else {
      this.selectedTeacherIds = this.selectedTeacherIds.filter(x => x !== id);
    }
  }

  sectionKey(grade: string, section: string): string {
    return `${grade}\t${section}`;
  }

  parseSectionKey(key: string): { grade: string; section: string } {
    const i = key.indexOf('\t');
    return { grade: key.slice(0, i), section: key.slice(i + 1) };
  }

  isGradeWhole(grade: string): boolean {
    return this.gradeWholeSelected.has(grade);
  }

  onGradeWholeChange(grade: string, checked: boolean): void {
    const nextG = new Set(this.gradeWholeSelected);
    const nextS = new Set(this.sectionSelected);
    if (checked) {
      nextG.add(grade);
      for (const key of nextS) {
        if (this.parseSectionKey(key).grade === grade) {
          nextS.delete(key);
        }
      }
    } else {
      nextG.delete(grade);
    }
    this.gradeWholeSelected = nextG;
    this.sectionSelected = nextS;
  }

  isSectionSelected(grade: string, section: string): boolean {
    return this.sectionSelected.has(this.sectionKey(grade, section));
  }

  onSectionChange(grade: string, section: string, checked: boolean): void {
    const nextG = new Set(this.gradeWholeSelected);
    const nextS = new Set(this.sectionSelected);
    nextG.delete(grade);
    const k = this.sectionKey(grade, section);
    if (checked) {
      nextS.add(k);
    } else {
      nextS.delete(k);
    }
    this.gradeWholeSelected = nextG;
    this.sectionSelected = nextS;
  }

  buildStudentFilters(): { grade: string; section: string | null }[] {
    const out: { grade: string; section: string | null }[] = [];
    for (const g of this.grades) {
      if (this.gradeWholeSelected.has(g.grade)) {
        out.push({ grade: g.grade, section: null });
        continue;
      }
      for (const sec of g.sections) {
        if (this.sectionSelected.has(this.sectionKey(g.grade, sec.section))) {
          out.push({ grade: g.grade, section: sec.section });
        }
      }
    }
    return out;
  }

  estimatedFilteredStudentCount(): number {
    let n = 0;
    for (const g of this.grades) {
      if (this.gradeWholeSelected.has(g.grade)) {
        n += g.student_count;
        continue;
      }
      for (const sec of g.sections) {
        if (this.sectionSelected.has(this.sectionKey(g.grade, sec.section))) {
          n += sec.student_count;
        }
      }
    }
    return n;
  }

  get recipientSummary(): {
    total: number;
    teachers: number;
    students: number;
    line: string;
  } {
    const meta = this.recipientMeta;
    if (!meta) {
      return { total: 0, teachers: 0, students: 0, line: '—' };
    }
    if (this.audience === 'global') {
      const total = meta.total_teachers + meta.total_students;
      return {
        total,
        teachers: meta.total_teachers,
        students: meta.total_students,
        line: `${meta.total_teachers} teachers · ${meta.total_students} students`
      };
    }
    if (this.audience === 'teachers') {
      if (this.teacherMode === 'all') {
        return {
          total: meta.total_teachers,
          teachers: meta.total_teachers,
          students: 0,
          line: `${meta.total_teachers} teachers (all)`
        };
      }
      const n = this.selectedTeacherIds.length;
      return {
        total: n,
        teachers: n,
        students: 0,
        line: `${n} teacher(s) selected`
      };
    }
    if (this.studentMode === 'all') {
      return {
        total: meta.total_students,
        teachers: 0,
        students: meta.total_students,
        line: `${meta.total_students} students (all)`
      };
    }
    if (this.studentMode === 'selected') {
      const n = this.selectedStudents.length;
      return {
        total: n,
        teachers: 0,
        students: n,
        line: `${n} student(s) chosen`
      };
    }
    const n = this.estimatedFilteredStudentCount();
    return {
      total: n,
      teachers: 0,
      students: n,
      line: `${n} students (by grade/section)`
    };
  }

  canQueueSend(): boolean {
    const s = this.recipientSummary;
    if (s.total <= 0) {
      return false;
    }
    if (this.audience === 'teachers' && this.teacherMode === 'selected') {
      return this.selectedTeacherIds.length > 0;
    }
    if (this.audience === 'students' && this.studentMode === 'filtered') {
      return this.buildStudentFilters().length > 0;
    }
    if (this.audience === 'students' && this.studentMode === 'selected') {
      return this.selectedStudents.length > 0;
    }
    return true;
  }

  messageBodyForSend(): string {
    if (this.sendUseCustomBody) {
      return this.sendCustomBody.trim();
    }
    if (this.sendTemplateId === '') {
      return '';
    }
    const t = this.templates.find(x => x.id === this.sendTemplateId);
    return t ? t.body.trim() : '';
  }

  runPreview(): void {
    const bid = this.resolvedBranchId();
    if (bid === null) {
      return;
    }
    const body = this.sendUseCustomBody ? this.sendCustomBody : this.messageBodyForSend();
    if (!body.trim()) {
      this.snack.open('Choose a template or enter a custom message to preview.', 'Dismiss', {
        duration: 4000
      });
      return;
    }

    let recipientType: 'student' | 'teacher' = 'student';
    if (this.audience === 'teachers') {
      recipientType = 'teacher';
    } else if (this.audience === 'global') {
      recipientType = this.previewGlobalAs;
    }

    if (recipientType === 'student') {
      if (this.previewStudentId === '' || this.previewStudentId === null) {
        this.snack.open('Enter a sample student ID for preview.', 'Dismiss', { duration: 4000 });
        return;
      }
    } else if (this.previewTeacherId === '' || this.previewTeacherId === null) {
      this.snack.open('Enter a sample teacher ID for preview.', 'Dismiss', { duration: 4000 });
      return;
    }

    this.previewing = true;
    this.previewOutput = '';

    const payload: {
      recipient_type: 'student' | 'teacher';
      body?: string;
      template_id?: number;
      student_id?: number;
      teacher_id?: number;
    } = { recipient_type: recipientType };

    if (this.sendUseCustomBody) {
      payload.body = this.sendCustomBody;
    } else if (this.sendTemplateId !== '') {
      payload.template_id = Number(this.sendTemplateId);
    } else {
      this.previewing = false;
      this.snack.open('Choose a template or enable custom message for preview.', 'Dismiss', {
        duration: 4000
      });
      return;
    }

    if (recipientType === 'student') {
      payload.student_id = Number(this.previewStudentId);
    } else {
      payload.teacher_id = Number(this.previewTeacherId);
    }

    this.sms.preview(bid, payload).subscribe({
      next: res => {
        this.previewing = false;
        if (res.success && res.data) {
          this.previewOutput = res.data.rendered_body;
        }
      },
      error: err => {
        this.previewing = false;
        this.errorHandler.handleError(err);
      }
    });
  }

  /** Opens confirm dialog with message + sample; actual queue happens on OK. */
  onQueueSendClick(): void {
    const bid = this.resolvedBranchId();
    if (bid === null || !this.canEdit()) {
      return;
    }
    const body = this.messageBodyForSend();
    if (!body) {
      this.snack.open('Select a template or enter a custom message.', 'Dismiss', { duration: 4000 });
      return;
    }
    if (!this.canQueueSend()) {
      this.snack.open('Choose recipients for this audience.', 'Dismiss', { duration: 5000 });
      return;
    }

    const payload = this.buildBulkSendPayload();
    this.previewLoading = true;
    this.sms.previewBulkSend(bid, payload, this.messageChannel).subscribe({
      next: res => {
        this.previewLoading = false;
        if (!res.success || !res.data) {
          return;
        }
        const ref = this.dialog.open(SmsSendConfirmDialogComponent, {
          width: 'min(520px, calc(100vw - 32px))',
          maxHeight: '90vh',
          autoFocus: 'dialog',
          data: {
            bodyTemplate: res.data.body_template,
            sampleRendered: res.data.sample_rendered || '',
            sampleLabel: res.data.sample_label,
            recipientCount: res.data.recipient_count
          }
        });
        ref.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.sendBulk();
          }
        });
      },
      error: err => {
        this.previewLoading = false;
        this.errorHandler.handleError(err);
      }
    });
  }

  private buildBulkSendPayload(): Parameters<SmsTemplateService['bulkSend']>[1] {
    const body = this.messageBodyForSend();
    const payload: Parameters<SmsTemplateService['bulkSend']>[1] = {
      audience: this.audience
    };
    if (this.sendUseCustomBody) {
      payload.body = body;
    } else if (this.sendTemplateId !== '') {
      payload.template_id = Number(this.sendTemplateId);
    } else {
      payload.body = body;
    }

    if (this.audience === 'teachers') {
      payload.teacher_mode = this.teacherMode;
      if (this.teacherMode === 'selected') {
        payload.teacher_ids = [...this.selectedTeacherIds];
      }
    }
    if (this.audience === 'students') {
      payload.student_mode = this.studentMode;
      if (this.studentMode === 'filtered') {
        payload.student_filters = this.buildStudentFilters();
      }
      if (this.studentMode === 'selected') {
        payload.student_ids = this.selectedStudents.map(s => s.id);
      }
    }

    return payload;
  }

  sendBulk(): void {
    const bid = this.resolvedBranchId();
    if (bid === null || !this.canEdit()) {
      return;
    }
    const body = this.messageBodyForSend();
    if (!body) {
      this.snack.open('Select a template or enter a custom message.', 'Dismiss', { duration: 4000 });
      return;
    }
    if (!this.canQueueSend()) {
      this.snack.open('Choose recipients for this audience.', 'Dismiss', { duration: 5000 });
      return;
    }

    this.sending = true;
    this.globalLoading.show();
    const payload = this.buildBulkSendPayload();

    this.sms
      .bulkSend(bid, payload, this.messageChannel)
      .pipe(
        finalize(() => {
          this.sending = false;
          this.globalLoading.hide();
        })
      )
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            const apiMsg = (res.message ?? '').trim();
            const detail = res.data;
            const extra =
              detail.queue_id != null
                ? ` (${detail.recipient_count} recipient(s), queue #${detail.queue_id})`
                : '';
            this.errorHandler.showSuccess(
              apiMsg ? `${apiMsg}${extra}` : `Queued ${detail.recipient_count} message(s).${extra}`,
              6000
            );
            this.resetSendFormAfterQueue();
            this.bulkQueued.emit({
              queue_id: detail.queue_id != null ? Number(detail.queue_id) : undefined
            });
          }
        },
        error: err => {
          this.errorHandler.handleError(err);
        }
      });
  }
}
