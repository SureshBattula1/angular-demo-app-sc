import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { BranchService } from '../../../branches/services/branch.service';
import { BranchService as BranchAccessService } from '../../../../core/services/branch.service';
import { canShowBranchSelector, resolveDefaultBranchId } from '../../../../core/utils/branch-selection.util';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import {
  SmsTemplatesManageDialogComponent
} from '../../../bulk-management/pages/sms-templates-manage-dialog/sms-templates-manage-dialog.component';
import { Branch } from '../../../../core/models/branch.model';
import { StaffGroupPickerComponent } from '../../components/staff-group-picker/staff-group-picker.component';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { FileUploadResponse } from '../../../../core/services/file-upload.service';
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
  /** Teacher attendance grid: branch user id. */
  userId?: number;
  personName?: string;
  personSubtitle?: string;
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
  assignmentCount?: number;
  assignmentSubjectNames?: string;
  assignmentHasNew?: boolean;
}

interface ClassGroup {
  grade: string;
  className: string;
  sections: SectionChoice[];
}

interface EligibleSectionInfo {
  student_count: number;
  notification_status: SectionNotificationStatus;
  assignment_count?: number;
  subject_names?: string;
  assignment_has_new?: boolean;
}

interface SectionSummaryRow {
  className: string;
  section: string;
  studentCount: number;
  reason?: string;
}

export type AttendanceAudienceTab = 'student' | 'teacher';

@Component({
  selector: 'app-campaign-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, StaffGroupPickerComponent, FileUploadComponent],
  templateUrl: './campaign-schedule.component.html',
  styleUrls: ['./campaign-schedule.component.scss']
})
export class CampaignScheduleComponent implements OnInit, OnDestroy {
  module = 'attendance';
  /** Attendance schedule only: student vs teacher attendance notifications. */
  attendanceAudienceTab: AttendanceAudienceTab = 'student';
  step = 1;
  saving = false;
  loadingClasses = false;
  moduleMeta: CampaignModuleMeta | null = null;
  branches: { id: string | number; name: string }[] = [];
  branchId = '';
  canSelectBranch = false;
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
  /** Custom campaigns: uploaded files linked to inbox notifications after send. */
  customAttachments: {
    file_path: string;
    file_name: string;
    original_name: string;
    file_type?: string;
    file_size?: number;
  }[] = [];
  readonly customAttachmentUploadConfig = {
    multiple: true,
    maxFiles: 15,
    maxSize: 15,
    showPreview: true,
    showProgress: true,
    showFileList: true
  };
  loadingStaff = false;
  selectedStaffUserIds: number[] = [];
  staffTemplateId: number | null = null;
  /** Teacher attendance tab: teachers, admins, staff, accounts (with search per card). */
  selectedTeacherAttendanceUserIds: number[] = [];
  /** Per role-group search on teacher attendance class cards. */
  teacherGroupSearch: Record<string, string> = {};

