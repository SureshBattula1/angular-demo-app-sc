import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { Branch } from '../../../../core/models/branch.model';
import { ApiResponse } from '../../../../core/services/api.service';
import { BranchService } from '../../../branches/services/branch.service';
import {
  SmsTemplate,
  SmsTemplateAudience,
  SmsTemplateService,
  SmsTemplatesIndexData
} from '../../services/sms-template.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import {
  SmsTemplateDialogComponent,
  SmsTemplateDialogData
} from '../sms-template-dialog/sms-template-dialog.component';

/** Row shape for the data table (display labels). */
export type SmsTemplateRow = SmsTemplate & {
  audience_label: string;
  status_label: string;
  branch_name: string;
};

@Component({
  selector: 'app-sms-templates-page',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './sms-templates-page.component.html',
  styleUrls: ['./sms-templates-page.component.scss']
})
export class SmsTemplatesPageComponent implements OnInit {
  private sms = inject(SmsTemplateService);
  private branchService = inject(BranchService);
  private errorHandler = inject(ErrorHandlerService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = false;
  branches: Branch[] = [];
  templates: SmsTemplateRow[] = [];
  allowedTags: string[] = [];

  tableConfig: TableConfig = {
    columns: [
      { key: 'branch_name', header: 'Branch', sortable: true, searchable: true, width: '160px' },
      { key: 'name', header: 'Template name', sortable: true, searchable: true },
      {
        key: 'audience_label',
        header: 'Audience',
        type: 'badge',
        sortable: true,
        width: '120px',
        align: 'center'
      },
      {
        key: 'status_label',
        header: 'Status',
        type: 'badge',
        sortable: true,
        width: '100px',
        align: 'center'
      },
      {
        key: 'updated_at',
        header: 'Updated',
        type: 'date',
        sortable: true,
        width: '140px'
      }
    ],
    actions: [
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: (row: SmsTemplateRow) => this.openDialog(row)
      },
      {
        icon: 'toggle_on',
        label: 'Deactivate',
        color: 'accent',
        action: (row: SmsTemplateRow) => this.toggleStatus(row),
        show: (row: SmsTemplateRow) => row.is_active
      },
      {
        icon: 'toggle_off',
        label: 'Activate',
        color: 'warn',
        action: (row: SmsTemplateRow) => this.toggleStatus(row),
        show: (row: SmsTemplateRow) => !row.is_active
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row: SmsTemplateRow) => this.deleteTemplate(row)
      }
    ],
    selectable: false,
    pagination: false,
    searchable: true,
    advancedSearch: true,
    exportable: false,
    responsive: true
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Search templates',
    width: '380px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'audience',
        label: 'Audience',
        type: 'select',
        placeholder: 'Any',
        icon: 'category',
        options: [
          { value: 'student', label: 'Students' },
          { value: 'teacher', label: 'Teachers' },
          { value: 'both', label: 'Both' }
        ]
      },
      {
        key: 'name',
        label: 'Name',
        type: 'text',
        placeholder: 'Template name',
        icon: 'label'
      },
      {
        key: 'is_active',
        label: 'Active only',
        type: 'checkbox',
        icon: 'check_circle'
      }
    ]
  };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.templates = [];
    forkJoin({
      branches: this.branchService.getBranches({ is_active: true }),
      templates: this.sms.listAll().pipe(
        catchError(() =>
          of({ success: false as const, data: undefined } as ApiResponse<SmsTemplatesIndexData>)
        )
      )
    }).subscribe({
      next: ({ branches, templates: tplRes }) => {
        this.loading = false;
        this.branches = branches.data ?? [];
        if (!tplRes.success || !tplRes.data) {
          this.allowedTags = [];
          return;
        }
        this.allowedTags = tplRes.data.allowed_tags ?? [];
        const merged: SmsTemplateRow[] = (tplRes.data.templates ?? []).map((t: SmsTemplate) =>
          this.toRow(t, t.branch_name ?? '')
        );
        merged.sort((a, c) => {
          const byBranch = a.branch_name.localeCompare(c.branch_name);
          if (byBranch !== 0) {
            return byBranch;
          }
          return a.name.localeCompare(c.name);
        });
        this.templates = merged;
      },
      error: err => {
        this.loading = false;
        this.errorHandler.handleError(err);
      }
    });
  }

  private toRow(t: SmsTemplate, branchName: string): SmsTemplateRow {
    return {
      ...t,
      branch_name: branchName,
      audience_label: this.audienceLabel(t.audience),
      status_label: t.is_active ? 'Active' : 'Inactive'
    };
  }

  audienceLabel(a: SmsTemplateAudience): string {
    switch (a) {
      case 'student':
        return 'Students';
      case 'teacher':
        return 'Teachers';
      default:
        return 'Both';
    }
  }

  openDialog(template: SmsTemplate | null): void {
    if (this.branches.length === 0) {
      this.snack.open('No branches available.', 'Dismiss', { duration: 4000 });
      return;
    }
    const data: SmsTemplateDialogData = {
      branches: this.branches,
      allowedTags: this.allowedTags,
      template
    };
    this.dialog
      .open(SmsTemplateDialogComponent, {
        width: 'min(580px, 100vw - 24px)',
        maxHeight: '90vh',
        data,
        autoFocus: 'input'
      })
      .afterClosed()
      .subscribe(saved => {
        if (saved) {
          this.snack.open('Template saved.', 'Dismiss', { duration: 3000 });
          this.reload();
        }
      });
  }

  deleteTemplate(t: SmsTemplateRow): void {
    if (!confirm(`Delete template "${t.name}"?`)) {
      return;
    }
    this.sms.delete(t.branch_id, t.id).subscribe({
      next: res => {
        if (res.success) {
          this.snack.open('Template deleted.', 'Dismiss', { duration: 3000 });
          this.reload();
        }
      },
      error: err => this.errorHandler.handleError(err)
    });
  }

  toggleStatus(t: SmsTemplateRow): void {
    this.sms.update(t.branch_id, t.id, { is_active: !t.is_active }).subscribe({
      next: res => {
        if (res.success) {
          this.snack.open('Status updated.', 'Dismiss', { duration: 3000 });
          this.reload();
        }
      },
      error: err => this.errorHandler.handleError(err)
    });
  }

  onAction(event: { action: string; row: unknown }): void {
    if (event.action === 'add') {
      this.openDialog(null);
    }
  }

  onRowClick(row: SmsTemplateRow): void {
    this.openDialog(row);
  }
}
