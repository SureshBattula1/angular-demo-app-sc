import { Component, Inject, OnInit, inject } from '@angular/core';
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
import { NotificationCampaignService } from '../../../notification-campaigns/services/notification-campaign.service';
import { notificationSourceIcon } from '../../utils/notification-display.util';

export interface NotificationDetailData {
  notification: AppNotification;
  fromSent?: boolean;
}

type StatusTone = 'absent' | 'present' | 'leave' | 'neutral';

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
export class NotificationDetailDialogComponent implements OnInit {
  private readonly communicationService = inject(CommunicationService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly campaigns = inject(NotificationCampaignService);
  private readonly dialogRef = inject(MatDialogRef<NotificationDetailDialogComponent>);

  detail: AppNotification | null = null;
  loading = false;
  liked = false;
  liking = false;
  loadingReceipts = false;
  receipts: NotificationReceipts | null = null;
  showReceipts = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: NotificationDetailData) {}

  ngOnInit(): void {
    if (this.data.fromSent) {
      this.detail = this.data.notification;
      this.liked = !!this.detail.liked;
      return;
    }

    const id = this.data.notification.id;
    if (!id) {
      this.detail = this.data.notification;
      return;
    }

    this.loading = true;
    this.communicationService.getNotification(id).subscribe({
      next: response => {
        this.detail = response.data || this.data.notification;
        this.liked = !!this.detail?.liked;
        this.loading = false;
      },
      error: err => {
        this.errorHandler.handleError(err);
        this.detail = this.data.notification;
        this.loading = false;
      }
    });
  }

  get item(): AppNotification {
    return this.detail || this.data.notification;
  }

  get canLike(): boolean {
    return !this.data.fromSent && this.item.source === 'notification_campaign' && !!this.item.id;
  }

  get messageBody(): string {
    if (this.isCampaign()) {
      return this.item.message || this.item.description || '';
    }
    return this.item.description || this.item.message || '';
  }

  get optionalBody(): string {
    return (this.item.optional_description || '').trim();
  }

  attachmentUrl(file: { url?: string; file_url?: string; file_path?: string }): string {
    return file.url || file.file_url || file.file_path || '#';
  }

  attachmentLabel(file: { name?: string; original_name?: string; file_name?: string }): string {
    return file.name || file.original_name || file.file_name || 'Attachment';
  }

  isCampaign(): boolean {
    return (this.item.source || '').toLowerCase() === 'notification_campaign';
  }

  moduleIcon(): string {
    return notificationSourceIcon(this.item);
  }

  sourceLabel(): string {
    const source = (this.item.source || '').toLowerCase();
    if (source === 'notification_campaign') {
      const module = (this.item.module || 'campaign').toLowerCase();
      return module.charAt(0).toUpperCase() + module.slice(1);
    }
    if (source === 'custom') return 'Message';
    if (source === 'assignment') return 'Assignment';
    return source ? source.charAt(0).toUpperCase() + source.slice(1) : 'Notification';
  }

  statusLabel(): string {
    const key = (this.item.status_key || '').trim();
    if (key) {
      return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    const parts = (this.item.title || '').split('·');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return '';
  }

  statusTone(): StatusTone {
    const raw = `${this.item.status_key || ''} ${this.statusLabel()}`.toLowerCase();
    if (raw.includes('absent') || raw.includes('overdue')) return 'absent';
    if (raw.includes('present') || raw.includes('paid') || raw.includes('result')) return 'present';
    if (raw.includes('leave') || raw.includes('due') || raw.includes('scheduled')) return 'leave';
    return 'neutral';
  }

  classSectionLine(): string {
    if (this.item.grade && this.item.section) {
      return `Grade ${this.item.grade} · Section ${this.item.section}`;
    }
    return (this.item.audience || '').replace(' - ', ' · Section ') || '';
  }

  headlineTitle(): string {
    if (this.isCampaign()) {
      return this.sourceLabel();
    }
    return this.item.title || 'Notification';
  }

  headlineSubtitle(): string {
    if (this.isCampaign() && this.statusLabel()) {
      return this.statusLabel();
    }
    return this.item.title || '';
  }

  sentAtLabel(): string {
    return this.item.date || this.item.sent_at || this.item.created_at || '';
  }

  showGenericMeta(): boolean {
    return !this.isCampaign() && !!(this.item.audience || this.item.priority || this.item.student_count != null);
  }

  showPriority(): boolean {
    const p = (this.item.priority || '').trim();
    return p !== '' && p.toLowerCase() !== 'medium';
  }

  toggleLike(): void {
    if (!this.item.id || this.liking) {
      return;
    }
    this.liking = true;
    this.campaigns.like(this.item.id).subscribe({
      next: response => {
        this.liked = !!response.data?.liked;
        this.liking = false;
      },
      error: err => {
        this.errorHandler.handleError(err);
        this.liking = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close(this.detail || this.data.notification);
  }

  loadReceipts(): void {
    if (!this.item.group_key) {
      return;
    }
    this.showReceipts = true;
    this.loadingReceipts = true;
    this.communicationService.getNotificationReceipts(this.item.group_key).subscribe({
      next: res => {
        this.receipts = res.data || null;
        this.loadingReceipts = false;
      },
      error: err => {
        this.errorHandler.handleError(err);
        this.loadingReceipts = false;
      }
    });
  }
}
