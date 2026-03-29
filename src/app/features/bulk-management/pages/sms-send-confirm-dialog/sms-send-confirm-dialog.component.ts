import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';

export interface SmsSendConfirmDialogData {
  bodyTemplate: string;
  sampleRendered: string;
  sampleLabel: string | null;
  recipientCount: number;
}

@Component({
  selector: 'app-sms-send-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MaterialModule],
  templateUrl: './sms-send-confirm-dialog.component.html',
  styleUrls: ['./sms-send-confirm-dialog.component.scss']
})
export class SmsSendConfirmDialogComponent {
  readonly data = inject<SmsSendConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SmsSendConfirmDialogComponent>);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
