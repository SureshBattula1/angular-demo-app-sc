import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BranchService } from '../../../branches/services/branch.service';
import { Branch } from '../../../../core/models/branch.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SmsGatewaySettingsComponent } from '../sms-gateway-settings/sms-gateway-settings.component';
import { SmsTemplatesPageComponent } from '../sms-templates-page/sms-templates-page.component';
import { SmsTabPageComponent } from '../sms-tab-page/sms-tab-page.component';
import { WhatsAppTabPageComponent } from '../whatsapp-tab-page/whatsapp-tab-page.component';

export type BulkMgmtTab = 'dashboard' | 'sms' | 'whatsapp' | 'accounts' | 'templates';

@Component({
  selector: 'app-bulk-management-shell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SmsGatewaySettingsComponent,
    SmsTemplatesPageComponent,
    SmsTabPageComponent,
    WhatsAppTabPageComponent
  ],
  templateUrl: './bulk-management-shell.component.html',
  styleUrls: ['./bulk-management-shell.component.scss']
})
export class BulkManagementShellComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  activeTab: BulkMgmtTab = 'dashboard';
  private loadedTabs = new Set<BulkMgmtTab>(['dashboard']);

  branches: Branch[] = [];
  /** True when API allows seeing all branches (e.g. SuperAdmin). */
  canViewAllBranches = false;
  /** Shared branch context for SMS / Account tabs (beside channel toggles). */
  bulkBranchId: number | string = '';
  dashboardBranch: number | string = '';
  dashboardPeriod = new FormControl('month');
  dashboardCustomFrom = new FormControl<Date | null>(null);
  dashboardCustomTo = new FormControl<Date | null>(null);

  /** Placeholder stats until APIs exist */
  dashboardStats = {
    sms_queued: 0,
    whatsapp_queued: 0,
    account_jobs: 0,
    completed_today: 0
  };

  /** Placeholder rows for SMS user/recipient status (wire to API later). */
  smsUserStatusColumns: string[] = ['user', 'phone', 'lastSms', 'status'];
  smsUserStatusRows: {
    user: string;
    phone: string;
    lastSms: string;
    status: string;
    statusClass: string;
  }[] = [];

  whatsappTemplate = '';

  /** Sub-header inside Account Management: SMS settings vs WhatsApp settings. */
  accountSubChannel: 'sms' | 'whatsapp' = 'sms';

  /** Sub-tab under WhatsApp settings (e.g. Configurations). */
  whatsappAccountTab: 'config' = 'config';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private branchService: BranchService
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const t = params['tab'] as BulkMgmtTab | undefined;
      if (t && ['dashboard', 'sms', 'whatsapp', 'accounts', 'templates'].includes(t)) {
        this.switchTab(t, false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBranches(): void {
    this.branchService
      .getBranches({ is_active: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: res => {
        if (res.success && res.data) {
          this.branches = res.data;
          this.canViewAllBranches = !!res.can_view_all_branches;
          if (
            (this.bulkBranchId === '' || this.bulkBranchId == null) &&
            res.data.length > 0
          ) {
            this.bulkBranchId = res.data[0].id;
          }
        }
      },
      error: () => {
        this.branches = [];
      }
    });
  }

  switchTab(tab: BulkMgmtTab, updateUrl = true): void {
    this.activeTab = tab;
    if (!this.loadedTabs.has(tab)) {
      this.loadedTabs.add(tab);
    }
    if (updateUrl) {
      const qp: Record<string, string | null> = { tab };
      if (tab !== 'sms') {
        qp['smsQueue'] = null;
        qp['smsBranch'] = null;
      }
      if (tab !== 'whatsapp') {
        qp['waQueue'] = null;
        qp['waBranch'] = null;
      }
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: qp,
        queryParamsHandling: 'merge'
      });
    }
  }

  isTabLoaded(tab: BulkMgmtTab): boolean {
    return this.loadedTabs.has(tab);
  }

  onDashboardFilterChange(): void {
    // Hook for future bulk dashboard API
  }

  onDashboardCustomRangeChange(): void {
    this.onDashboardFilterChange();
  }

  /** Reserved for SMS reports API when bulk branch changes. */
  onBulkBranchChange(): void {
    // Child SMS settings uses externalBranchId binding; ngOnChanges reloads config.
  }
}
