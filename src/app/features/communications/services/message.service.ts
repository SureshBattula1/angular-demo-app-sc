import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface SendMessageRequest {
  mobile_number: string;
  message: string;
}

export interface SendMessageResponse {
  status: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private apiService: ApiService) {}

  /**
   * Send WhatsApp message
   */
  sendWhatsApp(data: SendMessageRequest): Observable<ApiResponse<SendMessageResponse>> {
    return this.apiService.post<SendMessageResponse>('/send-whatsapp', data);
  }

  /**
   * Send SMS message
   */
  sendSms(data: SendMessageRequest): Observable<ApiResponse<SendMessageResponse>> {
    return this.apiService.post<SendMessageResponse>('/send-sms', data);
  }

  /**
   * Send both WhatsApp and SMS
   */
  sendBoth(data: SendMessageRequest): Observable<ApiResponse<SendMessageResponse>> {
    return this.apiService.post<SendMessageResponse>('/send-both', data);
  }
}

