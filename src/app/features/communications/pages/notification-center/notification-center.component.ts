import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, firstValueFrom } from 'rxjs';
import { AppNotification, CommunicationService } from '../../services/communication.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationDetailDialogComponent } from '../../components/notification-detail-dialog/notification-detail-dialog.component';

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
  private readonly dialog = inject(MatDialog);

  activeTab: TabKey = 'inbox';
  statusFilter: StatusFilter = 'all';
  loading = false;
  inbox: AppNotification[] = [];
  sent: AppNotification[] = [];
  unreadCount = 0;
  canCompose = false;
  private sub?: Subscription;

  async ngOnInit(): Promise<void> {
    // ✅ FIXED: unwrap observable to get role
    const user = await firstValueFrom(this.authService.getCurrentUser());
    const role = user.data?.role ?? '';
    this.canCompose = ['Teacher', 'BranchAdmin', 'SuperAdmin', 'Staff'].includes(role);

    this.loadInbox();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setTab(tab: TabKey): void {
    this.activeTab = tab;
    if (tab === 'inbox') {
      this.loadInbox();
    } else {
      this.loadSent();
    }
  }

  loadInbox(): void {
    this.loading = true;
    this.sub?.unsubscribe();
    this.sub = this.communicationService
      .getNotifications({ status: this.statusFilter, per_page: 50 })
      .subscribe({
        next: (res) => {
          this.inbox = res.data || [];
          this.unreadCount = this.inbox.filter((n) => !n.is_read && !n.read_at).length;
          this.loading = false;
        },
        error: (err) => {
          this.errorHandler.handleError(err);
          this.loading = false;
        }
      });
  }

  loadSent(): void {
    this.loading = true;
    this.sub?.unsubscribe();
    this.sub = this.communicationService.getSentNotifications().subscribe({
      next: (res) => {
        this.sent = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorHandler.handleError(err);
        this.loading = false;
      }
    });
  }

  onStatusChange(): void {
    this.loadInbox();
  }

  markAllRead(): void {
    this.communicationService.markAllAsRead().subscribe({
      next: () => {
        this.errorHandler.showSuccess('All notifications marked as read');
        this.loadInbox();
      },
      error: (err) => this.errorHandler.handleError(err)
    });
  }

  openCompose(): void {
    this.router.navigate(['/communications/notifications/compose']);
  }

  openItem(item: AppNotification, fromSent = false): void {
    if (!fromSent && !item.is_read && !item.read_at) {
      this.communicationService.markNotificationAsRead(item.id).subscribe({
        next: () => {
          item.is_read = true;
          item.read_at = new Date().toISOString();
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: () => undefined
      });
    }
    this.dialog.open(NotificationDetailDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { notification: item, fromSent }
    });
  }

  trackById(_: number, item: AppNotification): string | number {
    return item.id;
  }

  displayDate(item: AppNotification): string {
    return item.date || item.sent_at || item.created_at || '';
  }

  sourceLabel(item: AppNotification): string {
    const s = (item.source || item.type || 'info').toLowerCase();
    if (s === 'custom') return 'Message';
    if (s === 'assignment') return 'Assignment';
    if (s === 'attendance' || s === 'attendance_notify') return 'Attendance';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
