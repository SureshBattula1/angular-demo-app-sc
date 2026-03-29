import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { Branch } from '../../../../core/models/branch.model';
import {
  SmsTemplate,
  SmsTemplateAudience,
  SmsTemplateService
} from '../../services/sms-template.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

export interface SmsTemplateDialogData {
  branches: Branch[];
  allowedTags: string[];
  template: SmsTemplate | null;
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

  saving = false;
  draftBranchId: number | null = null;
  draftName = '';
  draftBody = '';
  draftAudience: SmsTemplateAudience = 'student';
  draftActive = true;

  get isEdit(): boolean {
    return this.data.template !== null;
  }

  ngOnInit(): void {
    const t = this.data.template;
    const branches = this.data.branches ?? [];
    if (t) {
      this.draftBranchId = t.branch_id;
      this.draftName = t.name;
      this.draftBody = t.body;
      this.draftAudience = t.audience;
      this.draftActive = t.is_active;
    } else {
      this.draftBranchId = branches[0]?.id ?? null;
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
