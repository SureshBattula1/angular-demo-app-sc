import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { Branch } from '../../../../core/models/branch.model';
import {
  SmsTemplate,
  SmsTemplateAudience,
  SmsTemplateService,
  SmsTemplateTagGroup
} from '../../services/sms-template.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { BranchService as BranchAccessService } from '../../../../core/services/branch.service';
import {
  SMS_TEMPLATE_MODULE_OPTIONS,
  SmsTemplateModuleType,
  normalizeCampaignModuleForTemplates,
  smsTemplateModuleLabel
} from '../../utils/sms-template-module.util';

export interface SmsTemplateDialogData {
  branches: Branch[];
  tagCatalogByModule?: Record<string, SmsTemplateTagGroup[]>;
  template: SmsTemplate | null;
  defaultBranchId?: string | number;
  defaultModuleType?: SmsTemplateModuleType | string;
}

@Component({
  selector: 'app-sms-template-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './sms-template-dialog.component.html',
  styleUrls: ['./sms-template-dialog.component.scss']
})
export class SmsTemplateDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<SmsTemplateDialogComponent, boolean>);
  data = inject<SmsTemplateDialogData>(MAT_DIALOG_DATA);
  private sms = inject(SmsTemplateService);
  private errorHandler = inject(ErrorHandlerService);
  private branchAccess = inject(BranchAccessService);

  saving = false;
  draftBranchId: string | number | null = null;
  draftName = '';
  draftBody = '';
  draftAudience: SmsTemplateAudience = 'student';
  draftModuleType: SmsTemplateModuleType = 'custom';
  draftActive = true;
  readonly moduleTypeOptions = SMS_TEMPLATE_MODULE_OPTIONS;
  tagCatalogByModule: Record<string, SmsTemplateTagGroup[]> = {};

  get isEdit(): boolean {
    return this.data.template !== null;
  }

  get showBranchSelector(): boolean {
    return this.branchAccess.showBranchSelector();
  }

  get moduleTypeLabel(): string {
    return smsTemplateModuleLabel(this.draftModuleType);
  }

  get visibleTagGroups(): SmsTemplateTagGroup[] {
    const groups = this.tagCatalogByModule[this.draftModuleType] ?? [];
    return groups.filter(group => {
      if (this.draftAudience === 'student') {
        return group.id !== 'teacher';
      }
      if (this.draftAudience === 'teacher') {
        return group.id !== 'student' && group.id !== 'parent';
      }
      return true;
    });
  }

  ngOnInit(): void {
    if (this.data.tagCatalogByModule && Object.keys(this.data.tagCatalogByModule).length > 0) {
      this.tagCatalogByModule = this.data.tagCatalogByModule;
    } else {
      this.sms.tagCatalog().subscribe({
        next: res => {
          if (res.success && res.data?.tag_catalog_by_module) {
            this.tagCatalogByModule = res.data.tag_catalog_by_module;
          }
        },
        error: () => {}
      });
    }

    const t = this.data.template;
    const branches = this.data.branches;

    if (t) {
      this.draftBranchId = t.branch_id;
      this.draftName = t.name;
      this.draftBody = t.body;
      this.draftAudience = t.audience;
      this.draftModuleType =
        normalizeCampaignModuleForTemplates(t.module_type ?? 'custom') ?? 'custom';
      this.draftActive = t.is_active;
    } else {
      const locked = this.branchAccess.getDefaultBranchId() ?? this.branchAccess.getUserBranchId();
      this.draftBranchId = this.data.defaultBranchId ?? locked ?? branches[0]?.id ?? null;
      this.draftModuleType =
        normalizeCampaignModuleForTemplates(this.data.defaultModuleType ?? 'custom') ?? 'custom';
    }
  }

  insertTag(tag: string, textarea: HTMLTextAreaElement | null): void {
    const wrap = `#${tag}#`;
    if (textarea) {
      const start = textarea.selectionStart ?? this.draftBody.length;
      const end = textarea.selectionEnd ?? this.draftBody.length;
      this.draftBody = this.draftBody.slice(0, start) + wrap + this.draftBody.slice(end);
      setTimeout(() => {
        textarea.focus();
        const pos = start + wrap.length;
        textarea.setSelectionRange(pos, pos);
      });
    } else {
      this.draftBody += wrap;
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    const name = this.draftName.trim();
    if (!name || !this.draftBody.trim()) {
      return;
    }
    const bid = this.isEdit ? this.data.template!.branch_id : this.draftBranchId;
    if (bid === null || bid === undefined) {
      return;
    }
    this.saving = true;
    const payload = {
      name,
      body: this.draftBody,
      audience: this.draftAudience,
      module_type: this.draftModuleType,
      is_active: this.draftActive
    };
    const req = this.data.template
      ? this.sms.update(bid, this.data.template.id, payload)
      : this.sms.create(bid, payload);
    req.subscribe({
      next: res => {
        this.saving = false;
        if (res.success) {
          this.dialogRef.close(true);
        }
      },
      error: err => {
        this.saving = false;
        this.errorHandler.handleError(err);
      }
    });
  }
}