  private loadToken = 0;
  private staffLoadToken = 0;
  private scheduleNavReloadBound = false;
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private branchService: BranchService,
    private branchAccess: BranchAccessService,
    private campaigns: NotificationCampaignService,
    private errorHandler: ErrorHandlerService
  ) {}

  get showBranchSelector(): boolean {
    return this.canSelectBranch;
  }

  ngOnInit(): void {
    this.module = this.route.snapshot.paramMap.get('module') || 'attendance';
    this.clampEventDateToPolicy();
    this.branchService.getBranches().subscribe({
      next: response => {
        this.branches = (response.data || []).map((branch: { id: string | number; name: string }) => ({
          id: branch.id,
          name: branch.name
        }));
        this.canSelectBranch = canShowBranchSelector({
          can_select_branch: response.can_select_branch ?? this.branchAccess.canSelectBranch(),
          user_branch_id: response.user_branch_id ?? this.branchAccess.getUserBranchId()
        });
        this.applyDefaultBranchSelection(false);
      },
      error: error => this.errorHandler.showError(error)
    });
    this.route.paramMap.subscribe(params => {
      this.module = params.get('module') || 'attendance';
      this.clampEventDateToPolicy();
      if (this.branchId) {
        this.loadClasses();
        this.reloadBranchTemplates();
      }
    });
    this.applyModuleStatusesFromApi();
    this.bindScheduleNavigationReload();
  }

  ngOnDestroy(): void {
    this.scheduleNavReloadBound = false;
  }

  private bindScheduleNavigationReload(): void {
    if (this.scheduleNavReloadBound) {
      return;
    }
    this.scheduleNavReloadBound = true;
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.url;
      if (!url.includes('/notification-campaigns/schedule/')) {
        return;
      }
      if (!this.branchId) {
        return;
      }
      if (this.isTeacherAttendanceTab) {
        this.loadStaffOptions();
      } else {
        this.loadClasses();
      }
    });
  }

  get effectiveCampaignModule(): string {
    if (this.module === 'attendance' && this.attendanceAudienceTab === 'teacher') {
      return 'teacher_attendance';
    }
    return this.module;
  }

  get isAttendanceModule(): boolean {
    return this.module === 'attendance';
  }

  get isStudentAttendanceTab(): boolean {
    return this.isAttendanceModule && this.attendanceAudienceTab === 'student';
  }

  get isTeacherAttendanceTab(): boolean {
    return this.isAttendanceModule && this.attendanceAudienceTab === 'teacher';
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

  get customAttachmentUploadPath(): string {
    const bid = this.branchId || 'branch';
    return `notification-campaigns/custom/${bid}`;
  }

  get customSelectedSectionCount(): number {
    return this.selectableSections.filter(section => section.selected).length;
  }

  get customSelectedStudentCount(): number {
    return this.selectableSections
      .filter(section => section.selected)
      .reduce((sum, section) => sum + (section.student_count || 0), 0);
  }

  get customSelectedStaffCount(): number {
    return this.selectedStaffUserIds.length;
  }

  get customRecipientTotal(): number {
    return this.customSelectedStudentCount + this.customSelectedStaffCount;
  }

  get hasSelectableSectionsForDate(): boolean {
    return this.classGroups.some(group => group.sections.some(section => section.selectable));
  }

  /** Human labels for assignment_status_keys on the selected date. */
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
    if (this.moduleMeta?.requires_event_date != null) {
      return this.moduleMeta.requires_event_date;
    }
    return (
      this.module === 'attendance' ||
      this.isHolidaysModule ||
      this.isAssignmentsModule
    );
  }

  get usesEligibleTargets(): boolean {
    return (
      this.isStudentAttendanceTab ||
      this.isExamsModule ||
      this.isFeesModule ||
      this.isCustomModule ||
      this.isHolidaysModule ||
      this.isAssignmentsModule ||
      (this.moduleMeta?.requires_event_date ?? false)
    );
  }

  onAttendanceAudienceTabChange(): void {
    this.step = 1;
    this.showPreview = false;
    this.showSelectionConfirm = false;
    this.classGroups = [];
    this.selectedStaffUserIds = [];
    this.staffTemplateId = null;
    this.customAttachments = [];
    this.selectedTeacherAttendanceUserIds = [];
    this.applyModuleStatusesFromApi();
    if (this.branchId) {
      this.reloadBranchTemplates();
      if (this.isTeacherAttendanceTab) {
        this.loadStaffOptions();
      } else {
        this.loadClasses();
        this.loadStaffOptions();
      }
    }
  }

  private applyModuleStatusesFromApi(): void {
    this.campaigns.modules().subscribe({
      next: response => {
        const mod = this.effectiveCampaignModule;
        this.statuses = response.data?.[mod] || [];
        this.moduleMeta = response.meta?.[mod] || null;
        this.templateMap = {};
        this.statuses.forEach(status => {
          this.templateMap[status.key] = null;
        });
        this.clampEventDateToPolicy();
        if (this.branchId) {
          if (this.isTeacherAttendanceTab) {
            this.loadStaffOptions();
          } else {
            this.loadClasses();
          }
        }
      }
    });
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
    this.customAttachments = [];
    this.selectedTeacherAttendanceUserIds = [];
    this.staffGroups = [];
    if (!this.branchId) {
      return;
    }
    if (this.isTeacherAttendanceTab) {
      this.loadStaffOptions();
    } else {
      this.loadClasses();
      this.loadStaffOptions();
    }
    this.reloadBranchTemplates();
  }

  loadStaffOptions(): void {
    if (!this.branchId) {
      this.staffGroups = [];
      this.classGroups = [];
      return;
    }
    const date =
      this.isTeacherAttendanceTab || this.showEventDatePicker
        ? this.effectiveDateString()
        : undefined;
    const staffModule = this.isTeacherAttendanceTab ? 'teacher_attendance' : this.effectiveCampaignModule;
    const token = ++this.staffLoadToken;
    this.loadingStaff = true;
    if (this.isTeacherAttendanceTab) {
      this.loadingClasses = true;
      this.classGroups = [];
    }
    this.campaigns.staffRecipientOptions(this.branchId, date, staffModule).subscribe({
      next: response => {
        if (token !== this.staffLoadToken) {
          return;
        }
        this.loadingStaff = false;
        this.staffGroups = response.data?.groups ?? [];
        if (this.isTeacherAttendanceTab) {
          if (response.meta?.event_date && this.isTodayOnlyDate) {
            this.eventDate = this.parseLocalDate(response.meta.event_date);
          }
          this.classGroups = this.buildTeacherClassGroupsFromStaff(
            this.staffGroups,
            this.normalizeDeliveryByUser(response.meta?.delivery_by_user ?? {})
          );
          this.clearSelectionForNonSelectableSections();
          this.syncTeacherIdsFromGrid();
          this.loadingClasses = false;
        }
      },
      error: error => {
        if (token !== this.staffLoadToken) {
          return;
        }
        this.loadingStaff = false;
        this.loadingClasses = false;
        this.errorHandler.showError(error);
        this.staffGroups = [];
        if (this.isTeacherAttendanceTab) {
          this.classGroups = [];
        }
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

  selectedIdsForTeacherAttendanceGroup(groupKey: string): number[] {
    const people = this.staffGroups.find(g => g.key === groupKey)?.people ?? [];
    const allowed = new Set(people.map(p => p.user_id));
    return this.selectedTeacherAttendanceUserIds.filter(id => allowed.has(id));
  }

  onTeacherAttendanceGroupSelectionChange(groupKey: string, ids: number[]): void {
    const people = this.staffGroups.find(g => g.key === groupKey)?.people ?? [];
    const allowed = new Set(people.map(p => p.user_id));
    const kept = this.selectedTeacherAttendanceUserIds.filter(id => !allowed.has(id));
    this.selectedTeacherAttendanceUserIds = [...kept, ...ids];
    this.applyTeacherSelectionToGrid();
  }

  teacherGroupSearchQuery(groupKey: string): string {
    return this.teacherGroupSearch[groupKey] ?? '';
  }

  setTeacherGroupSearch(groupKey: string, value: string): void {
    this.teacherGroupSearch[groupKey] = value ?? '';
  }

  filteredSectionsForGroup(group: ClassGroup): SectionChoice[] {
    if (this.isAssignmentsModule) {
      return group.sections.filter(section => (section.assignmentCount ?? 0) > 0);
    }
    if (!this.isTeacherAttendanceTab) {
      return group.sections;
    }
    const q = (this.teacherGroupSearch[group.grade] ?? '').trim().toLowerCase();
    if (!q) {
      return group.sections;
    }
    return group.sections.filter(section => {
      const name = (section.personName ?? '').toLowerCase();
      const sub = (section.personSubtitle ?? '').toLowerCase();
      return name.includes(q) || sub.includes(q) || String(section.userId ?? '').includes(q);
    });
  }

  rowPrimaryLabel(section: SectionChoice): string {
    if (this.isTeacherAttendanceTab && section.personName) {
      return section.personName;
    }
    return this.sectionDisplayLabel(section.section);
  }

  rowSecondaryHint(section: SectionChoice): string | null {
    if (this.isAssignmentsModule && section.assignmentSubjectNames) {
      return section.assignmentSubjectNames;
    }
    if (!this.isTeacherAttendanceTab || !section.personSubtitle) {
      return null;
    }
    return section.personSubtitle;
  }

  teacherAttendanceStatusLabel(section: SectionChoice): string {
    return section.attendanceMarked ? 'Marked' : 'Not created';
  }

  onTeacherSectionSelectedChange(): void {
    this.syncTeacherIdsFromGrid();
  }

  onCustomAttachmentUploaded(data: FileUploadResponse['data'] | undefined): void {
    if (!data?.file_path) {
      return;
    }
    const exists = this.customAttachments.some(item => item.file_path === data.file_path);
    if (exists) {
      return;
    }
    this.customAttachments.push({
      file_path: data.file_path,
      file_name: data.file_name,
      original_name: data.file_name,
      file_type: data.file_type,
      file_size: data.file_size
    });
  }

  removeCustomAttachment(index: number): void {
    this.customAttachments.splice(index, 1);
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
    this.campaigns.templates(this.branchId, this.effectiveCampaignModule).subscribe({
      next: response => {
        this.templates = response.data || [];
        this.pruneTemplateSelections();
      },
      error: error => this.errorHandler.showError(error)
    });
  }

  /** Auto-select branch for teachers/admins; SuperAdmin keeps the dropdown. */
  private applyDefaultBranchSelection(triggerChange: boolean): void {
    const next = resolveDefaultBranchId(
      {
        can_select_branch: this.canSelectBranch,
        user_branch_id: this.branchAccess.getUserBranchId()
      },
      this.branches,
      this.branchId
    );
    if (!next || next === this.branchId) {
      return;
    }
    this.branchId = next;
    if (triggerChange) {
      this.onBranchChange();
    } else {
      this.reloadBranchTemplates();
      this.loadClasses();
      this.loadStaffOptions();
    }
  }

  private pruneTemplateSelections(): void {
    const allowed = new Set(this.templates.map(t => t.id));
    Object.keys(this.templateMap).forEach(key => {
      const id = this.templateMap[key];
      if (id && !allowed.has(id)) {
        this.templateMap[key] = null;
      }
    });
    if (this.staffTemplateId && !allowed.has(this.staffTemplateId)) {
      this.staffTemplateId = null;
    }
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
          branches: this.branches as Branch[],
          campaignModule: this.effectiveCampaignModule
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
      if (this.isTeacherAttendanceTab && this.branchId) {
        this.loadStaffOptions();
      }
      return;
    }
    if (picked instanceof Date && !Number.isNaN(picked.getTime())) {
      this.eventDate = this.startOfDay(picked);
    }
    this.resetClassSelectionForDateReload();
    if (this.isTeacherAttendanceTab && this.branchId) {
      this.loadStaffOptions();
      return;
    }
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
        const blocked = this.notificationBlocksResend(section.notificationStatus);
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

    if (this.isTeacherAttendanceTab) {
      this.classGroups = [];
      this.loadingClasses = false;
      return;
    }

    const token = ++this.loadToken;
    this.loadingClasses = true;
    this.classGroups = [];
    const campaignModule = this.effectiveCampaignModule;

    if (this.usesEligibleTargets) {
      const eligibilityDate = this.eligibilityDateParam();
      const scheduleFilterOptions = {
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
      };
      const eligibleRequest = this.campaigns.eligibleTargets(
        campaignModule,
        this.branchId,
        eligibilityDate,
        scheduleFilterOptions
      );
      const markedRequest =
        this.isStudentAttendanceTab && eligibilityDate
          ? this.campaigns.markedAttendance(this.branchId, eligibilityDate)
          : null;
      const needsDeliveryBoost =
        this.isHolidaysModule || this.isCustomModule || this.isExamsModule || this.isFeesModule;
      const deliveryBoostRequest = needsDeliveryBoost
        ? this.campaigns.sectionDeliveryStatus(
            campaignModule,
            this.branchId,
            eligibilityDate,
            scheduleFilterOptions
          )
        : null;

      forkJoin({
        classes: this.campaigns.classOptions(this.branchId),
        eligible: eligibleRequest,
        ...(markedRequest ? { marked: markedRequest } : {}),
        ...(deliveryBoostRequest ? { deliveryBoost: deliveryBoostRequest } : {})
      }).subscribe({
        next: (result: {
          classes: {
            data?: {
              grades?: {
                grade: string;
                label?: string;
                sections?: { section: string; student_count?: number }[];
              }[];
            };
          };
          eligible: EligibleTargetsResponse;
          marked?: EligibleTargetsResponse;
          deliveryBoost?: EligibleTargetsResponse;
        }) => {
          const { classes, eligible } = result;
          const marked = result.marked;
          const deliveryBoost = result.deliveryBoost;
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
          this.classGroups = this.buildClassGroupsFromGrades(
            classes.data?.grades || [],
            eligible,
            marked ?? null,
            deliveryBoost ?? null
          );
          this.clearSelectionForNonSelectableSections();
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

    // Never fall back to class-options-only for modules that need delivery/eligibility from the API.
    if (
      this.isHolidaysModule ||
      this.isAssignmentsModule ||
      this.isExamsModule ||
      this.isFeesModule ||
      this.isCustomModule ||
      this.isStudentAttendanceTab
    ) {
      this.loadingClasses = false;
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
    this.syncTeacherIdsFromGrid();
  }

  toggleClass(group: ClassGroup, selected: boolean): void {
    group.sections.forEach(section => {
      if (section.selectable) {
        section.selected = selected;
      }
    });
    this.syncTeacherIdsFromGrid();
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
    if (this.isTeacherAttendanceTab) {
      this.syncTeacherIdsFromGrid();
      if (this.selectedTeacherAttendanceUserIds.length === 0) {
        this.errorHandler.showError('Select at least one person with attendance created to notify.');
        return;
      }
    } else {
      const hasSections = this.selectedTargets().length > 0;
      const hasStaff = this.selectedStaffUserIds.length > 0;
      if (!hasSections && !hasStaff) {
        const hint = this.isCustomModule
          ? 'Select at least one student section or branch team group (teachers, admins, staff, accounts).'
          : this.isExamsModule
            ? `Select at least one section with ${this.examNotifyMode === 'scheduled' ? 'exam schedules' : 'marks entered'}, or staff below.`
            : this.isFeesModule && this.feeNotifyMode === 'due'
              ? 'Select at least one section with students to remind, or staff below.'
              : this.isFeesModule
                ? 'Select at least one section or staff below.'
                : 'Select at least one class section or staff member below.';
        this.errorHandler.showError(hint);
        return;
      }
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

  backFromLaterStep(): void {
    this.step = 1;
    if (this.isAssignmentsModule && this.branchId) {
      this.loadClasses();
    }
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
    if (this.isTeacherAttendanceTab) {
      if (!section.attendanceMarked) {
        return 'No attendance record';
      }
      return `Present ${section.tallyPresent}, Absent ${section.tallyAbsent}, Leave ${section.tallyLeave}`;
    }
    if (!section.attendanceMarked) {
      return `${section.enrolledCount} enrolled, not marked`;
    }
    return `Present ${section.tallyPresent}, Absent ${section.tallyAbsent}, Leave ${section.tallyLeave}`;
  }

  attendanceTallyTitle(section: SectionChoice): string {
    if (this.isTeacherAttendanceTab) {
      if (!section.attendanceMarked) {
        return 'No teacher attendance record for this date';
      }
      return `Present ${section.tallyPresent}, Absent ${section.tallyAbsent}, Leave ${section.tallyLeave}`;
    }
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

  notificationBlocksResend(status: SectionNotificationStatus): boolean {
    return status === 'sent' || status === 'sending' || status === 'partial';
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
    if (this.isTeacherAttendanceTab) {
      this.syncTeacherIdsFromGrid();
      if (this.selectedTeacherAttendanceUserIds.length === 0) {
        this.errorHandler.showError('Select recipients before preview.');
        return;
      }
      if (Object.keys(map).length === 0) {
        this.errorHandler.showError('Map at least one status to a template.');
        return;
      }
    } else {
      const hasSections = this.selectedTargets().length > 0;
      const hasStaff = this.selectedStaffUserIds.length > 0;
      if (hasSections && Object.keys(map).length === 0) {
        this.errorHandler.showError('Map at least one status to a template.');
        return;
      }
      if (hasStaff && !this.staffTemplateId && !this.isCustomModule) {
        this.errorHandler.showError('Select a staff template.');
        return;
      }
      if (!hasSections && !hasStaff) {
        this.errorHandler.showError('Select recipients before preview.');
        return;
      }
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
    this.router.navigate(['/notification-campaigns'], { queryParams: { tab: this.module } });
  }

  get previewScheduleLabel(): string {
    return this.isCustomModule ? 'Preview & send' : 'Preview & schedule';
  }

  private mappedTemplates(): Record<string, number> {
    const map: Record<string, number> = {};
    let keys = Object.keys(this.templateMap);
    if (this.isExamsModule) {
      keys = [this.examNotifyMode];
    } else if (this.isAssignmentsModule) {
      keys =
        this.assignmentStatusKeys.length > 0
          ? this.assignmentStatusKeys
          : this.statuses.map(status => status.key);
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
          section:
            this.isTeacherAttendanceTab && section.personName ? section.personName : section.section,
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
      return this.isTeacherAttendanceTab ? 'Attendance not created' : 'Attendance not taken';
    }
    if (this.notificationBlocksResend(section.notificationStatus)) {
      if (this.isAssignmentsModule && section.notificationStatus === 'sent') {
        return 'Already sent for this publish date';
      }
      if (section.notificationStatus === 'sent') {
        return 'Already sent';
      }
      if (section.notificationStatus === 'sending') {
        return 'Send in progress';
      }
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
    eligible: EligibleTargetsResponse | null,
    ...deliveryBoosts: (EligibleTargetsResponse | null)[]
  ): ClassGroup[] {
    const skipDeliveryBoost = this.isAssignmentsModule;
    const boostMaps = skipDeliveryBoost
      ? []
      : deliveryBoosts.flatMap(boost => [
          this.coerceDeliveryRecord(boost?.meta?.delivery_by_section),
          this.deliveryMapFromEligibleRows(boost?.data || [])
        ]);
    const deliveryBySection = this.mergeDeliveryMaps(
      this.coerceDeliveryRecord(eligible?.meta?.delivery_by_section),
      ...boostMaps,
      this.deliveryMapFromEligibleRows(eligible?.data || [])
    );
    const markedAttendanceBoost = deliveryBoosts.find(boost => boost?.meta?.attendance_by_section);
    const attendanceBySection = this.normalizeAttendanceMap({
      ...(markedAttendanceBoost?.meta?.attendance_by_section || {}),
      ...(eligible?.meta?.attendance_by_section || {})
    });
    const examBySection = this.normalizeExamMap(eligible?.meta?.exam_by_section || {});
    const feeBySection = this.normalizeFeeMap(eligible?.meta?.fee_by_section || {});
    const assignmentBySection = this.normalizeAssignmentMap(eligible?.meta?.assignment_by_section || {});
    const eligibleByKey = new Map<string, EligibleSectionInfo>();
    const registerEligibleRow = (row: {
      grade: string;
      section: string;
      student_count: number;
      notification_status?: SectionNotificationStatus;
      assignment_count?: number;
      subject_names?: string;
      assignment_has_new?: boolean;
    }) => {
      const payload = {
        student_count: row.student_count,
        notification_status: row.notification_status || ('not_sent' as SectionNotificationStatus),
        assignment_count: row.assignment_count,
        subject_names: row.subject_names,
        assignment_has_new: row.assignment_has_new
      };
      this.sectionKeyVariants(row.grade, row.section).forEach(key => eligibleByKey.set(key, payload));
    };
    (eligible?.data || []).forEach(registerEligibleRow);
    if (!skipDeliveryBoost) {
      deliveryBoosts.forEach(boost => (boost?.data || []).forEach(registerEligibleRow));
    }

    return grades
      .map(grade => ({
        grade: grade.grade,
        className: grade.label || `Grade ${grade.grade}`,
        sections: (grade.sections || []).map(section => {
          const info = this.lookupEligibleSection(grade.grade, section.section, eligibleByKey);
          const delivery = this.lookupSectionInRecordMap(grade.grade, section.section, deliveryBySection);
          const attendance = this.lookupSectionInRecordMap(grade.grade, section.section, attendanceBySection);
          const exam = this.lookupSectionInRecordMap(grade.grade, section.section, examBySection);
          const enrolledCount = attendance?.enrolled_count ?? section.student_count ?? 0;
          const markedCount = attendance?.marked_count ?? info?.student_count ?? 0;
          const attendanceMarked = markedCount > 0;
          const examScheduleCount = exam?.schedule_count ?? 0;
          const examMarksCount = exam?.marks_count ?? 0;
          const examCriteriaMet =
            this.examNotifyMode === 'scheduled' ? examScheduleCount > 0 : examMarksCount > 0;
          const feeSummary = this.lookupSectionInRecordMap(grade.grade, section.section, feeBySection);
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
          const assignmentSummary = this.lookupSectionInRecordMap(
            grade.grade,
            section.section,
            assignmentBySection
          );
          const assignmentCount =
            info?.assignment_count ?? assignmentSummary?.assignment_count ?? 0;
          const assignmentSubjectNames =
            info?.subject_names ?? assignmentSummary?.subject_names ?? '';
          const assignmentHasNew = info?.assignment_has_new ?? assignmentSummary?.has_new ?? false;
          const notificationStatus: SectionNotificationStatus =
            delivery?.notification_status || info?.notification_status || 'not_sent';
          const blocked = this.notificationBlocksResend(notificationStatus);
          let selectable = !blocked;
          if (this.isStudentAttendanceTab) {
            selectable = attendanceMarked && !blocked;
          } else if (this.isExamsModule) {
            selectable = examCriteriaMet && !blocked;
          } else if (this.isFeesModule) {
            selectable = feeCriteriaMet && !blocked;
          } else if (this.isCustomModule) {
            selectable = (info?.student_count ?? enrolledCount) > 0 && !blocked;
          } else if (this.isHolidaysModule || this.isAssignmentsModule) {
            selectable = !!info && !blocked;
          } else if (this.usesEligibleTargets) {
            selectable = !!info && !blocked;
          }
          const displayStudentCount = this.isAssignmentsModule
            ? assignmentCount
            : this.isFeesModule && this.feeNotifyMode === 'due' && feeReminderCount > 0
              ? feeReminderCount
              : enrolledCount;
          return {
            grade: grade.grade,
            section: section.section,
            student_count: displayStudentCount,
            assignmentCount,
            assignmentSubjectNames: assignmentSubjectNames || undefined,
            assignmentHasNew,
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
          .filter(section => {
            if (this.isAssignmentsModule) {
              return (section.assignmentCount ?? 0) > 0;
            }
            return this.examSectionVisible(section) && this.feeSectionVisible(section);
          })
      }))
      .filter(group => group.sections.length > 0);
  }

  private normalizeAssignmentMap(
    raw: Record<
      string,
      { assignment_count?: number; has_new?: boolean; subject_names?: string }
    >
  ): Record<
    string,
    { assignment_count: number; has_new: boolean; subject_names: string }
  > {
    const out: Record<
      string,
      { assignment_count: number; has_new: boolean; subject_names: string }
    > = {};
    Object.entries(raw || {}).forEach(([key, value]) => {
      const parts = key.split('|');
      if (parts.length !== 2) {
        return;
      }
      const normalized = this.sectionKey(parts[0], parts[1]);
      out[normalized] = {
        assignment_count: value.assignment_count ?? 0,
        has_new: value.has_new ?? false,
        subject_names: value.subject_names ?? ''
      };
    });
    return out;
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

  private coerceDeliveryRecord(
    raw: unknown
  ): Record<string, { notification_status?: SectionNotificationStatus; campaign_id?: number; sent_count?: number }> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {};
    }
    return raw as Record<
      string,
      { notification_status?: SectionNotificationStatus; campaign_id?: number; sent_count?: number }
    >;
  }

  private normalizeDeliveryMap(
    raw: Record<string, { notification_status?: SectionNotificationStatus; campaign_id?: number; sent_count?: number }>
  ): Record<string, { notification_status: SectionNotificationStatus; campaign_id?: number; sent_count?: number }> {
    const out: Record<string, { notification_status: SectionNotificationStatus; campaign_id?: number; sent_count?: number }> = {};
    Object.entries(this.coerceDeliveryRecord(raw)).forEach(([key, value]) => {
      const parts = key.split('|');
      if (parts.length !== 2) {
        return;
      }
      if (this.isStaffDeliverySectionKey(parts[0], parts[1])) {
        return;
      }
      const entry = {
        notification_status: value.notification_status || ('not_sent' as SectionNotificationStatus),
        campaign_id: value.campaign_id,
        sent_count: value.sent_count
      };
      this.sectionKeyVariants(parts[0], parts[1]).forEach(variantKey => {
        out[variantKey] = entry;
      });
    });
    return out;
  }

  private mergeDeliveryMaps(
    ...sources: Record<string, { notification_status?: SectionNotificationStatus; campaign_id?: number; sent_count?: number }>[]
  ): Record<string, { notification_status: SectionNotificationStatus; campaign_id?: number; sent_count?: number }> {
    const merged: Record<
      string,
      { notification_status: SectionNotificationStatus; campaign_id?: number; sent_count?: number }
    > = {};
    for (const raw of sources) {
      const normalized = this.normalizeDeliveryMap(raw);
      Object.entries(normalized).forEach(([key, value]) => {
        const existing = merged[key];
        if (!existing || this.notificationStatusRank(value.notification_status) > this.notificationStatusRank(existing.notification_status)) {
          merged[key] = value;
        }
      });
    }
    return merged;
  }

  private deliveryMapFromEligibleRows(
    rows: { grade: string; section: string; notification_status?: SectionNotificationStatus; campaign_id?: number; sent_count?: number }[]
  ): Record<string, { notification_status?: SectionNotificationStatus; campaign_id?: number; sent_count?: number }> {
    const out: Record<string, { notification_status?: SectionNotificationStatus; campaign_id?: number; sent_count?: number }> = {};
    rows.forEach(row => {
      if (!row.notification_status || row.notification_status === 'not_sent') {
        return;
      }
      this.sectionKeyVariants(row.grade, row.section).forEach(key => {
        out[key] = {
          notification_status: row.notification_status,
          campaign_id: row.campaign_id,
          sent_count: row.sent_count
        };
      });
    });
    return out;
  }

  private notificationStatusRank(status: SectionNotificationStatus): number {
    switch (status) {
      case 'sent':
        return 4;
      case 'partial':
        return 3;
      case 'sending':
        return 2;
      case 'failed':
        return 1;
      default:
        return 0;
    }
  }

  private isStaffDeliverySectionKey(grade: string, section: string): boolean {
    const g = (grade ?? '').trim().toLowerCase();
    const s = (section ?? '').trim().toLowerCase();
    return g === 'staff' || s === 'teachers';
  }

  private sectionKeyVariants(grade: string, section: string): string[] {
    const sectionName = String(section).trim();
    const g = String(grade ?? '').trim();
    const variants = new Set<string>();
    variants.add(this.sectionKey(g, sectionName));
    variants.add(this.sectionKey(this.normalizeGradeKey(g), sectionName));
    if (/^\d+(\.\d+)?$/.test(this.normalizeGradeKey(g))) {
      variants.add(this.sectionKey(`Grade ${this.normalizeGradeKey(g)}`, sectionName));
    }
    return [...variants];
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
    if (this.isCustomModule && this.selectedStaffUserIds.length > 0) {
      const messageTemplate = templateMap['message'];
      if (messageTemplate) {
        this.staffTemplateId = messageTemplate;
      }
    }

    const payload: Record<string, unknown> = {
      module: this.effectiveCampaignModule,
      branch_id: this.branchId,
      targets: this.isTeacherAttendanceTab ? [] : this.selectedTargets(),
      template_map: templateMap
    };
    if (!this.isExamsModule && !this.isCustomModule) {
      payload['event_date'] = this.campaignEventDateString();
    }
    if (this.isTeacherAttendanceTab && this.selectedTeacherAttendanceUserIds.length > 0) {
      payload['teacher_user_ids'] = [...this.selectedTeacherAttendanceUserIds];
    }
    if (this.selectedStaffUserIds.length > 0) {
      payload['staff_user_ids'] = [...this.selectedStaffUserIds];
      if (this.staffTemplateId) {
        payload['staff_template_id'] = this.staffTemplateId;
      }
    }
    if (this.isExamsModule && this.selectedExamId) {
      payload['exam_id'] = this.selectedExamId;
      payload['notify_mode'] = this.examNotifyMode;
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
    if (this.isCustomModule && this.customAttachments.length > 0) {
      payload['attachments'] = this.customAttachments.map(item => ({ ...item }));
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
    eligibleByKey: Map<string, EligibleSectionInfo>
  ): EligibleSectionInfo | undefined {
    return this.lookupSectionInMap(grade, section, eligibleByKey);
  }

  private lookupSectionInRecordMap<T>(grade: string, section: string, map: Record<string, T>): T | undefined {
    return this.lookupSectionInMap(grade, section, new Map(Object.entries(map || {})));
  }

  private lookupSectionInMap<T>(grade: string, section: string, map: Map<string, T>): T | undefined {
    const sectionName = String(section).trim();
    const candidates = [
      this.sectionKey(grade, sectionName),
      this.sectionKey(this.normalizeGradeKey(grade), sectionName)
    ];
    for (const key of candidates) {
      const hit = map.get(key);
      if (hit !== undefined) {
        return hit;
      }
    }
    const wantGrade = this.normalizeGradeKey(grade);
    for (const [key, value] of map.entries()) {
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

  private buildTeacherClassGroupsFromStaff(
    groups: {
      key: string;
      label: string;
      people: {
        user_id: number;
        name: string;
        subtitle: string;
        attendance_marked?: boolean;
        present?: number;
        absent?: number;
        leave?: number;
      }[];
    }[],
    deliveryByUser: Record<
      number,
      { notification_status?: SectionNotificationStatus; campaign_id?: number }
    >
  ): ClassGroup[] {
    const selectedSet = new Set(this.selectedTeacherAttendanceUserIds);

    return groups
      .map(group => ({
        grade: group.key,
        className: group.label,
        sections: group.people.map(person => {
          const userId = person.user_id;
          const delivery = deliveryByUser[userId];
          const attendanceMarked = person.attendance_marked ?? false;
          const notificationStatus: SectionNotificationStatus =
            delivery?.notification_status ?? 'not_sent';
          const blocked = this.notificationBlocksResend(notificationStatus);
          const selectable = attendanceMarked && !blocked;
          return {
            grade: group.key,
            section: String(userId),
            userId,
            personName: person.name,
            personSubtitle: person.subtitle,
            student_count: 1,
            enrolledCount: 1,
            markedCount: attendanceMarked ? 1 : 0,
            tallyPresent: person.present ?? 0,
            tallyAbsent: person.absent ?? 0,
            tallyLeave: person.leave ?? 0,
            selected: selectable && selectedSet.has(userId),
            selectable,
            attendanceMarked,
            notificationStatus,
            examScheduleCount: 0,
            examMarksCount: 0,
            examCriteriaMet: false,
            feeUnpaidCount: 0,
            feeOverdueCount: 0,
            feeReminderCount: 0,
            feeCriteriaMet: false,
            structureApplies: false,
            structureEnrolledCount: 0
          };
        })
      }))
      .filter(group => group.sections.length > 0);
  }

  private syncTeacherIdsFromGrid(): void {
    if (!this.isTeacherAttendanceTab) {
      return;
    }
    this.selectedTeacherAttendanceUserIds = this.classGroups
      .flatMap(group => group.sections)
      .filter(section => section.selected && section.userId != null)
      .map(section => section.userId as number);
  }

  private applyTeacherSelectionToGrid(): void {
    if (!this.isTeacherAttendanceTab) {
      return;
    }
    const selectedSet = new Set(this.selectedTeacherAttendanceUserIds);
    this.classGroups.forEach(group => {
      group.sections.forEach(section => {
        if (!section.selectable) {
          section.selected = false;
          return;
        }
        section.selected = section.userId != null && selectedSet.has(section.userId);
      });
    });
  }

  private clearSelectionForNonSelectableSections(): void {
    this.classGroups.forEach(group => {
      group.sections.forEach(section => {
        if (!section.selectable) {
          section.selected = false;
        }
      });
    });
  }

  private normalizeDeliveryByUser(
    raw: Record<string, { notification_status?: SectionNotificationStatus; campaign_id?: number }>
  ): Record<number, { notification_status?: SectionNotificationStatus; campaign_id?: number }> {
    const out: Record<number, { notification_status?: SectionNotificationStatus; campaign_id?: number }> =
      {};
    Object.entries(raw || {}).forEach(([key, value]) => {
      const userId = parseInt(key, 10);
      if (userId > 0) {
        out[userId] = value;
      }
    });
    return out;
  }
}
