import { Injectable } from '@angular/core';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

export type SmsProvider = 'twilio' | 'msg91' | 'local_text' | 'nexmo';

export type GatewayConfigChannel = 'sms' | 'whatsapp';

export interface SmsMaskedConfig {
  configured: boolean;
  /** True when this provider is the active gateway for the branch (only one active at a time). */
  is_active?: boolean;
  status: string;
  account_sid?: string | null;
  auth_token_set?: boolean;
  from_number?: string | null;
  /** Twilio WhatsApp sender (channel=whatsapp only). */
  whatsapp_from?: string | null;
  auth_key_set?: boolean;
  sender_id?: string | null;
  username?: string | null;
  hashkey_set?: boolean;
  api_key?: string | null;
  api_secret_set?: boolean;
}

export interface SmsGatewayIndexData {
  branch_id: number;
  branch_name: string;
  /** API returns which channel this payload is for (`sms` default). */
  channel?: GatewayConfigChannel;
  providers: Record<SmsProvider, SmsMaskedConfig>;
}

@Injectable({ providedIn: 'root' })
export class SmsGatewayConfigService {
  constructor(private api: ApiService) {}

  getForBranch(
    branchId: number,
    channel: GatewayConfigChannel = 'sms'
  ): Observable<ApiResponse<SmsGatewayIndexData>> {
    return this.api.get<SmsGatewayIndexData>(`/branches/${branchId}/sms-gateway-config`, {
      channel
    });
  }

  save(
    branchId: number,
    provider: SmsProvider,
    payload: Record<string, string | undefined>,
    channel: GatewayConfigChannel = 'sms'
  ): Observable<ApiResponse<{ provider: SmsProvider; config: SmsMaskedConfig }>> {
    return this.api.put(`/branches/${branchId}/sms-gateway-config`, {
      channel,
      provider,
      ...payload
    });
  }

  /** Send a test SMS or WhatsApp using saved credentials (backend requires Active status). */
  sendTest(
    branchId: number,
    provider: SmsProvider,
    to: string,
    message: string,
    channel: GatewayConfigChannel = 'sms'
  ): Observable<ApiResponse<Record<string, unknown>>> {
    return this.api.post(`/branches/${branchId}/sms-gateway-config/send-test`, {
      channel,
      provider,
      to: to.trim(),
      message: message.trim()
    });
  }
}
