import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppNotification } from './communication.service';
import {
  NotificationDetailDialogComponent,
  NotificationDetailData
} from '../components/notification-detail-dialog/notification-detail-dialog.component';

@Injectable({ providedIn: 'root' })
export class NotificationInboxUiService {
  private readonly dialog = inject(MatDialog);

  openDetail(
    notification: AppNotification,
    fromSent = false
  ): MatDialogRef<NotificationDetailDialogComponent, AppNotification | undefined> {
    return this.dialog.open(NotificationDetailDialogComponent, {
      width: '480px',
      maxWidth: '96vw',
      minHeight: '420px',
      maxHeight: '92vh',
      panelClass: 'notification-detail-dialog-panel',
      data: { notification, fromSent } satisfies NotificationDetailData
    });
  }
}
