import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AppNotification,
  CommunicationService,
  NotificationReceipts
} from '../../services/communication.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

export interface NotificationDetailData {
  notification: AppNotification;
  fromSent?: boolean;
}

@Component({
  selector: 'app-notification-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './notification-detail-dialog.component.html',
  styleUrls: ['./notification-detail-dialog.component.scss']
})
export class NotificationDetailDialogComponent {
  private readonly communicationService = inject(CommunicationService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly dialogRef = inject(MatDialogRef<NotificationDetailDialogComponent>);

  loadingReceipts = false;
  receipts: NotificationReceipts | null = null;
  showReceipts = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: NotificationDetailData) {}

  get item(): AppNotification {
    return this.data.notification;
  }

  close(): void {
    this.dialogRef.close();
  }

  loadReceipts(): void {
    if (!this.item.group_key) {
      return;
    }
    this.showReceipts = true;
    this.loadingReceipts = true;
    this.communicationService.getNotificationReceipts(this.item.group_key).subscribe({
      next: (res) => {
        this.receipts = res.data || null;
        this.loadingReceipts = false;
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.loadingReceipts = false;
      }
    });
  }
}
