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
import { BranchService } from '../../../branches/services/branch.service';
import {
  SmsTemplate,
  SmsTemplateAudience,
  SmsTemplateService
} from '../../services/sms-template.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
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
  private permission = inject(PermissionService);
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
        action: (row: SmsTemplateRow) => this.openDialog(row),
        permission: 'bulk_management.edit'
      },
      {
        icon: 'toggle_on',
        label: 'Deactivate',
        color: 'accent',
        action: (row: SmsTemplateRow) => this.toggleStatus(row),
        permission: 'bulk_management.edit',
        show: (row: SmsTemplateRow) => row.is_active
      },
      {
        icon: 'toggle_off',
        label: 'Activate',
        color: 'warn',
        action: (row: SmsTemplateRow) => this.toggleStatus(row),
        permission: 'bulk_management.edit',
        show: (row: SmsTemplateRow) => !row.is_active
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row: SmsTemplateRow) => this.deleteTemplate(row),
        permission: 'bulk_management.edit'
      }
    ],
    selectable: false,
    pagination: false,
    searchable: true,
    advancedSearch: true,
    exportable: false,
    responsive: true,
    addButtonPermission: 'bulk_management.edit'
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
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: res => {
        this.branches = res.data ?? [];
        if (this.branches.length === 0) {
          this.loading = false;
          this.allowedTags = [];
          return;
        }

        const requests = this.branches.map(b =>
          this.sms.list(b.id).pipe(
            catchError(() => of({ success: false, data: undefined } as { success: boolean; data?: { templates?: SmsTemplate[]; allowed_tags?: string[] } }))
          )
        );

        forkJoin(requests).subscribe({
          next: results => {
            this.loading = false;
            const merged: SmsTemplateRow[] = [];
            let tags: string[] = [];
            results.forEach((apiRes, idx) => {
              const b = this.branches[idx];
              if (apiRes.success && apiRes.data) {
                if (!tags.length && apiRes.data.allowed_tags?.length) {
                  tags = apiRes.data.allowed_tags;
                }
                (apiRes.data.templates ?? []).forEach(t => {
                  merged.push(this.toRow(t, b.name));
                });
              }
            });
            this.allowedTags = tags;
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
    if (!this.permission.hasPermission('bulk_management.edit')) {
      return;
    }
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
    if (!this.permission.hasPermission('bulk_management.edit')) {
      return;
    }
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
