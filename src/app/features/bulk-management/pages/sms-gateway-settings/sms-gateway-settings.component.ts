import { Component, OnInit, OnChanges, SimpleChanges, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { BranchService } from '../../../branches/services/branch.service';
import { Branch } from '../../../../core/models/branch.model';
import {
  SmsGatewayConfigService,
  SmsProvider,
  SmsGatewayIndexData,
  GatewayConfigChannel
} from '../../services/sms-gateway-config.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';

type ProviderTab = {
  id: SmsProvider;
  label: string;
  brandTitle: string;
  brandSubtitle: string;
  website: string;
};

@Component({
  selector: 'app-sms-gateway-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './sms-gateway-settings.component.html',
  styleUrls: ['./sms-gateway-settings.component.scss']
})
export class SmsGatewaySettingsComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  /** When true, branch is chosen in parent (bulk shell); hide duplicate branch row here. */
  @Input() useExternalBranchFilter = false;

  /** Branch id from parent — kept in sync when parent filter changes. */
  @Input() externalBranchId: number | string | null = null;

  /** `sms` = SMS gateways; `whatsapp` = Twilio WhatsApp-only row (separate DB channel). */
  @Input() configChannel: GatewayConfigChannel = 'sms';

  readonly allProviderTabs: ProviderTab[] = [
    {
      id: 'twilio',
      label: 'Twilio',
      brandTitle: 'twilio',
      brandSubtitle: 'CLOUD COMMUNICATIONS',
      website: 'https://www.twilio.com'
    },
    {
      id: 'msg91',
      label: 'MSG91',
      brandTitle: 'MSG91',
      brandSubtitle: 'Cloud messaging',
      website: 'https://msg91.com'
    },
    {
      id: 'local_text',
      label: 'Text Local',
      brandTitle: 'Textlocal',
      brandSubtitle: 'SMS platform',
      website: 'https://www.textlocal.com'
    },
    {
      id: 'nexmo',
      label: 'Nexmo',
      brandTitle: 'Vonage',
      brandSubtitle: 'APIs for SMS',
      website: 'https://www.vonage.com'
    }
  ];

  get providerTabs(): ProviderTab[] {
    return this.configChannel === 'whatsapp'
      ? this.allProviderTabs.filter(t => t.id === 'twilio')
      : this.allProviderTabs;
  }

  branches: Branch[] = [];
  branchId: number | null = null;
  activeProvider: SmsProvider = 'twilio';
  loading = false;
  saving = false;
  cachedData: SmsGatewayIndexData | null = null;

  twilioForm = this.fb.nonNullable.group({
    account_sid: [''],
    auth_token: [''],
    from_number: [''],
    whatsapp_from: [''],
    status: ['Inactive' as string, Validators.required]
  });

  msg91Form = this.fb.nonNullable.group({
    auth_key: [''],
    sender_id: [''],
    status: ['Inactive', Validators.required]
  });

  localTextForm = this.fb.nonNullable.group({
    username: [''],
    hashkey: [''],
    sender_id: [''],
    status: ['Inactive', Validators.required]
  });

  nexmoForm = this.fb.nonNullable.group({
    api_key: [''],
    api_secret: [''],
    from_number: [''],
    status: ['Inactive', Validators.required]
  });

  statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ];

  hideTwilioToken = true;
  hideMsg91Key = true;
  hideLocalHash = true;
  hideNexmoSecret = true;

  /** Test SMS (uses saved credentials via API). */
  testTo = '';
  testMessage = 'Test SMS from school management.';
  testSending = false;

  constructor(
    private branchService: BranchService,
    private smsConfig: SmsGatewayConfigService,
    private errorHandler: ErrorHandlerService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    if (this.configChannel === 'whatsapp') {
      this.activeProvider = 'twilio';
    }
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: res => {
        if (res.success && res.data?.length) {
          this.branches = res.data;
          this.branchId = this.resolveInitialBranchId(res.data);
          this.loadConfigs();
        }
      },
      error: () => this.errorHandler.showError('Could not load branches')
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.useExternalBranchFilter || !changes['externalBranchId']) {
      return;
    }
    const v = this.externalBranchId;
    if (v === '' || v == null) {
      return;
    }
    const id = Number(v);
    if (isNaN(id) || id === this.branchId) {
      return;
    }
    if (this.branches.some(b => b.id === id)) {
      this.branchId = id;
      this.loadConfigs();
    }
  }

  private resolveInitialBranchId(list: Branch[]): number {
    if (this.useExternalBranchFilter && this.externalBranchId !== '' && this.externalBranchId != null) {
      const id = Number(this.externalBranchId);
      if (!isNaN(id) && list.some(b => b.id === id)) {
        return id;
      }
    }
    return list[0].id;
  }

  canEdit(): boolean {
    return this.permissionService.hasPermission('bulk_management.edit');
  }

  onBranchChange(): void {
    this.loadConfigs();
  }

  selectProvider(p: SmsProvider): void {
    this.activeProvider = p;
    this.applyCachedToForms();
  }

  loadConfigs(): void {
    if (!this.branchId) {
      return;
    }
    this.loading = true;
    this.smsConfig.getForBranch(this.branchId, this.configChannel).subscribe({
      next: res => {
        this.loading = false;
        if (res.success && res.data) {
          this.cachedData = res.data;
          this.applyCachedToForms();
        }
      },
      error: err => {
        this.loading = false;
        this.errorHandler.handleError(err);
      }
    });
  }

  private applyCachedToForms(): void {
    if (!this.cachedData) {
      return;
    }
    const p = this.cachedData.providers;
    const tw = p.twilio;
    if (this.configChannel === 'whatsapp') {
      this.twilioForm.patchValue({
        account_sid: this.valueForForm(tw.account_sid),
        auth_token: '',
        from_number: '',
        whatsapp_from: this.valueForForm(tw.whatsapp_from),
        status: (tw.status as 'Active' | 'Inactive') || 'Inactive'
      });
    } else {
      this.twilioForm.patchValue({
        account_sid: this.valueForForm(tw.account_sid),
        auth_token: '',
        from_number: this.valueForForm(tw.from_number),
        whatsapp_from: '',
        status: (tw.status as 'Active' | 'Inactive') || 'Inactive'
      });
    }

    const m = p.msg91;
    this.msg91Form.patchValue({
      auth_key: '',
      sender_id: this.valueForForm(m.sender_id),
      status: (m.status as 'Active' | 'Inactive') || 'Inactive'
    });

    const lt = p.local_text;
    this.localTextForm.patchValue({
      username: this.valueForForm(lt.username),
      hashkey: '',
      sender_id: this.valueForForm(lt.sender_id),
      status: (lt.status as 'Active' | 'Inactive') || 'Inactive'
    });

    const nx = p.nexmo;
    this.nexmoForm.patchValue({
      api_key: this.valueForForm(nx.api_key),
      api_secret: '',
      from_number: this.valueForForm(nx.from_number),
      status: (nx.status as 'Active' | 'Inactive') || 'Inactive'
    });
  }

  /**
   * API returns masked previews (e.g. ********1234) for secrets/SIDs — show them so the form is not empty.
   * On save, {@link omitIfMaskedOrUnchanged} sends '' for those so the backend keeps stored credentials.
   */
  private valueForForm(v: string | null | undefined): string {
    return v ?? '';
  }

  /** Empty or masked placeholder from API → do not overwrite stored credentials on save. */
  private omitIfMaskedOrUnchanged(v: string | undefined): string {
    const s = v ?? '';
    if (s === '') {
      return '';
    }
    return s.includes('*') ? '' : s;
  }

  save(): void {
    if (!this.branchId || !this.canEdit()) {
      return;
    }

    const provider = this.activeProvider;
    let payload: Record<string, string> = {};
    const cfg = this.cachedData?.providers[provider];
    const isNew = !cfg?.configured;

    if (provider === 'twilio') {
      this.twilioForm.markAllAsTouched();
      if (this.twilioForm.controls.status.invalid) {
        this.errorHandler.showError('Status is required.');
        return;
      }
      const v = this.twilioForm.getRawValue();
      const sidOut = this.omitIfMaskedOrUnchanged(v.account_sid);
      if (this.configChannel === 'whatsapp') {
        const waOut = this.omitIfMaskedOrUnchanged(v.whatsapp_from);
        if (isNew) {
          if (!v.account_sid?.trim() || !v.auth_token?.trim() || !v.whatsapp_from?.trim()) {
            this.errorHandler.showError(
              'Account SID, Auth Token, and WhatsApp sender are required for a new configuration.'
            );
            return;
          }
        }
        payload = {
          account_sid: sidOut,
          auth_token: v.auth_token ?? '',
          from_number: '',
          whatsapp_from: waOut,
          status: v.status
        };
      } else {
        const fromOut = this.omitIfMaskedOrUnchanged(v.from_number);
        if (isNew) {
          if (!v.account_sid?.trim() || !v.auth_token?.trim() || !v.from_number?.trim()) {
            this.errorHandler.showError('All Twilio fields are required for a new configuration.');
            return;
          }
        }
        payload = {
          account_sid: sidOut,
          auth_token: v.auth_token ?? '',
          from_number: fromOut,
          status: v.status
        };
      }
    } else if (provider === 'msg91') {
      this.msg91Form.markAllAsTouched();
      if (this.msg91Form.controls.status.invalid) {
        this.errorHandler.showError('Status is required.');
        return;
      }
      const v = this.msg91Form.getRawValue();
      if (isNew) {
        if (!v.auth_key?.trim() || !v.sender_id?.trim()) {
          this.errorHandler.showError('Auth Key and Sender ID are required for a new configuration.');
          return;
        }
      }
      payload = {
        auth_key: v.auth_key,
        sender_id: v.sender_id,
        status: v.status
      };
    } else if (provider === 'local_text') {
      this.localTextForm.markAllAsTouched();
      if (this.localTextForm.controls.status.invalid) {
        this.errorHandler.showError('Status is required.');
        return;
      }
      const v = this.localTextForm.getRawValue();
      if (isNew) {
        if (!v.username?.trim() || !v.hashkey?.trim() || !v.sender_id?.trim()) {
          this.errorHandler.showError('All Text Local fields are required for a new configuration.');
          return;
        }
      }
      payload = {
        username: v.username,
        hashkey: v.hashkey,
        sender_id: v.sender_id,
        status: v.status
      };
    } else if (provider === 'nexmo') {
      this.nexmoForm.markAllAsTouched();
      if (this.nexmoForm.controls.status.invalid) {
        this.errorHandler.showError('Status is required.');
        return;
      }
      const v = this.nexmoForm.getRawValue();
      const nexmoKeyOut = this.omitIfMaskedOrUnchanged(v.api_key);
      const nexmoFromOut = this.omitIfMaskedOrUnchanged(v.from_number);
      if (isNew) {
        if (!v.api_key?.trim() || !v.api_secret?.trim() || !v.from_number?.trim()) {
          this.errorHandler.showError('All Nexmo fields are required for a new configuration.');
          return;
        }
      }
      payload = {
        api_key: nexmoKeyOut,
        api_secret: v.api_secret ?? '',
        from_number: nexmoFromOut,
        status: v.status
      };
    }

    this.saving = true;
    this.smsConfig.save(this.branchId, provider, payload, this.configChannel).subscribe({
      next: res => {
        this.saving = false;
        if (res.success) {
          this.errorHandler.showSuccess(res.message || 'Saved successfully');
          this.loadConfigs();
        }
      },
      error: err => {
        this.saving = false;
        this.errorHandler.handleError(err);
      }
    });
  }

  sendTestSms(): void {
    if (!this.branchId || !this.canEdit()) {
      return;
    }
    const cfg = this.cachedData?.providers[this.activeProvider];
    if (!cfg?.configured) {
      this.errorHandler.showError('Save this provider’s configuration first.');
      return;
    }
    const to = this.testTo?.trim() ?? '';
    const message = this.testMessage?.trim() ?? '';
    if (!to || !message) {
      this.errorHandler.showError('Enter destination number and message.');
      return;
    }
    if (cfg.status !== 'Active') {
      this.errorHandler.showError('Set status to Active and save before sending a test SMS.');
      return;
    }

    this.testSending = true;
    this.smsConfig.sendTest(this.branchId, this.activeProvider, to, message, this.configChannel).subscribe({
      next: res => {
        this.testSending = false;
        if (res.success) {
          this.errorHandler.showSuccess(res.message || 'Test SMS sent.');
        }
      },
      error: err => {
        this.testSending = false;
        this.errorHandler.handleError(err);
      }
    });
  }
}
