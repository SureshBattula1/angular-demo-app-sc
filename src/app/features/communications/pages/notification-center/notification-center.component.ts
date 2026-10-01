import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, firstValueFrom } from 'rxjs';
import { AppNotification, CommunicationService } from '../../services/communication.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationInboxUiService } from '../../services/notification-inbox-ui.service';
import {
  notificationClassSectionLine,
  notificationDisplayDate,
  notificationIsUnread,
  notificationListSubtitle,
  notificationListTitle,
  notificationPreviewText,
  notificationRelativeTime,
  notificationSourceIcon,
  notificationSourceLabel,
  notificationStatusLabel,
  notificationStatusTone
} from '../../utils/notification-display.util';

type TabKey = 'inbox' | 'sent';
type StatusFilter = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss']
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  private readonly communicationService = inject(CommunicationService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly inboxUi = inject(NotificationInboxUiService);

  activeTab: TabKey = 'inbox';
  statusFilter: StatusFilter = 'all';
  loading = false;
  loadingMore = false;
  inbox: AppNotification[] = [];
  sent: AppNotification[] = [];
  unreadCount = 0;
  inboxTotal = 0;
  inboxPage = 1;
  inboxHasMore = false;
  canCompose = false;
  private sub?: Subscription;
  private readonly perPage = 25;

  isUnread = notificationIsUnread;
  previewText = notificationPreviewText;
  sourceLabel = notificationSourceLabel;
  sourceIcon = notificationSourceIcon;
  displayDate = notificationDisplayDate;
  relativeTime = notificationRelativeTime;
  statusLabel = notificationStatusLabel;
  statusTone = notificationStatusTone;
  classLine = notificationClassSectionLine;
  listTitle = notificationListTitle;
  listSubtitle = notificationListSubtitle;

  async ngOnInit(): Promise<void> {
    const user = await firstValueFrom(this.authService.getCurrentUser());
    const role = user.data?.role ?? '';
    this.canCompose = ['Teacher', 'BranchAdmin', 'SuperAdmin', 'Staff'].includes(role);

    this.loadInbox(true);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setTab(tab: TabKey): void {
    this.activeTab = tab;
    if (tab === 'inbox') {
      this.loadInbox(true);
    } else {
      this.loadSent();
    }
  }

  loadInbox(reset = false): void {
    if (reset) {
      this.inboxPage = 1;
      this.inbox = [];
    }
    this.loading = reset;
    this.loadingMore = !reset;
    this.sub?.unsubscribe();
    this.sub = this.communicationService
      .getNotifications({
        status: this.statusFilter,
        page: this.inboxPage,
        per_page: this.perPage
      })
      .subscribe({
        next: res => {
          const batch = res.data || [];
          this.inbox = reset ? batch : [...this.inbox, ...batch];
          this.inboxTotal = res.meta?.total ?? this.inbox.length;
          this.inboxHasMore = !!res.meta?.has_more_pages;
          this.loading = false;
          this.loadingMore = false;
          this.refreshUnreadCount();
        },
        error: err => {
          this.errorHandler.handleError(err);
          this.loading = false;
          this.loadingMore = false;
        }
      });
  }

  loadMoreInbox(): void {
    if (this.loadingMore || !this.inboxHasMore) {
      return;
    }
    this.inboxPage += 1;
    this.loadInbox(false);
  }

  loadSent(): void {
    this.loading = true;
    this.sub?.unsubscribe();
    this.sub = this.communicationService.getSentNotifications().subscribe({
      next: res => {
        this.sent = res.data || [];
        this.loading = false;
      },
      error: err => {
        this.errorHandler.handleError(err);
        this.loading = false;
      }
    });
  }

  onStatusChange(): void {
    this.loadInbox(true);
  }

  private refreshUnreadCount(): void {
    this.communicationService.getUnreadNotificationCount().subscribe({
      next: response => {
        this.unreadCount = response.data?.unread ?? 0;
      },
      error: () => undefined
    });
  }

  markAllRead(): void {
    this.communicationService.markAllAsRead().subscribe({
      next: () => {
        this.errorHandler.showSuccess('All notifications marked as read');
        this.loadInbox(true);
      },
      error: err => this.errorHandler.handleError(err)
    });
  }

  openCompose(): void {
    this.router.navigate(['/communications/notifications/compose']);
  }

  openItem(item: AppNotification, fromSent = false): void {
    const ref = this.inboxUi.openDetail(item, fromSent);
    ref.afterClosed().subscribe(() => {
      if (!fromSent) {
        this.loadInbox(true);
      }
    });
  }

  trackById(_: number, item: AppNotification): string | number {
    return item.id;
  }
}
