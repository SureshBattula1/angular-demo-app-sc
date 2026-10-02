import { Component, OnInit, inject } from '@angular/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import {
  SmsTemplatesManageDialogComponent
} from '../../../bulk-management/pages/sms-templates-manage-dialog/sms-templates-manage-dialog.component';
import { Branch } from '../../../../core/models/branch.model';
import { StaffGroupPickerComponent } from '../../components/staff-group-picker/staff-group-picker.component';
import {
  CampaignModuleMeta,
  CampaignSample,
  CampaignStatusOption,
  NotificationCampaignService,
  ExamNotifyMode,
  ExamNotifyOption,
  FeeNotifyMode,
  FeeStructureOption,
  FeeTypeOption,
  EligibleTargetsResponse,
  SectionNotificationStatus
} from '../../services/notification-campaign.service';

interface SectionChoice {
  grade: string;
  section: string;
  student_count: number;
  enrolledCount: number;
  markedCount: number;
  tallyPresent: number;
  tallyAbsent: number;
  tallyLeave: number;
  selected: boolean;
  selectable: boolean;
  attendanceMarked: boolean;
  notificationStatus: SectionNotificationStatus;
  examScheduleCount: number;
  examMarksCount: number;
  examCriteriaMet: boolean;
  feeUnpaidCount: number;
  feeOverdueCount: number;
  /** Students matching reminder filters (balance due > 0). */
  feeReminderCount: number;
  feeCriteriaMet: boolean;
  structureApplies: boolean;
  structureEnrolledCount: number;
}

interface ClassGroup {
  grade: string;
  className: string;
  sections: SectionChoice[];
}

interface SectionSummaryRow {
  className: string;
  section: string;
  studentCount: number;
  reason?: string;
}

@Component({
  selector: 'app-campaign-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, StaffGroupPickerComponent],
  templateUrl: './campaign-schedule.component.html',
  styleUrls: ['./campaign-schedule.component.scss']
})
export class CampaignScheduleComponent implements OnInit {
  module = 'attendance';
  step = 1;
  saving = false;
  loadingClasses = false;
  moduleMeta: CampaignModuleMeta | null = null;
  branches: { id: string | number; name: string }[] = [];
  branchId = '';
  eventDate: Date = new Date();
  classGroups: ClassGroup[] = [];
  statuses: CampaignStatusOption[] = [];
  templates: { id: number; name: string }[] = [];
  templateMap: Record<string, number | null> = {};
  samples: CampaignSample[] = [];
  showPreview = false;
  showSelectionConfirm = false;
  examNotifyMode: ExamNotifyMode = 'scheduled';
  examOptions: ExamNotifyOption[] = [];
  selectedExamId = '';
  /** Search text or exam id while Material autocomplete updates the control. */
  examFilterQuery: string | number = '';
  examScheduleDates: string[] = [];
  feeNotifyMode: FeeNotifyMode = 'due';
  feeTypeOptions: FeeTypeOption[] = [];
  feeStructureOptions: FeeStructureOption[] = [];
  selectedFeeType = '';
  selectedFeeStructureId = '';
  feeFilterQuery: string | number = '';
  feeStructureFilterQuery: string | number = '';
  feeDueDates: string[] = [];
  selectedDueDateIso = '';
  feeDueDateFilterQuery = '';
  /** Default rows shown in schedule filter dropdowns before user searches. */
  readonly filterDropdownDefaultSize = 10;
  /** @deprecated use filterDropdownDefaultSize — kept for template bindings */
  readonly examDropdownDefaultSize = 10;
  /** Autocomplete sentinel to clear the current filter selection. */
  readonly filterClearValue = '__none__';

  /** From eligible-targets meta — only template rows for assignment statuses on this date. */
  assignmentStatusKeys: string[] = [];

  staffGroups: { key: string; label: string; people: { user_id: number; name: string; subtitle: string }[] }[] =
    [];
  loadingStaff = false;
  selectedStaffUserIds: number[] = [];
  staffTemplateId: number | null = null;

