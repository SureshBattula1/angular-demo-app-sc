import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import {
  CampaignSample,
  CampaignStatusOption,
  NotificationCampaignService
} from '../../services/notification-campaign.service';

interface SectionChoice {
  grade: string;
  section: string;
  student_count: number;
  selected: boolean;
  selectable: boolean;
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
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './campaign-schedule.component.html',
  styleUrls: ['./campaign-schedule.component.scss']
})
export class CampaignScheduleComponent implements OnInit {
  module = 'attendance';
  step = 1;
  saving = false;
  loadingClasses = false;
  branches: Array<{ id: string | number; name: string }> = [];
  branchId = '';
  eventDate: Date = new Date();
  classGroups: ClassGroup[] = [];
  statuses: CampaignStatusOption[] = [];
  templates: Array<{ id: number; name: string }> = [];
  templateMap: Record<string, number | null> = {};
  samples: CampaignSample[] = [];
  showPreview = false;
  showSelectionConfirm = false;

  private loadToken = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private branchService: BranchService,
    private campaigns: NotificationCampaignService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.module = this.route.snapshot.paramMap.get('module') || 'attendance';
    this.branchService.getBranches().subscribe({
      next: response => {
        this.branches = (response.data || []).map((branch: { id: string | number; name: string }) => ({
          id: branch.id,
          name: branch.name
        }));
      },
      error: error => this.errorHandler.showError(error)
    });
    this.campaigns.modules().subscribe({
      next: response => {
        this.statuses = response.data?.[this.module] || [];
        this.statuses.forEach(status => {
          this.templateMap[status.key] = null;
        });
      }
    });
  }

  get title(): string {
    return `Schedule ${this.module} notification`;
  }

  get attendanceMode(): boolean {
    return this.module === 'attendance';
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
    if (!this.branchId) {
      return;
    }
    this.loadClasses();
    this.campaigns.templates(this.branchId).subscribe({
      next: response => {
        this.templates = response.data || [];
      },
      error: error => this.errorHandler.showError(error)
    });
  }

  onDateChange(): void {
    if (this.attendanceMode && this.branchId) {
      this.loadClasses();
    }
  }

  loadClasses(): void {
    const token = ++this.loadToken;
    this.loadingClasses = true;
    if (this.attendanceMode) {
      forkJoin({
        classes: this.campaigns.classOptions(this.branchId),
        marked: this.campaigns.markedAttendance(this.branchId, this.dateString())
      }).subscribe({
        next: ({ classes, marked }) => {
          if (token !== this.loadToken) {
            return;
          }
          const taken = new Map<string, number>();
          (marked.data || []).forEach(row => {
            taken.set(`${row.grade}|${row.section}`, row.student_count);
          });
          this.classGroups = (classes.data?.grades || []).map(grade => ({
            grade: grade.grade,
            className: grade.label || `Grade ${grade.grade}`,
            sections: (grade.sections || []).map(section => {
              const markedCount = taken.get(`${grade.grade}|${section.section}`);
              const selectable = markedCount !== undefined;
              return {
                grade: grade.grade,
                section: section.section,
                student_count: selectable ? markedCount : section.student_count,
                selected: false,
                selectable
              };
            })
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
            selected: false,
            selectable: true
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
    this.selectableSections.forEach(section => {
      section.selected = selected;
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
    if (!this.branchId || !this.eventDate) {
      this.errorHandler.showError('Select a branch and a date.');
      return;
    }
    if (this.selectedTargets().length === 0) {
      this.errorHandler.showError('Select at least one class section.');
      return;
    }
    if (this.attendanceMode) {
      this.showSelectionConfirm = true;
      return;
    }
    this.step = 2;
  }

  closeSelectionConfirm(): void {
    this.showSelectionConfirm = false;
  }

  confirmSelection(): void {
    this.showSelectionConfirm = false;
    this.step = 2;
  }

  openPreview(): void {
    const map = this.mappedTemplates();
    if (Object.keys(map).length === 0) {
      this.errorHandler.showError('Map at least one status to a template.');
      return;
    }
    this.saving = true;
    this.campaigns.preview({
      module: this.module,
      branch_id: this.branchId,
      event_date: this.dateString(),
      targets: this.selectedTargets(),
      template_map: map
    }).subscribe({
      next: response => {
        this.samples = response.data || [];
        this.showPreview = true;
        this.saving = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.saving = false;
      }
    });
  }

  confirm(): void {
    this.saving = true;
    this.campaigns.create({
      module: this.module,
      branch_id: this.branchId,
      event_date: this.dateString(),
      targets: this.selectedTargets(),
      template_map: this.mappedTemplates()
    }).subscribe({
      next: response => {
        this.saving = false;
        this.showPreview = false;
        this.errorHandler.showSuccess('Notification scheduled');
        const id = response.data?.id;
        this.router.navigate(id ? ['/notification-campaigns/view', id] : ['/notification-campaigns'], {
          queryParams: { tab: this.module }
        });
      },
      error: error => {
        this.errorHandler.showError(error);
        this.saving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/notification-campaigns'], { queryParams: { tab: this.module } });
  }

  private mappedTemplates(): Record<string, number> {
    const map: Record<string, number> = {};
    Object.entries(this.templateMap).forEach(([key, value]) => {
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
          reason: !section.selectable ? 'Attendance not taken' : undefined
        });
      });
    });
    return rows;
  }

  private dateString(): string {
    const date = this.eventDate;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
