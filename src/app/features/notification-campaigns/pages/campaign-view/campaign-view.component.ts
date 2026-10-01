import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { NotificationCampaignService } from '../../services/notification-campaign.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-campaign-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './campaign-view.component.html',
  styleUrls: ['./campaign-view.component.scss']
})
export class CampaignViewComponent implements OnInit {
  loading = true;
  campaign: any = null;

  recipientColumns = ['student', 'class', 'status', 'delivery', 'viewed', 'liked'];
  recipientDataSource = new MatTableDataSource<any>([]);
  recipientSearch = '';

  @ViewChild('recipientPaginator')
  set recipientPaginatorRef(paginator: MatPaginator | undefined) {
    if (!paginator) {
      return;
    }
    this.recipientDataSource.paginator = paginator;
    paginator.length = this.recipientDataSource.filteredData.length;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaigns: NotificationCampaignService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/notification-campaigns']);
      return;
    }
    this.campaigns.show(id).subscribe({
      next: response => {
        this.campaign = response.data;
        this.setupRecipientsTable();
        this.loading = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  back(): void {
    this.router.navigate(['/notification-campaigns'], {
      queryParams: { tab: this.campaign?.module || 'attendance' }
    });
  }

  moduleIcon(module: string): string {
    const icons: Record<string, string> = {
      attendance: 'fact_check',
      exams: 'assignment',
      fees: 'payments',
      holidays: 'event',
      assignments: 'assignment_turned_in'
    };
    return icons[module] || 'campaign';
  }

  moduleLabel(module: string): string {
    return (module || 'notification').replace(/^\w/, c => c.toUpperCase());
  }

  campaignStatusClass(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'status-sent';
    if (value === 'failed') return 'status-failed';
    if (value === 'partial') return 'status-partial';
    if (value === 'sending') return 'status-pending';
    return 'status-pending';
  }

  campaignStatusLabel(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'Sent';
    if (value === 'failed') return 'Failed';
    if (value === 'partial') return 'Partial';
    if (value === 'sending') return 'Sending';
    return 'Pending';
  }

  deliveryStatusClass(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'badge-success';
    if (value === 'failed') return 'badge-danger';
    return 'badge-warning';
  }

  statusKeyLabel(key: string): string {
    if (!key) return '—';
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  statusKeyClass(key: string): string {
    const value = (key || '').toLowerCase();
    if (value === 'present') return 'status-present';
    if (value === 'absent') return 'status-absent';
    if (value === 'leave') return 'status-leave';
    if (value === 'overdue') return 'status-absent';
    if (value === 'due') return 'status-leave';
    if (value === 'scheduled') return 'status-neutral';
    if (value === 'result') return 'status-present';
    return 'status-neutral';
  }

  targetClassLabel(target: { class_name?: string; grade?: string; section?: string }): string {
    const name = target.class_name || (target.grade ? `Grade ${target.grade}` : '');
    return `${name}${target.section ? ` · Section ${target.section}` : ''}`.trim();
  }

  recipientClassName(row: { class_name?: string; grade?: string }): string {
    return row.class_name || (row.grade ? `Grade ${row.grade}` : '—');
  }

  recipientSection(row: { section?: string }): string {
    return row.section ? `Section ${row.section}` : '—';
  }

  recipientClassLine(row: { class_name?: string; grade?: string; section?: string }): string {
    const name = this.recipientClassName(row);
    const section = row.section ? `Section ${row.section}` : '';
    if (name === '—' && !section) {
      return '—';
    }
    return [name, section].filter(Boolean).join(' · ');
  }

  studentInitial(name: string): string {
    const trimmed = (name || '').trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
  }

  statRate(part: number, total: number): number {
    if (!total || total <= 0) {
      return 0;
    }
    return Math.round((part / total) * 100);
  }

  applyRecipientFilter(value: string): void {
    this.recipientDataSource.filter = (value || '').trim().toLowerCase();
    const paginator = this.recipientDataSource.paginator;
    if (paginator) {
      paginator.length = this.recipientDataSource.filteredData.length;
      paginator.firstPage();
    }
  }

  filteredRecipientCount(): number {
    return this.recipientDataSource.filteredData.length;
  }

  private setupRecipientsTable(): void {
    this.recipientDataSource.data = this.campaign?.recipients || [];
    const paginator = this.recipientDataSource.paginator;
    if (paginator) {
      paginator.length = this.recipientDataSource.filteredData.length;
      paginator.firstPage();
    }
    this.recipientDataSource.filterPredicate = (row, filter) => {
      const haystack = [
        row.student_name,
        this.recipientClassName(row),
        row.section,
        row.status_key,
        row.delivery_status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(filter);
    };
  }

}