  private loadToken = 0;
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private branchService: BranchService,
    private campaigns: NotificationCampaignService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.module = this.route.snapshot.paramMap.get('module') || 'attendance';
    this.clampEventDateToPolicy();
    this.branchService.getBranches().subscribe({
      next: response => {
        this.branches = (response.data || []).map((branch: { id: string | number; name: string }) => ({
          id: branch.id,
          name: branch.name
        }));
      },
      error: error => this.errorHandler.showError(error)
    });
    this.route.paramMap.subscribe(params => {
      this.module = params.get('module') || 'attendance';
      this.clampEventDateToPolicy();
      if (this.branchId) {
        this.loadClasses();
      }
    });
    this.campaigns.modules().subscribe({
      next: response => {
        this.statuses = response.data?.[this.module] || [];
        this.moduleMeta = response.meta?.[this.module] || null;
        this.statuses.forEach(status => {
          this.templateMap[status.key] = null;
        });
        this.clampEventDateToPolicy();
        if (this.branchId) {
          this.loadClasses();
        }
      }
    });
  }

  get isAttendanceModule(): boolean {
    return this.module === 'attendance';
  }

  get isExamsModule(): boolean {
    return this.module === 'exams';
  }

  get isFeesModule(): boolean {
    return this.module === 'fees';
  }

  get isHolidaysModule(): boolean {
    return this.module === 'holidays';
  }

  get isAssignmentsModule(): boolean {
    return this.module === 'assignments';
  }

  get isCustomModule(): boolean {
    return this.module === 'custom';
  }

  get hasSelectableSectionsForDate(): boolean {
    return this.classGroups.some(group => group.sections.some(section => section.selectable));
  }

  /** Human labels for assignment_status_keys (e.g. due → Assignment). */
  get assignmentStatusLabelsHint(): string {
    if (!this.assignmentStatusKeys.length) {
      return '';
    }
    const labelByKey = new Map(this.statuses.map(status => [status.key, status.label]));
    return this.assignmentStatusKeys.map(key => labelByKey.get(key) ?? key).join(', ');
  }

  get filteredStatuses(): CampaignStatusOption[] {
    if (this.isFeesModule) {
      if (this.feeNotifyMode === 'structure') {
        return this.statuses.filter(status => status.key === 'structure');
      }
      return this.statuses.filter(status => status.key === 'due' || status.key === 'overdue');
    }
    if (this.isAssignmentsModule) {
      const keys =
        this.assignmentStatusKeys.length > 0
          ? this.assignmentStatusKeys
          : this.statuses.map(status => status.key);
      return this.statuses.filter(status => keys.includes(status.key));
    }
    if (this.isCustomModule) {
      return this.statuses;
    }
    if (!this.isExamsModule) {
      return this.statuses;
    }
    return this.statuses.filter(status => status.key === this.examNotifyMode);
  }

  get feeNotifyModeLabel(): string {
    return this.feeNotifyMode === 'structure' ? 'Fee structure notify' : 'Due notify';
  }

  get selectedFeeStructureOption(): FeeStructureOption | undefined {
    return this.feeStructureOptions.find(
      option => String(option.fee_structure_id) === String(this.selectedFeeStructureId)
    );
  }

  get selectedFeeTypeOption(): FeeTypeOption | undefined {
    return this.feeTypeOptions.find(option => String(option.fee_type) === String(this.selectedFeeType));
  }

  get selectedFeeStructureIsClosed(): boolean {
    const option = this.selectedFeeStructureOption;
    return !!option && !option.selectable;
  }

  get selectedFeeTypeIsClosed(): boolean {
    const option = this.selectedFeeTypeOption;
    return !!option && !option.selectable;
  }

  get structureDueDateChip(): string | null {
    return this.selectedFeeStructureOption?.due_date ?? null;
  }

  get feeFilterQueryText(): string {
    return this.displayFeeTypeInInput(this.feeFilterQuery).trim();
  }

  get feeStructureFilterQueryText(): string {
    return this.displayFeeStructureInInput(this.feeStructureFilterQuery).trim();
  }

  get feeTypeOptionsInDropdown(): FeeTypeOption[] {
    const sorted = this.sortedFeeTypeOptions();
    const query = this.feeFilterQueryText.toLowerCase();
    if (!query) {
      return sorted.slice(0, this.filterDropdownDefaultSize);
    }
    return sorted
      .filter(option => {
        const label = this.feeTypeOptionLabel(option).toLowerCase();
        return label.includes(query) || (option.fee_type || '').toLowerCase().includes(query);
      })
      .slice(0, 50);
  }

  get feeTypeDropdownTotalCount(): number {
    return this.feeTypeOptions.length;
  }

  get feeTypeDropdownShowsSearchHint(): boolean {
    return !this.feeFilterQueryText && this.feeTypeDropdownTotalCount > this.filterDropdownDefaultSize;
  }

  get feeStructureOptionsInDropdown(): FeeStructureOption[] {
    const sorted = this.sortedFeeStructureOptions();
    const query = this.feeStructureFilterQueryText.toLowerCase();
    if (!query) {
      return sorted.slice(0, this.filterDropdownDefaultSize);
    }
    return sorted
      .filter(option => {
        const label = (option.label || '').toLowerCase();
        return label.includes(query) || (option.fee_type || '').toLowerCase().includes(query);
      })
      .slice(0, 50);
  }

  get feeStructureDropdownTotalCount(): number {
    return this.feeStructureOptions.length;
  }

  get feeStructureDropdownShowsSearchHint(): boolean {
    return !this.feeStructureFilterQueryText && this.feeStructureDropdownTotalCount > this.filterDropdownDefaultSize;
  }

  get examNotifyModeLabel(): string {
    return this.examNotifyMode === 'scheduled' ? 'Upcoming exam schedule' : 'Exam results';
  }

  /** Active first, then Closed; newest exam id first within each group. */
  get examFilterQueryText(): string {
    return this.examFilterText(this.examFilterQuery);
  }

  get examOptionsInDropdown(): ExamNotifyOption[] {
    const sorted = this.sortedExamOptions();
    const query = this.examFilterQueryText.toLowerCase();
    if (!query) {
      return sorted.slice(0, this.filterDropdownDefaultSize);
    }
    return sorted
      .filter(option => {
        const label = this.examOptionLabel(option).toLowerCase();
        const name = (option.name || '').toLowerCase();
        const year = (option.academic_year || '').toLowerCase();
        return label.includes(query) || name.includes(query) || year.includes(query);
      })
      .slice(0, 50);
  }

  get examDropdownShowsSearchHint(): boolean {
    return !this.examFilterQueryText && this.sortedExamOptions().length > this.filterDropdownDefaultSize;
  }

  get examDropdownTotalCount(): number {
    return this.examOptions.length;
  }

  get selectedExamOption(): ExamNotifyOption | undefined {
    return this.examOptions.find(option => String(option.exam_id) === String(this.selectedExamId));
  }

  get selectedExamIsClosed(): boolean {
    const option = this.selectedExamOption;
    return !!option && !option.selectable;
  }

  get isTodayOnlyDate(): boolean {
    return this.isAttendanceModule || this.moduleMeta?.event_date_policy === 'today_only';
  }

  get minEventDate(): Date {
    return this.startOfDay(new Date());
  }

  get maxEventDate(): Date {
    return this.endOfDay(new Date());
  }

  get title(): string {
    const label = this.moduleMeta?.label || this.module;
    return `Schedule ${label} notification`;
  }

  moduleIcon(): string {
    const icons: Record<string, string> = {
      attendance: 'fact_check',
      exams: 'assignment',
      fees: 'payments',
      holidays: 'event',
      assignments: 'assignment_turned_in',
      custom: 'edit_note'
    };
    return icons[this.module] || 'campaign';
  }

  /** Full section label for class cards (avoid "Sec A" shorthand). */
  sectionDisplayLabel(sectionCode: string): string {
    const code = (sectionCode ?? '').trim();
    if (!code) {
      return 'Section';
    }
    if (/^section\s+/i.test(code)) {
      return code;
    }
    return `Section ${code}`;
  }

  get requiresEventDate(): boolean {
    return this.moduleMeta?.requires_event_date ?? this.module === 'attendance';
  }

  get usesEligibleTargets(): boolean {
    return (
      this.isAttendanceModule ||
      this.isExamsModule ||
      this.isFeesModule ||
      this.isCustomModule ||
      (this.moduleMeta?.requires_event_date ?? false)
    );
  }

  get showEventDatePicker(): boolean {
    return (
      !this.isTodayOnlyDate &&
      !this.isExamsModule &&
      this.requiresEventDate &&
      !(this.isFeesModule && (this.feeNotifyMode === 'structure' || this.feeNotifyMode === 'due'))
    );
  }

  get feeDueDateFilterQueryText(): string {
    return this.displayFeeDueDateInInput(this.feeDueDateFilterQuery).trim();
  }

  get feeDueDatesInDropdown(): string[] {
    const query = this.feeDueDateFilterQueryText.toLowerCase();
    if (!query) {
      return this.feeDueDates.slice(0, this.filterDropdownDefaultSize);
    }
    return this.feeDueDates
      .filter(iso => {
        const label = this.feeDueDateDisplay(iso).toLowerCase();
        return label.includes(query) || iso.includes(query);
      })
      .slice(0, 50);
  }

  get feeDueDateDropdownTotalCount(): number {
    return this.feeDueDates.length;
  }

  get feeDueDateDropdownShowsSearchHint(): boolean {
    return !this.feeDueDateFilterQueryText && this.feeDueDateDropdownTotalCount > this.filterDropdownDefaultSize;
  }

  get eventDateFieldLabel(): string {
    return this.isFeesModule && this.feeNotifyMode === 'due' ? 'Due date' : 'Date';
  }

  get confirmSelection(): boolean {
    return this.moduleMeta?.confirm_selection ?? this.module === 'attendance';
  }

  get selectableSections(): SectionChoice[] {
    return this.classGroups.flatMap(group => group.sections.filter(section => section.selectable));
  }

  get selectedCount(): number {
    return this.selectableSections.filter(section => section.selected).length;
  }

  get branchName(): string {
    const branch = this.branches.find(item => String(item.id) === String(this.branchId));
    return branch?.name || '';
  }

  get confirmedSelectedSections(): SectionSummaryRow[] {
    return this.flattenSectionRows(row => row.selectable && row.selected);
  }

  get confirmedNotSelectedSections(): SectionSummaryRow[] {
    return this.flattenSectionRows(row => {
      if (!row.selectable) {
        return true;
      }
      return !row.selected;
    }).map(row => ({
      ...row,
      reason: row.reason || 'Not selected'
    }));
  }

  onBranchChange(): void {
    this.classGroups = [];
    this.templates = [];
    this.examOptions = [];
    this.selectedExamId = '';
    this.examFilterQuery = '';
    this.feeTypeOptions = [];
    this.feeStructureOptions = [];
    this.selectedFeeType = '';
    this.selectedFeeStructureId = '';
    this.feeFilterQuery = '';
    this.feeStructureFilterQuery = '';
    this.feeDueDates = [];
    this.selectedDueDateIso = '';
    this.feeDueDateFilterQuery = '';
    this.selectedStaffUserIds = [];
    this.staffTemplateId = null;
    this.staffGroups = [];
    if (!this.branchId) {
      return;
    }
    this.loadClasses();
    this.loadStaffOptions();
    this.reloadBranchTemplates();
  }

  loadStaffOptions(): void {
    if (!this.branchId) {
      this.staffGroups = [];
      return;
    }
    this.loadingStaff = true;
    this.campaigns.staffRecipientOptions(this.branchId).subscribe({
      next: response => {
        this.loadingStaff = false;
        this.staffGroups = response.data?.groups ?? [];
      },
      error: error => {
        this.loadingStaff = false;
        this.errorHandler.showError(error);
        this.staffGroups = [];
      }
    });
  }

  selectedIdsForStaffGroup(groupKey: string): number[] {
    const people = this.staffGroups.find(g => g.key === groupKey)?.people ?? [];
    const allowed = new Set(people.map(p => p.user_id));
    return this.selectedStaffUserIds.filter(id => allowed.has(id));
  }

  onStaffGroupSelectionChange(groupKey: string, ids: number[]): void {
    const people = this.staffGroups.find(g => g.key === groupKey)?.people ?? [];
    const allowed = new Set(people.map(p => p.user_id));
    const kept = this.selectedStaffUserIds.filter(id => !allowed.has(id));
    this.selectedStaffUserIds = [...kept, ...ids];
  }

  addAllRecipientsForCustom(): void {
    if (!this.isCustomModule) {
      return;
    }
    this.classGroups.forEach(group => {
      group.sections.forEach(section => {
        if (section.selectable) {
          section.selected = true;
        }
      });
    });
    const allStaff: number[] = [];
    this.staffGroups.forEach(group => {
      group.people.forEach(p => allStaff.push(p.user_id));
    });
    this.selectedStaffUserIds = [...new Set(allStaff)];
  }

  reloadBranchTemplates(): void {
    if (!this.branchId) {
      this.templates = [];
      return;
    }
    this.campaigns.templates(this.branchId).subscribe({
      next: response => {
        this.templates = response.data || [];
      },
      error: error => this.errorHandler.showError(error)
    });
  }

  openTemplatesManageDialog(): void {
    if (!this.branchId) {
      this.snack.open('Select a branch first.', 'Dismiss', { duration: 4000 });
      return;
    }
    if (this.branches.length === 0) {
      this.snack.open('No branches available.', 'Dismiss', { duration: 4000 });
      return;
    }

    this.dialog
      .open(SmsTemplatesManageDialogComponent, {
        width: 'min(560px, calc(100vw - 16px))',
        maxHeight: '90vh',
        autoFocus: 'first-tabbable',
        data: {
          branchId: this.branchId,
          branches: this.branches as Branch[]
        }
      })
      .afterClosed()
      .subscribe(changed => {
        if (changed) {
          this.reloadBranchTemplates();
        }
      });
  }

  parseExamHintDate(iso: string): Date {
    return this.parseLocalDate(iso);
  }

  onEventDatePicked(event: MatDatepickerInputEvent<Date>): void {
    this.onDateChange(event.value ?? null);
  }

  onDateChange(picked: Date | null = null): void {
    if (this.isTodayOnlyDate) {
      this.clampEventDateToPolicy();
      return;
    }
    if (picked instanceof Date && !Number.isNaN(picked.getTime())) {
      this.eventDate = this.startOfDay(picked);
    }
    this.resetClassSelectionForDateReload();
    if (this.usesEligibleTargets && this.branchId) {
      this.loadClasses();
    }
  }

  /** Clear section grid and selections when the event date changes (holidays, assignments, etc.). */
  private resetClassSelectionForDateReload(): void {
    this.classGroups = [];
    this.assignmentStatusKeys = [];
  }

  onExamNotifyModeChange(): void {
    this.selectedExamId = '';
    this.examFilterQuery = '';
    this.examOptions = [];
    this.classGroups = [];
    this.loadClasses();
  }

  onFeeNotifyModeChange(): void {
    this.selectedFeeType = '';
    this.selectedFeeStructureId = '';
    this.feeFilterQuery = '';
    this.feeStructureFilterQuery = '';
    this.feeTypeOptions = [];
    this.feeStructureOptions = [];
    this.feeDueDates = [];
    this.selectedDueDateIso = '';
    this.feeDueDateFilterQuery = '';
    this.classGroups = [];
    this.loadClasses();
  }

  feeTypeOptionLabel(option: FeeTypeOption): string {
    const state = option.list_state === 'active' ? 'Active' : 'Closed';
    return `${option.label}: ${state}`;
  }

  feeTypeFieldDisplay(option: FeeTypeOption): string {
    return option.label || option.fee_type;
  }

  feeStructureFieldDisplay(option: FeeStructureOption): string {
    return option.label || option.fee_structure_id;
  }

  displayFeeTypeInInput = (value: string | number | FeeTypeOption | null | undefined): string => {
    if (value == null || value === '') {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      const option = this.feeTypeOptions.find(item => item.fee_type === String(value));
      return option ? this.feeTypeFieldDisplay(option) : '';
    }
    if (typeof value === 'object' && 'fee_type' in value) {
      return this.feeTypeFieldDisplay(value);
    }
    return '';
  };

  displayFeeStructureInInput = (value: string | number | FeeStructureOption | null | undefined): string => {
    if (value == null || value === '') {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && 'fee_structure_id' in value) {
      return this.feeStructureFieldDisplay(value);
    }
    return '';
  };

  onFeeFilterQueryChange(value: string | number | FeeTypeOption): void {
    if (value != null && typeof value === 'object' && 'fee_type' in value) {
      this.feeFilterQuery = this.feeTypeFieldDisplay(value);
      return;
    }
    this.feeFilterQuery = value ?? '';
  }

  onFeeStructureFilterQueryChange(value: string | number | FeeStructureOption): void {
    if (value != null && typeof value === 'object' && 'fee_structure_id' in value) {
      this.feeStructureFilterQuery = this.feeStructureFieldDisplay(value);
      return;
    }
    this.feeStructureFilterQuery = value ?? '';
  }

  onFeeTypeOptionSelected(feeType: string): void {
    if (String(feeType) === this.filterClearValue) {
      this.clearFeeTypeSelection();
      return;
    }
    const option = this.feeTypeOptions.find(item => String(item.fee_type) === String(feeType));
    if (!option) {
      return;
    }
    if (!option.selectable) {
      this.errorHandler.showError('This fee type is closed — notification already sent for all sections.');
      this.syncFeeFilterFromSelection();
      return;
    }
    this.selectedFeeType = String(option.fee_type);
    this.feeFilterQuery = this.feeTypeFieldDisplay(option);
    this.selectedDueDateIso = '';
    this.feeDueDateFilterQuery = '';
    this.loadFeesDueScheduleShell();
  }

  onFeeStructureOptionSelected(feeStructureId: string): void {
    if (String(feeStructureId) === this.filterClearValue) {
      this.clearFeeStructureSelection();
      return;
    }
    const option = this.feeStructureOptions.find(
      item => String(item.fee_structure_id) === String(feeStructureId)
    );
    if (!option) {
      return;
    }
    if (!option.selectable) {
      this.errorHandler.showError('This fee structure is closed — notification already sent for all sections.');
      this.syncFeeStructureFilterFromSelection();
      return;
    }
    this.selectedFeeStructureId = String(option.fee_structure_id);
    this.feeStructureFilterQuery = this.feeStructureFieldDisplay(option);
    this.loadClasses();
  }

  openFeeTypeDropdown(trigger: MatAutocompleteTrigger, input: HTMLInputElement): void {
    if (!this.feeTypeOptions.length) {
      return;
    }
    trigger.openPanel();
    input.focus();
  }

  toggleFeeTypeDropdown(trigger: MatAutocompleteTrigger, input: HTMLInputElement): void {
    if (trigger.panelOpen) {
      trigger.closePanel();
      return;
    }
    this.openFeeTypeDropdown(trigger, input);
  }

  openFeeStructureDropdown(trigger: MatAutocompleteTrigger, input: HTMLInputElement): void {
    if (!this.feeStructureOptions.length) {
      return;
    }
    trigger.openPanel();
    input.focus();
  }

  toggleFeeStructureDropdown(trigger: MatAutocompleteTrigger, input: HTMLInputElement): void {
    if (trigger.panelOpen) {
      trigger.closePanel();
      return;
    }
    this.openFeeStructureDropdown(trigger, input);
  }

  onFeeTypeFilterFocus(trigger: MatAutocompleteTrigger): void {
    if (!this.feeFilterQueryText && this.selectedFeeTypeOption) {
      this.feeFilterQuery = this.feeTypeFieldDisplay(this.selectedFeeTypeOption);
    }
    if (this.feeTypeOptions.length) {
      window.setTimeout(() => trigger.openPanel(), 0);
    }
  }

  onFeeStructureFilterFocus(trigger: MatAutocompleteTrigger): void {
    if (!this.feeStructureFilterQueryText && this.selectedFeeStructureOption) {
      this.feeStructureFilterQuery = this.feeStructureFieldDisplay(this.selectedFeeStructureOption);
    }
    if (this.feeStructureOptions.length) {
      window.setTimeout(() => trigger.openPanel(), 0);
    }
  }

  feeDueDateDisplay(iso: string): string {
    if (!iso) {
      return '';
    }
    return this.parseLocalDate(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  displayFeeDueDateInInput = (value: string | null | undefined): string => {
    if (value == null || value === '') {
      return '';
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return this.feeDueDateDisplay(value);
    }
    return value;
  };

  onFeeDueDateFilterQueryChange(value: string): void {
    this.feeDueDateFilterQuery = value ?? '';
  }

  onFeeDueDateOptionSelected(iso: string): void {
    if (String(iso) === this.filterClearValue) {
      this.clearFeeDueDateSelection();
      return;
    }
    this.selectFeeDueDate(iso, true);
  }

  clearExamSelection(): void {
    this.selectedExamId = '';
    this.examFilterQuery = '';
    this.classGroups = [];
    if (this.branchId) {
      this.loadClasses();
    }
  }

  clearFeeStructureSelection(): void {
    this.selectedFeeStructureId = '';
    this.feeStructureFilterQuery = '';
    this.classGroups = [];
    if (this.branchId) {
      this.loadClasses();
    }
  }

  clearFeeTypeSelection(): void {
    this.selectedFeeType = '';
    this.feeFilterQuery = '';
    this.selectedDueDateIso = '';
    this.feeDueDateFilterQuery = '';
    this.feeDueDates = [];
    this.classGroups = [];
    if (this.branchId) {
      this.loadFeesDueScheduleShell();
    }
  }

  clearFeeDueDateSelection(): void {
    this.selectedDueDateIso = '';
    this.feeDueDateFilterQuery = '';
    this.classGroups = [];
    if (this.branchId) {
      this.loadFeesDueScheduleShell();
    }
  }

  openFeeDueDateDropdown(trigger: MatAutocompleteTrigger, input: HTMLInputElement): void {
    if (!this.feeDueDates.length) {
      return;
    }
    trigger.openPanel();
    input.focus();
  }

  toggleFeeDueDateDropdown(trigger: MatAutocompleteTrigger, input: HTMLInputElement): void {
    if (trigger.panelOpen) {
      trigger.closePanel();
      return;
    }
    this.openFeeDueDateDropdown(trigger, input);
  }

  onFeeDueDateFilterFocus(trigger: MatAutocompleteTrigger): void {
    if (!this.feeDueDateFilterQueryText && this.selectedDueDateIso) {
      this.feeDueDateFilterQuery = this.feeDueDateDisplay(this.selectedDueDateIso);
    }
    if (this.feeDueDates.length) {
      window.setTimeout(() => trigger.openPanel(), 0);
    }
  }

  isUpcomingDueDate(iso: string): boolean {
    return iso >= this.formatDateYmd(new Date());
  }

  private selectFeeDueDate(iso: string, reload: boolean): void {
    this.selectedDueDateIso = iso;
    this.eventDate = this.parseLocalDate(iso);
    this.feeDueDateFilterQuery = this.feeDueDateDisplay(iso);
    if (reload) {
      this.loadClasses();
    }
  }

  private syncFeeDueDateFilterFromSelection(): void {
    this.feeDueDateFilterQuery = this.selectedDueDateIso
      ? this.feeDueDateDisplay(this.selectedDueDateIso)
      : '';
  }

  private syncFeeFilterFromSelection(): void {
    const option = this.selectedFeeTypeOption;
    this.feeFilterQuery = option ? this.feeTypeFieldDisplay(option) : '';
  }

  private syncFeeStructureFilterFromSelection(): void {
    const option = this.selectedFeeStructureOption;
    this.feeStructureFilterQuery = option ? this.feeStructureFieldDisplay(option) : '';
  }

  private sortedFeeTypeOptions(): FeeTypeOption[] {
    return [...this.feeTypeOptions].sort((a, b) => {
      if (a.list_state !== b.list_state) {
        return a.list_state === 'active' ? -1 : 1;
      }
      return (a.label || '').localeCompare(b.label || '');
    });
  }

  private sortedFeeStructureOptions(): FeeStructureOption[] {
    return [...this.feeStructureOptions].sort((a, b) => {
      if (a.list_state !== b.list_state) {
        return a.list_state === 'active' ? -1 : 1;
      }
      return (a.label || '').localeCompare(b.label || '');
    });
  }

  examOptionLabel(option: ExamNotifyOption): string {
    const state = option.list_state === 'active' ? 'Active' : 'Closed';
    const year = option.academic_year ? ` (${option.academic_year})` : '';
    return `${option.name}${year}: ${state}`;
  }

  /** Shown in the closed combobox when an exam is selected. */
  examFieldDisplay(option: ExamNotifyOption): string {
    const year = option.academic_year ? ` (${option.academic_year})` : '';
    return `${option.name}${year}`;
  }

  displayExamInInput = (value: string | number | ExamNotifyOption | null | undefined): string => {
    if (value == null || value === '') {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      const option = this.examOptions.find(item => Number(item.exam_id) === value);
      return option ? this.examFieldDisplay(option) : '';
    }
    if (typeof value === 'object' && 'exam_id' in value) {
      return this.examFieldDisplay(value);
    }
    return '';
  };

  onExamFilterQueryChange(value: string | number | ExamNotifyOption): void {
    if (value != null && typeof value === 'object' && 'exam_id' in value) {
      this.examFilterQuery = this.examFieldDisplay(value);
      return;
    }
    if (typeof value === 'number') {
      const option = this.examOptions.find(item => Number(item.exam_id) === value);
      this.examFilterQuery = option ? this.examFieldDisplay(option) : '';
      return;
    }
    this.examFilterQuery = value ?? '';
  }

  openExamDropdown(trigger: MatAutocompleteTrigger, input: HTMLInputElement): void {
    if (!this.examOptions.length) {
      return;
    }
    trigger.openPanel();
    input.focus();
  }

  toggleExamDropdown(trigger: MatAutocompleteTrigger, input: HTMLInputElement): void {
    if (trigger.panelOpen) {
      trigger.closePanel();
      return;
    }
    this.openExamDropdown(trigger, input);
  }

  onExamOptionSelected(examId: string | number): void {
    if (String(examId) === this.filterClearValue) {
      this.clearExamSelection();
      return;
    }
    const option = this.examOptions.find(item => String(item.exam_id) === String(examId));
    if (!option) {
      return;
    }
    if (!option.selectable) {
      this.errorHandler.showError('This exam is closed — notification already sent for all sections.');
      this.syncExamFilterFromSelection();
      return;
    }
    this.selectedExamId = String(option.exam_id);
    this.examFilterQuery = this.examFieldDisplay(option);
    this.loadClasses();
  }

  onExamFilterFocus(trigger: MatAutocompleteTrigger): void {
    if (!this.examFilterQueryText && this.selectedExamOption) {
      this.examFilterQuery = this.examFieldDisplay(this.selectedExamOption);
    }
    if (this.examOptions.length) {
      window.setTimeout(() => trigger.openPanel(), 0);
    }
  }

  onExamFilterBlur(): void {
    window.setTimeout(() => this.syncExamFilterFromSelection(), 150);
  }

  private syncExamFilterFromSelection(): void {
    const option = this.selectedExamOption;
    this.examFilterQuery = option ? this.examFieldDisplay(option) : '';
  }

  private examFilterText(value: string | number | ExamNotifyOption | null | undefined): string {
    return this.displayExamInInput(value).trim();
  }

  private sortedExamOptions(): ExamNotifyOption[] {
    return [...this.examOptions].sort((a, b) => {
      if (a.list_state !== b.list_state) {
        return a.list_state === 'active' ? -1 : 1;
      }
      return Number(b.exam_id) - Number(a.exam_id);
    });
  }

  private applyExamSelectability(): void {
    if (!this.isExamsModule) {
      return;
    }
    this.classGroups.forEach(group => {
      group.sections.forEach(section => {
        section.examCriteriaMet =
          this.examNotifyMode === 'scheduled' ? section.examScheduleCount > 0 : section.examMarksCount > 0;
        const blocked =
          section.notificationStatus === 'sent' ||
          section.notificationStatus === 'sending' ||
          section.notificationStatus === 'partial';
        section.selectable = section.examCriteriaMet && !blocked;
        if (!section.selectable) {
          section.selected = false;
        }
      });
    });
  }

  private feesDueEligibleReady(): boolean {
    return (
      this.isFeesModule &&
      this.feeNotifyMode === 'due' &&
      !!this.selectedFeeType &&
      !!this.selectedDueDateIso
    );
  }

  /** Branch / fee type / due date pickers only — no eligible-targets until both filters are set. */
  loadFeesDueScheduleShell(): void {
    if (!this.branchId || !this.isFeesModule || this.feeNotifyMode !== 'due') {
      this.loadClasses();
      return;
    }

    const token = ++this.loadToken;
    this.loadingClasses = true;
      forkJoin({
        classes: this.campaigns.classOptions(this.branchId),
      meta: this.campaigns.feesDueNotifyMeta(
        this.branchId,
        this.selectedFeeType || undefined
      )
      }).subscribe({
      next: ({ classes, meta }) => {
          if (token !== this.loadToken) {
            return;
          }
        if (meta.success && meta.data) {
          this.applyFeesDuePickerMeta(meta.data.fee_type_options || [], meta.data.fee_due_dates || []);
        }
        this.classGroups = this.buildClassGroupsFromGrades(classes.data?.grades || [], null);
        this.loadingClasses = false;
      },
      error: error => {
        if (token !== this.loadToken) {
          return;
        }
        this.errorHandler.showError(error);
        this.loadingClasses = false;
      }
    });
  }

  private applyFeesDuePickerMeta(feeTypeOptions: FeeTypeOption[], feeDueDates: string[]): void {
    this.feeTypeOptions = feeTypeOptions;
    this.feeDueDates = feeDueDates;
    const selectedType = this.selectedFeeTypeOption;
    if (selectedType && !selectedType.selectable) {
      this.selectedFeeType = '';
      this.feeFilterQuery = '';
      return;
    }
    if (selectedType) {
      this.feeFilterQuery = this.feeTypeFieldDisplay(selectedType);
    }
    if (
      this.selectedDueDateIso &&
      this.feeDueDates.length &&
      !this.feeDueDates.includes(this.selectedDueDateIso)
    ) {
      this.selectedDueDateIso = '';
      this.feeDueDateFilterQuery = '';
    }
    if (this.selectedDueDateIso) {
      this.syncFeeDueDateFilterFromSelection();
      this.eventDate = this.parseLocalDate(this.selectedDueDateIso);
    }
  }

  loadClasses(): void {
    if (this.isFeesModule && this.feeNotifyMode === 'due' && !this.feesDueEligibleReady()) {
      this.loadFeesDueScheduleShell();
      return;
    }

    const token = ++this.loadToken;
    this.loadingClasses = true;
    this.classGroups = [];
    if (this.usesEligibleTargets) {
      forkJoin({
        classes: this.campaigns.classOptions(this.branchId),
        eligible: this.campaigns.eligibleTargets(this.module, this.branchId, this.eligibilityDateParam(), {
          notify_mode: this.isExamsModule ? this.examNotifyMode : undefined,
          exam_id: this.isExamsModule && this.selectedExamId ? this.selectedExamId : undefined,
          fee_notify_mode: this.isFeesModule ? this.feeNotifyMode : undefined,
          fee_type:
            this.isFeesModule && this.feeNotifyMode === 'due' && this.selectedFeeType
              ? this.selectedFeeType
              : undefined,
          fee_structure_id:
            this.isFeesModule && this.feeNotifyMode === 'structure' && this.selectedFeeStructureId
              ? this.selectedFeeStructureId
              : undefined
        })
      }).subscribe({
        next: ({ classes, eligible }) => {
          if (token !== this.loadToken) {
            return;
          }
          if (this.isExamsModule) {
            this.examOptions = eligible.meta?.exam_options || [];
            this.examScheduleDates = eligible.meta?.exam_schedule_dates || [];
            const selected = this.selectedExamOption;
            if (selected && !selected.selectable) {
              this.selectedExamId = '';
              this.examFilterQuery = '';
              this.classGroups = [];
              this.loadingClasses = false;
              return;
            }
            if (selected) {
              this.examFilterQuery = this.examFieldDisplay(selected);
            }
          }
          if (this.isFeesModule) {
            this.feeNotifyMode = eligible.meta?.fee_notify_mode || this.feeNotifyMode;
            if (this.feeNotifyMode === 'structure') {
              this.feeStructureOptions = eligible.meta?.fee_structure_options || [];
              const selectedStructure = this.selectedFeeStructureOption;
              if (selectedStructure && !selectedStructure.selectable) {
                this.selectedFeeStructureId = '';
                this.feeStructureFilterQuery = '';
                this.classGroups = [];
                this.loadingClasses = false;
                return;
              }
              if (selectedStructure) {
                this.feeStructureFilterQuery = this.feeStructureFieldDisplay(selectedStructure);
              }
            } else {
              this.applyFeesDuePickerMeta(
                eligible.meta?.fee_type_options || [],
                eligible.meta?.fee_due_dates || []
              );
              if (!this.selectedFeeType) {
                this.classGroups = [];
                this.loadingClasses = false;
                return;
              }
            }
          }
          if (eligible.meta?.event_date && this.isTodayOnlyDate) {
            this.eventDate = this.parseLocalDate(eligible.meta.event_date);
          }
          if (this.isAssignmentsModule) {
            this.assignmentStatusKeys = [...(eligible.meta?.assignment_status_keys || [])];
          }
          this.classGroups = this.buildClassGroupsFromGrades(classes.data?.grades || [], eligible);
          this.loadingClasses = false;
        },
        error: error => {
          if (token !== this.loadToken) {
            return;
          }
          this.errorHandler.showError(error);
          this.loadingClasses = false;
        }
      });
      return;
    }

    this.campaigns.classOptions(this.branchId).subscribe({
      next: response => {
        if (token !== this.loadToken) {
          return;
        }
        const grades = response.data?.grades || [];
        this.classGroups = grades.map(grade => ({
          grade: grade.grade,
          className: grade.label || `Grade ${grade.grade}`,
          sections: (grade.sections || []).map(section => ({
            grade: grade.grade,
            section: section.section,
            student_count: section.student_count,
            enrolledCount: section.student_count,
            markedCount: section.student_count,
            tallyPresent: 0,
            tallyAbsent: 0,
            tallyLeave: 0,
            selected: false,
            selectable: true,
            attendanceMarked: true,
            notificationStatus: 'not_sent' as SectionNotificationStatus,
            examScheduleCount: 0,
            examMarksCount: 0,
            examCriteriaMet: false,
            feeUnpaidCount: 0,
            feeOverdueCount: 0,
            feeReminderCount: 0,
            feeCriteriaMet: false,
            structureApplies: false,
            structureEnrolledCount: 0
          }))
        }));
        this.loadingClasses = false;
      },
      error: error => {
        if (token !== this.loadToken) {
          return;
        }
        this.errorHandler.showError(error);
        this.loadingClasses = false;
      }
    });
  }

  selectAll(selected: boolean): void {
    this.classGroups.forEach(group => {
      group.sections.forEach(section => {
        if (!section.selectable) {
          section.selected = false;
          return;
        }
      section.selected = selected;
      });
    });
  }

  toggleClass(group: ClassGroup, selected: boolean): void {
    group.sections.forEach(section => {
      if (section.selectable) {
        section.selected = selected;
      }
    });
  }

  isClassChecked(group: ClassGroup): boolean {
    const selectable = group.sections.filter(section => section.selectable);
    return selectable.length > 0 && selectable.every(section => section.selected);
  }

  isClassIndeterminate(group: ClassGroup): boolean {
    const selectable = group.sections.filter(section => section.selectable);
    const selected = selectable.filter(section => section.selected).length;
    return selected > 0 && selected < selectable.length;
  }

  hasSelectable(group: ClassGroup): boolean {
    return group.sections.some(section => section.selectable);
  }

  selectedTargets() {
    return this.selectableSections
      .filter(section => section.selected)
      .map(section => ({ grade: section.grade, section: section.section }));
  }

  nextFromClasses(): void {
    if (!this.branchId) {
      this.errorHandler.showError('Select a branch.');
      return;
    }
    if (this.isExamsModule || this.isCustomModule) {
      // date not required
    } else if (this.isFeesModule && this.feeNotifyMode === 'structure') {
      if (!this.selectedFeeStructureId || this.selectedFeeStructureIsClosed) {
        this.errorHandler.showError('Select an active fee structure from the list.');
        return;
      }
      if (!this.structureDueDateChip) {
        this.errorHandler.showError('Selected fee structure has no due date.');
        return;
      }
    } else if (this.isFeesModule && this.feeNotifyMode === 'due') {
      if (!this.selectedDueDateIso) {
        this.errorHandler.showError('Select a due date from the list.');
        return;
      }
    } else if (!this.eventDate) {
      this.errorHandler.showError('Select a branch and a date.');
      return;
    }
    if (this.isExamsModule && (!this.selectedExamId || this.selectedExamIsClosed)) {
      this.errorHandler.showError('Select an active exam from the list.');
      return;
    }
    if (
      this.isFeesModule &&
      this.feeNotifyMode === 'due' &&
      (!this.selectedFeeType || this.selectedFeeTypeIsClosed)
    ) {
      this.errorHandler.showError('Select an active fee type from the list.');
      return;
    }
    const hasSections = this.selectedTargets().length > 0;
    const hasStaff = this.selectedStaffUserIds.length > 0;
    if (!hasSections && !hasStaff) {
      const hint = this.isExamsModule
        ? `Select at least one section with ${this.examNotifyMode === 'scheduled' ? 'exam schedules' : 'marks entered'}, or staff below.`
        : this.isFeesModule && this.feeNotifyMode === 'due'
          ? 'Select at least one section with students to remind, or staff below.'
          : this.isFeesModule
            ? 'Select at least one section or staff below.'
            : 'Select at least one class section or staff member below.';
      this.errorHandler.showError(hint);
      return;
    }
    if (this.confirmSelection) {
      this.showSelectionConfirm = true;
      return;
    }
    this.step = 2;
  }

  closeSelectionConfirm(): void {
    this.showSelectionConfirm = false;
  }

  confirmSelectionDialog(): void {
    this.showSelectionConfirm = false;
    this.step = 2;
  }

  notificationStatusLabel(status: SectionNotificationStatus): string {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'sending':
        return 'Sending…';
      case 'partial':
        return 'Partial';
      case 'failed':
        return 'Failed';
      default:
        return 'Not sent';
    }
  }

  /** Single-line tally for section rows inside grade cards. */
  attendanceTallyLabel(section: SectionChoice): string {
    if (!section.attendanceMarked) {
      return `${section.enrolledCount} enrolled, not marked`;
    }
    return `Present ${section.tallyPresent}, Absent ${section.tallyAbsent}, Leave ${section.tallyLeave}`;
  }

  attendanceTallyTitle(section: SectionChoice): string {
    if (!section.attendanceMarked) {
      return `No attendance marked (${section.enrolledCount} enrolled)`;
    }
    return `Present ${section.tallyPresent}, Absent ${section.tallyAbsent}, Leave ${section.tallyLeave} — ${section.markedCount}/${section.enrolledCount} marked`;
  }

  classMissingAttendanceCount(group: ClassGroup): number {
    return group.sections.filter(section => !section.attendanceMarked).length;
  }

  classMissingExamCriteriaCount(group: ClassGroup): number {
    return group.sections.filter(section => !section.examCriteriaMet).length;
  }

  classMissingFeeCriteriaCount(group: ClassGroup): number {
    return group.sections.filter(section => !section.feeCriteriaMet).length;
  }

  get hasFeeReminderSections(): boolean {
    if (!this.isFeesModule || this.feeNotifyMode !== 'due') {
      return false;
    }
    return this.classGroups.some(group => group.sections.some(section => section.feeReminderCount > 0));
  }

  feeTallyLabel(section: SectionChoice): string {
    if (this.feeNotifyMode === 'structure') {
      return section.structureEnrolledCount > 0
        ? `${section.structureEnrolledCount} enrolled`
        : 'No students';
    }
    if (section.feeReminderCount <= 0) {
      return 'None to remind';
    }
    const parts = [`${section.feeReminderCount} to remind`];
    if (section.feeOverdueCount > 0) {
      parts.push(`${section.feeOverdueCount} overdue`);
    }
    return parts.join(' · ');
  }

  feeTallyTitle(section: SectionChoice): string {
    if (this.feeNotifyMode === 'structure') {
      return section.structureApplies
        ? `${section.structureEnrolledCount} enrolled student(s) in this section`
        : 'Fee structure does not apply to this section';
    }
    if (section.feeReminderCount <= 0) {
      return 'No students with balance due for selected fee type and due date';
    }
    return `${section.feeReminderCount} student(s) to remind · ${section.feeOverdueCount} overdue`;
  }

  examTallyLabel(section: SectionChoice): string {
    if (this.examNotifyMode === 'scheduled') {
      const count = section.examScheduleCount;
      if (count <= 0) {
        return 'No schedule';
      }
      return count === 1 ? '1 schedule' : `${count} schedules`;
    }
    const count = section.examMarksCount;
    if (count <= 0) {
      return 'No marks entered';
    }
    return count === 1 ? '1 mark entered' : `${count} marks entered`;
  }

  examTallyTitle(section: SectionChoice): string {
    if (this.examNotifyMode === 'scheduled') {
      return section.examScheduleCount > 0
        ? `${section.examScheduleCount} exam schedule(s) for this exam`
        : 'No exam schedule for this section';
    }
    return section.examMarksCount > 0
      ? `${section.examMarksCount} student(s) with marks entered`
      : 'No exam marks entered for this section';
  }

  notificationStatusClass(status: SectionNotificationStatus): string {
    switch (status) {
      case 'sent':
        return 'notify-active';
      case 'sending':
        return 'notify-pending';
      case 'partial':
      case 'failed':
        return 'notify-warning';
      default:
        return 'notify-inactive';
    }
  }

  openPreview(): void {
    const map = this.mappedTemplates();
    const hasSections = this.selectedTargets().length > 0;
    const hasStaff = this.selectedStaffUserIds.length > 0;
    if (hasSections && Object.keys(map).length === 0) {
      this.errorHandler.showError('Map at least one status to a template.');
      return;
    }
    if (hasStaff && !this.staffTemplateId) {
      this.errorHandler.showError('Select a staff template.');
      return;
    }
    if (!hasSections && !hasStaff) {
      this.errorHandler.showError('Select recipients before preview.');
      return;
    }
    this.saving = true;
    this.campaigns
      .preview(this.buildCampaignPayload(map))
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: response => {
          this.samples = response.data || [];
          this.showPreview = true;
        },
        error: error => {
          this.errorHandler.showError(error);
          this.showPreview = false;
        }
      });
  }

  confirm(): void {
    this.saving = true;
    const expectedRecipientCount = (this.samples || []).reduce(
      (sum, row) => sum + (row.recipient_count || 0),
      0
    );
    this.campaigns
      .create({
        ...this.buildCampaignPayload(this.mappedTemplates()),
        expected_recipient_count: expectedRecipientCount
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: response => {
          this.showPreview = false;
          this.errorHandler.showSuccess('Notification scheduled');
          const id = response.data?.id;
          this.router.navigate(id ? ['/notification-campaigns/view', id] : ['/notification-campaigns'], {
            queryParams: { tab: this.module }
          });
        },
        error: error => {
          this.errorHandler.showError(error);
        }
      });
  }

  cancel(): void {
    const tab = this.isCustomModule ? 'dashboard' : this.module;
    this.router.navigate(['/notification-campaigns'], { queryParams: { tab } });
  }

  get previewScheduleLabel(): string {
    return this.isCustomModule ? 'Preview & send' : 'Preview & schedule';
  }

  private mappedTemplates(): Record<string, number> {
    const map: Record<string, number> = {};
    let keys = Object.keys(this.templateMap);
    if (this.isExamsModule) {
      keys = [this.examNotifyMode];
    } else if (this.isFeesModule && this.feeNotifyMode === 'structure') {
      keys = ['structure'];
    } else if (this.isFeesModule) {
      keys = ['due', 'overdue'];
    }
    keys.forEach(key => {
      const value = this.templateMap[key];
      if (value) {
        map[key] = value;
      }
    });
    return map;
  }

  private flattenSectionRows(filter: (section: SectionChoice, group: ClassGroup) => boolean): SectionSummaryRow[] {
    const rows: SectionSummaryRow[] = [];
    this.classGroups.forEach(group => {
      group.sections.forEach(section => {
        if (!filter(section, group)) {
          return;
        }
        rows.push({
          className: group.className,
          section: section.section,
          studentCount: section.student_count,
          reason: this.sectionExcludeReason(section)
        });
      });
    });
    return rows;
  }

  private sectionExcludeReason(section: SectionChoice): string | undefined {
    if (section.selectable) {
      return undefined;
    }
    if (this.isExamsModule) {
      if (!section.examCriteriaMet) {
        return this.examNotifyMode === 'scheduled' ? 'No exam schedule' : 'No marks entered';
      }
    } else if (this.isFeesModule) {
      if (!section.feeCriteriaMet) {
        return this.feeNotifyMode === 'due' ? 'No students to remind' : 'No enrolled students';
      }
    } else if (!section.attendanceMarked) {
      return 'Attendance not taken';
    }
    if (section.notificationStatus === 'sent') {
      return 'Already sent';
    }
    if (section.notificationStatus === 'sending') {
      return 'Send in progress';
    }
    if (section.notificationStatus === 'partial') {
      return 'Partially sent';
    }
    return 'Not available';
  }

  /** Attendance schedule: only today is allowed (Material datepicker guard for non-attendance today_only modules). */
  eventDateFilter = (date: Date | null): boolean => {
    if (!date || !this.isTodayOnlyDate) {
      return true;
    }
    const today = this.startOfDay(new Date());
    const d = this.startOfDay(date);
    return d.getTime() === today.getTime();
  };

  private normalizeAttendanceMap(
    raw: Record<
      string,
      {
        enrolled_count?: number;
        marked_count?: number;
        present?: number;
        absent?: number;
        leave?: number;
      }
    >
  ): Record<
    string,
    {
      enrolled_count: number;
      marked_count: number;
      present: number;
      absent: number;
      leave: number;
    }
  > {
    const out: Record<
      string,
      {
        enrolled_count: number;
        marked_count: number;
        present: number;
        absent: number;
        leave: number;
      }
    > = {};
    Object.entries(raw || {}).forEach(([key, value]) => {
      const parts = key.split('|');
      if (parts.length !== 2) {
        return;
      }
      const normalized = this.sectionKey(parts[0], parts[1]);
      out[normalized] = {
        enrolled_count: value.enrolled_count ?? 0,
        marked_count: value.marked_count ?? 0,
        present: value.present ?? 0,
        absent: value.absent ?? 0,
        leave: value.leave ?? 0
      };
    });
    return out;
  }

  private examSectionVisible(section: SectionChoice): boolean {
    if (!this.isExamsModule || !this.selectedExamId) {
      return !this.isExamsModule;
    }
    return this.examNotifyMode === 'scheduled'
      ? section.examScheduleCount > 0
      : section.examMarksCount > 0;
  }

  private feeSectionVisible(_section: SectionChoice): boolean {
    if (!this.isFeesModule) {
      return true;
    }
    // List all branch classes; feeCriteriaMet controls which checkboxes are enabled.
    return true;
  }

  private buildClassGroupsFromGrades(
    grades: {
      grade: string;
      label?: string;
      sections?: { section: string; student_count?: number }[];
    }[],
    eligible: EligibleTargetsResponse | null
  ): ClassGroup[] {
    const deliveryBySection = this.normalizeDeliveryMap(eligible?.meta?.delivery_by_section || {});
    const attendanceBySection = this.normalizeAttendanceMap(eligible?.meta?.attendance_by_section || {});
    const examBySection = this.normalizeExamMap(eligible?.meta?.exam_by_section || {});
    const feeBySection = this.normalizeFeeMap(eligible?.meta?.fee_by_section || {});
    const eligibleByKey = new Map<
      string,
      { student_count: number; notification_status: SectionNotificationStatus }
    >();
    (eligible?.data || []).forEach(row => {
      const key = this.sectionKey(row.grade, row.section);
      eligibleByKey.set(key, {
        student_count: row.student_count,
        notification_status: row.notification_status || 'not_sent'
      });
    });

    return grades
      .map(grade => ({
        grade: grade.grade,
        className: grade.label || `Grade ${grade.grade}`,
        sections: (grade.sections || []).map(section => {
          const key = this.sectionKey(grade.grade, section.section);
          const info = this.lookupEligibleSection(grade.grade, section.section, eligibleByKey);
          const delivery = deliveryBySection[key];
          const attendance = attendanceBySection[key];
          const exam = examBySection[key];
          const enrolledCount = attendance?.enrolled_count ?? section.student_count ?? 0;
          const markedCount = attendance?.marked_count ?? info?.student_count ?? 0;
          const attendanceMarked = markedCount > 0;
          const examScheduleCount = exam?.schedule_count ?? 0;
          const examMarksCount = exam?.marks_count ?? 0;
          const examCriteriaMet =
            this.examNotifyMode === 'scheduled' ? examScheduleCount > 0 : examMarksCount > 0;
          const feeSummary = feeBySection[key];
          const feeUnpaidCount = feeSummary?.unpaid_count ?? 0;
          const feeOverdueCount = feeSummary?.overdue_count ?? 0;
          const matchedFromApi = info?.student_count ?? 0;
          const feeReminderCount =
            this.isFeesModule && this.feeNotifyMode === 'due'
              ? Math.max(matchedFromApi, feeUnpaidCount)
              : 0;
          const structureEnrolledCount = feeSummary?.enrolled_count ?? 0;
          const structureApplies = feeSummary?.structure_applies ?? false;
          let feeCriteriaMet = false;
          if (this.isFeesModule && this.feeNotifyMode === 'due') {
            feeCriteriaMet = feeReminderCount > 0;
          } else if (this.isFeesModule && this.feeNotifyMode === 'structure') {
            feeCriteriaMet = structureApplies && structureEnrolledCount > 0;
          }
          const notificationStatus: SectionNotificationStatus =
            info?.notification_status || delivery?.notification_status || 'not_sent';
          const blocked =
            notificationStatus === 'sent' ||
            notificationStatus === 'sending' ||
            notificationStatus === 'partial';
          let selectable = !blocked;
          if (this.isAttendanceModule) {
            selectable = attendanceMarked && !blocked;
          } else if (this.isExamsModule) {
            selectable = examCriteriaMet && !blocked;
          } else if (this.isFeesModule) {
            selectable = feeCriteriaMet && !blocked;
          } else if (this.isCustomModule) {
            selectable = (info?.student_count ?? enrolledCount) > 0 && !blocked;
          } else if (this.usesEligibleTargets) {
            selectable = !!info && !blocked;
          }
          const displayStudentCount =
            this.isFeesModule && this.feeNotifyMode === 'due' && feeReminderCount > 0
              ? feeReminderCount
              : enrolledCount;
          return {
            grade: grade.grade,
            section: section.section,
            student_count: displayStudentCount,
            enrolledCount,
            markedCount,
            tallyPresent: attendance?.present ?? 0,
            tallyAbsent: attendance?.absent ?? 0,
            tallyLeave: attendance?.leave ?? 0,
            selected: false,
            selectable,
            attendanceMarked,
            notificationStatus,
            examScheduleCount,
            examMarksCount,
            examCriteriaMet,
            feeUnpaidCount,
            feeOverdueCount,
            feeReminderCount,
            feeCriteriaMet,
            structureApplies,
            structureEnrolledCount
          };
        })
          .filter(section => this.examSectionVisible(section) && this.feeSectionVisible(section))
      }))
      .filter(group => group.sections.length > 0);
  }

  private normalizeFeeMap(
    raw: Record<
      string,
      {
        unpaid_count?: number;
        overdue_count?: number;
        matched_student_count?: number;
        enrolled_count?: number;
        structure_applies?: boolean;
      }
    >
  ): Record<
    string,
    {
      unpaid_count: number;
      overdue_count: number;
      matched_student_count: number;
      enrolled_count: number;
      structure_applies: boolean;
    }
  > {
    const out: Record<
      string,
      {
        unpaid_count: number;
        overdue_count: number;
        matched_student_count: number;
        enrolled_count: number;
        structure_applies: boolean;
      }
    > = {};
    Object.entries(raw || {}).forEach(([key, value]) => {
      const parts = key.split('|');
      if (parts.length !== 2) {
        return;
      }
      const normalized = this.sectionKey(parts[0], parts[1]);
      const unpaid = value.unpaid_count ?? 0;
      out[normalized] = {
        unpaid_count: unpaid,
        overdue_count: value.overdue_count ?? 0,
        matched_student_count: value.matched_student_count ?? unpaid,
        enrolled_count: value.enrolled_count ?? 0,
        structure_applies: value.structure_applies ?? false
      };
    });
    return out;
  }

  private normalizeExamMap(
    raw: Record<
      string,
      {
        schedule_count?: number;
        marks_count?: number;
        student_count?: number;
      }
    >
  ): Record<string, { schedule_count: number; marks_count: number; student_count: number }> {
    const out: Record<string, { schedule_count: number; marks_count: number; student_count: number }> = {};
    Object.entries(raw || {}).forEach(([key, value]) => {
      const parts = key.split('|');
      if (parts.length !== 2) {
        return;
      }
      const normalized = this.sectionKey(parts[0], parts[1]);
      out[normalized] = {
        schedule_count: value.schedule_count ?? 0,
        marks_count: value.marks_count ?? 0,
        student_count: value.student_count ?? 0
      };
    });
    return out;
  }

  private normalizeDeliveryMap(
    raw: Record<string, { notification_status?: SectionNotificationStatus; campaign_id?: number; sent_count?: number }>
  ): Record<string, { notification_status: SectionNotificationStatus; campaign_id?: number; sent_count?: number }> {
    const out: Record<string, { notification_status: SectionNotificationStatus; campaign_id?: number; sent_count?: number }> = {};
    Object.entries(raw || {}).forEach(([key, value]) => {
      const parts = key.split('|');
      if (parts.length !== 2) {
        return;
      }
      const normalized = this.sectionKey(parts[0], parts[1]);
      out[normalized] = {
        notification_status: value.notification_status || 'not_sent',
        campaign_id: value.campaign_id,
        sent_count: value.sent_count
      };
    });
    return out;
  }

  private clampEventDateToPolicy(): void {
    if (!this.isTodayOnlyDate) {
      return;
    }
    this.eventDate = this.startOfDay(new Date());
  }

  private effectiveDateString(): string {
    if (this.isTodayOnlyDate) {
      return this.formatDateYmd(new Date());
    }
    return this.dateString();
  }

  private eligibilityDateParam(): string | undefined {
    if (this.isExamsModule || this.isCustomModule) {
      return undefined;
    }
    if (this.isFeesModule && this.feeNotifyMode === 'structure') {
      return this.structureDueDateChip || undefined;
    }
    if (this.isFeesModule && this.feeNotifyMode === 'due') {
      return this.selectedDueDateIso || undefined;
    }
    return this.effectiveDateString();
  }

  private campaignEventDateString(): string {
    if (this.isFeesModule && this.feeNotifyMode === 'structure') {
      return this.structureDueDateChip || this.effectiveDateString();
    }
    return this.effectiveDateString();
  }

  private buildCampaignPayload(templateMap: Record<string, number>): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      module: this.module,
      branch_id: this.branchId,
      targets: this.selectedTargets(),
      template_map: templateMap
    };
    if (!this.isExamsModule && !this.isCustomModule) {
      payload['event_date'] = this.campaignEventDateString();
    }
    if (this.selectedStaffUserIds.length > 0) {
      payload['staff_user_ids'] = [...this.selectedStaffUserIds];
      if (this.staffTemplateId) {
        payload['staff_template_id'] = this.staffTemplateId;
      }
    }
    if (this.isExamsModule && this.selectedExamId) {
      payload['exam_id'] = this.selectedExamId;
    }
    if (this.isFeesModule) {
      payload['fee_notify_mode'] = this.feeNotifyMode;
      if (this.feeNotifyMode === 'due' && this.selectedFeeType) {
        payload['fee_type'] = this.selectedFeeType;
      }
      if (this.feeNotifyMode === 'structure' && this.selectedFeeStructureId) {
        payload['fee_structure_id'] = this.selectedFeeStructureId;
      }
    }
    return payload;
  }

  private sectionKey(grade: string, section: string): string {
    return `${String(grade).trim()}|${String(section).trim()}`;
  }

  private normalizeGradeKey(grade: string): string {
    const g = String(grade ?? '').trim();
    const prefixed = g.match(/^grade\s*(.+)$/i);
    return prefixed ? prefixed[1].trim() : g;
  }

  private lookupEligibleSection(
    grade: string,
    section: string,
    eligibleByKey: Map<string, { student_count: number; notification_status: SectionNotificationStatus }>
  ): { student_count: number; notification_status: SectionNotificationStatus } | undefined {
    const sectionName = String(section).trim();
    const candidates = [
      this.sectionKey(grade, sectionName),
      this.sectionKey(this.normalizeGradeKey(grade), sectionName)
    ];
    for (const key of candidates) {
      const hit = eligibleByKey.get(key);
      if (hit) {
        return hit;
      }
    }
    const wantGrade = this.normalizeGradeKey(grade);
    for (const [key, value] of eligibleByKey.entries()) {
      const [g, s] = key.split('|');
      if (s === sectionName && this.normalizeGradeKey(g) === wantGrade) {
        return value;
      }
    }
    return undefined;
  }

  private parseLocalDate(isoDate: string): Date {
    const [y, m, d] = isoDate.split('-').map(part => parseInt(part, 10));
    return new Date(y, m - 1, d);
  }

  private formatDateYmd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private dateString(): string {
    return this.formatDateYmd(this.eventDate);
  }
}
