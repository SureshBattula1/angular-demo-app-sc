import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { AppNotification, CommunicationService } from '../../services/communication.service';
import { NotificationInboxUiService } from '../../services/notification-inbox-ui.service';
import {
  notificationDisplayDate,
  notificationIsUnread,
  notificationPreviewText,
  notificationRelativeTime,
  notificationSourceIcon,
  notificationSourceLabel
} from '../../utils/notification-display.util';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  /** Full inbox page — available to any logged-in user (see app.routes). */
  static readonly viewAllRoute = '/notifications';

  private readonly communicationService = inject(CommunicationService);
  private readonly inboxUi = inject(NotificationInboxUiService);
  private readonly router = inject(Router);

  unreadCount = 0;
  loadingPreview = false;
  preview: AppNotification[] = [];
  private sub?: Subscription;

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onMenuOpened(): void {
    this.refresh();
    this.loadPreview();
  }

  refresh(): void {
    this.sub?.unsubscribe();
    this.sub = this.communicationService.getUnreadNotificationCount().subscribe({
      next: response => {
        this.unreadCount = response.data?.unread ?? 0;
      },
      error: () => {
        this.unreadCount = 0;
      }
    });
  }

  loadPreview(): void {
    this.loadingPreview = true;
    this.communicationService.getNotifications({ status: 'all', per_page: 10 }).subscribe({
      next: response => {
        this.preview = response.data || [];
        this.loadingPreview = false;
      },
      error: () => {
        this.preview = [];
        this.loadingPreview = false;
      }
    });
  }

  openItem(item: AppNotification, menuTrigger?: MatMenuTrigger): void {
    menuTrigger?.closeMenu();
    const ref = this.inboxUi.openDetail(item);
    ref.afterClosed().subscribe(() => {
      this.refresh();
      this.loadPreview();
    });
  }

  viewAll(menuTrigger?: MatMenuTrigger): void {
    menuTrigger?.closeMenu();
    void this.router.navigateByUrl(NotificationBellComponent.viewAllRoute);
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    this.communicationService.markAllAsRead().subscribe({
      next: () => {
        this.refresh();
        this.loadPreview();
      },
      error: () => undefined
    });
  }

  trackById(_: number, item: AppNotification): string | number {
    return item.id;
  }

  isUnread = notificationIsUnread;
  previewText = notificationPreviewText;
  sourceLabel = notificationSourceLabel;
  sourceIcon = notificationSourceIcon;
  displayDate = notificationDisplayDate;
  relativeTime = notificationRelativeTime;
}
