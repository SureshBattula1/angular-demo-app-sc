import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { Branch } from '../../../../core/models/branch.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import {
  SmsTemplate,
  SmsTemplateAudience,
  SmsTemplateService,
  SmsTemplateTagGroup
} from '../../services/sms-template.service';
import {
  SmsTemplateDialogComponent,
  SmsTemplateDialogData
} from '../sms-template-dialog/sms-template-dialog.component';
import {
  normalizeCampaignModuleForTemplates,
  smsTemplateModuleLabel
} from '../../utils/sms-template-module.util';

export interface SmsTemplatesManageDialogData {
  branchId: string | number;
  branches: Branch[];
  /** When opened from campaign schedule, pre-select this notification type for new templates. */
  campaignModule?: string;
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
  tagCatalogByModule: Record<string, SmsTemplateTagGroup[]> = {};
  private dirty = false;

  ngOnInit(): void {
    this.load();
  }

  get scheduleModuleLabel(): string | null {
    if (!this.data.campaignModule) {
      return null;
    }
    return smsTemplateModuleLabel(normalizeCampaignModuleForTemplates(this.data.campaignModule));
  }

  /** Match campaign schedule dropdown filtering (module_type). */
  get visibleTemplates(): SmsTemplate[] {
    const mod = normalizeCampaignModuleForTemplates(this.data.campaignModule ?? '');
    if (!mod) {
      return this.templates;
    }
    return this.templates.filter(t => {
      const type = (t.module_type ?? '').trim().toLowerCase();
      if (type === '') {
        return true;
      }
      return type === mod;
    });
  }

  load(): void {
    this.loading = true;
    this.sms.list(this.data.branchId).subscribe({
      next: res => {
        this.loading = false;
        if (!res.success || !res.data) {
          this.templates = [];
          return;
        }
        this.templates = [...(res.data.templates ?? [])].sort((a, b) => a.name.localeCompare(b.name));
        this.tagCatalogByModule = res.data.tag_catalog_by_module ?? {};
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

  audienceLabel(a: SmsTemplateAudience): string {
    switch (a) {
      case 'teacher':
        return 'Teachers';
      case 'both':
        return 'Both';
      default:
        return 'Students';
    }
  }

  moduleLabel(t: SmsTemplate): string {
    return smsTemplateModuleLabel(t.module_type);
  }

  private openEditor(template: SmsTemplate | null): void {
    const editorData: SmsTemplateDialogData = {
      branches: this.data.branches,
      tagCatalogByModule: this.tagCatalogByModule,
      template,
      defaultBranchId: this.data.branchId,
      defaultModuleType:
        normalizeCampaignModuleForTemplates(this.data.campaignModule ?? 'custom') ?? 'custom'
    };

    this.dialog
      .open(SmsTemplateDialogComponent, {
        width: 'min(960px, 98vw)',
        maxHeight: '92vh',
        panelClass: 'sms-template-editor-dialog',
        data: editorData
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
        <span class="pill">{{ data.template.module_type || 'custom' }}</span>
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
