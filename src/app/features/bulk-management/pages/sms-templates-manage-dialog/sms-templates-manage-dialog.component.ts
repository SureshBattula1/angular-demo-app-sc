import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { Branch } from '../../../../core/models/branch.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { SmsTemplate, SmsTemplateService } from '../../services/sms-template.service';
import {
  SmsTemplateDialogComponent,
  SmsTemplateDialogData
} from '../sms-template-dialog/sms-template-dialog.component';

export interface SmsTemplatesManageDialogData {
  branchId: string | number;
  branches: Branch[];
}

@Component({
  selector: 'app-sms-templates-manage-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './sms-templates-manage-dialog.component.html',
  styleUrls: ['./sms-templates-manage-dialog.component.scss']
})
export class SmsTemplatesManageDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<SmsTemplatesManageDialogComponent, boolean>);
  data = inject<SmsTemplatesManageDialogData>(MAT_DIALOG_DATA);
  private sms = inject(SmsTemplateService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private errorHandler = inject(ErrorHandlerService);

  loading = false;
  templates: SmsTemplate[] = [];
  allowedTags: string[] = [];
  private dirty = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.sms.list(this.data.branchId).subscribe({
      next: res => {
        this.loading = false;
        if (!res.success || !res.data) {
          this.templates = [];
          this.allowedTags = [];
          return;
        }
        this.templates = [...(res.data.templates ?? [])].sort((a, b) => a.name.localeCompare(b.name));
        this.allowedTags = res.data.allowed_tags ?? [];
      },
      error: err => {
        this.loading = false;
        this.errorHandler.handleError(err);
      }
    });
  }

  close(): void {
    this.dialogRef.close(this.dirty);
  }

  createNew(): void {
    this.openEditor(null);
  }

  viewTemplate(t: SmsTemplate): void {
    this.dialog.open(SmsTemplateViewDialogComponent, {
      width: 'min(520px, 100vw - 24px)',
      maxHeight: '85vh',
      data: { template: t }
    });
  }

  editTemplate(t: SmsTemplate): void {
    this.openEditor(t);
  }

  deleteTemplate(t: SmsTemplate): void {
    if (!confirm(`Delete template "${t.name}"?`)) {
      return;
    }
    this.sms.delete(t.branch_id, t.id).subscribe({
      next: res => {
        if (res.success) {
          this.snack.open('Template deleted.', 'Dismiss', { duration: 3000 });
          this.dirty = true;
          this.load();
        }
      },
      error: err => this.errorHandler.handleError(err)
    });
  }

  private openEditor(template: SmsTemplate | null): void {
    const editorData: SmsTemplateDialogData = {
      branches: this.data.branches,
      allowedTags: this.allowedTags,
      template,
      defaultBranchId: this.data.branchId
    };
    this.dialog
      .open(SmsTemplateDialogComponent, {
        width: 'min(580px, 100vw - 24px)',
        maxHeight: '90vh',
        data: editorData,
        autoFocus: 'input'
      })
      .afterClosed()
      .subscribe(saved => {
        if (saved) {
          this.snack.open('Template saved.', 'Dismiss', { duration: 3000 });
          this.dirty = true;
          this.load();
        }
      });
  }

  audienceLabel(a: string): string {
    switch (a) {
      case 'teacher':
        return 'Teachers';
      case 'both':
        return 'Both';
      default:
        return 'Students';
    }
  }
}

/** Read-only template preview (inline, no extra files). */
@Component({
  selector: 'app-sms-template-view-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>{{ data.template.name }}</h2>
    <mat-dialog-content class="view-body">
      <p class="meta">
        <span class="pill">{{ data.template.audience }}</span>
        <span class="pill" [class.inactive]="!data.template.is_active">
          {{ data.template.is_active ? 'Active' : 'Inactive' }}
        </span>
      </p>
      <pre class="message">{{ data.template.body }}</pre>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close type="button">Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .view-body {
        min-width: 280px;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0 0 12px;
      }
      .pill {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--gray-100, #f5f5f5);
        text-transform: capitalize;
      }
      .pill.inactive {
        opacity: 0.75;
      }
      .message {
        margin: 0;
        padding: 12px;
        border-radius: 8px;
        background: var(--gray-50, #fafafa);
        border: 1px solid var(--gray-200, #eee);
        white-space: pre-wrap;
        word-break: break-word;
        font-family: inherit;
        font-size: 13px;
        line-height: 1.45;
      }
    `
  ]
})
export class SmsTemplateViewDialogComponent {
  data = inject<{ template: SmsTemplate }>(MAT_DIALOG_DATA);
}
