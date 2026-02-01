import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { MessageService } from '../../services/message.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-message-sender',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './message-sender.component.html',
  styleUrls: ['./message-sender.component.scss']
})
export class MessageSenderComponent implements OnInit {
  messageForm!: FormGroup;
  isLoading = false;
  sendingType: 'whatsapp' | 'sms' | 'both' | null = null;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.messageForm = this.fb.group({
      mobile_number: ['', [Validators.required, Validators.pattern(/^\+91[6-9]\d{9}$/)]],
      message: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]]
    });
  }

  /**
   * Format mobile number to +91 format
   */
  formatMobileNumber(): void {
    const mobileControl = this.messageForm.get('mobile_number');
    if (mobileControl) {
      let value = mobileControl.value.replace(/\D/g, ''); // Remove non-digits
      
      // If starts with 91, keep it; if starts with 0, remove it; otherwise add 91
      if (value.startsWith('91') && value.length === 12) {
        value = '+' + value;
      } else if (value.startsWith('0')) {
        value = value.substring(1);
      }
      
      // Ensure it starts with +91
      if (!value.startsWith('+91')) {
        if (value.length === 10) {
          value = '+91' + value;
        } else if (value.length > 0 && !value.startsWith('+')) {
          value = '+91' + value;
        }
      }
      
      mobileControl.setValue(value, { emitEvent: false });
    }
  }

  /**
   * Get form control error message
   */
  getErrorMessage(controlName: string): string {
    const control = this.messageForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName === 'mobile_number' ? 'Mobile number' : 'Message'} is required`;
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid mobile number in +91 format (e.g., +919876543210)';
    }
    if (control?.hasError('minlength')) {
      return 'Message must be at least 1 character';
    }
    if (control?.hasError('maxlength')) {
      return 'Message cannot exceed 1000 characters';
    }
    return '';
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return this.messageForm.valid && !this.isLoading;
  }

  /**
   * Send WhatsApp message
   */
  sendWhatsApp(): void {
    if (!this.isFormValid()) {
      this.messageForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.sendingType = 'whatsapp';

    const formData = this.messageForm.value;
    this.messageService.sendWhatsApp(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.sendingType = null;
        if (response.success) {
          this.errorHandler.showSuccess(response.message || 'WhatsApp message sent successfully!');
          this.messageForm.reset();
        } else {
          this.errorHandler.showError(response.message || 'Failed to send WhatsApp message');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.sendingType = null;
        this.errorHandler.showError(error);
      }
    });
  }

  /**
   * Send SMS message
   */
  sendSms(): void {
    if (!this.isFormValid()) {
      this.messageForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.sendingType = 'sms';

    const formData = this.messageForm.value;
    this.messageService.sendSms(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.sendingType = null;
        if (response.success) {
          this.errorHandler.showSuccess(response.message || 'SMS sent successfully!');
          this.messageForm.reset();
        } else {
          this.errorHandler.showError(response.message || 'Failed to send SMS');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.sendingType = null;
        this.errorHandler.showError(error);
      }
    });
  }

  /**
   * Send both WhatsApp and SMS
   */
  sendBoth(): void {
    if (!this.isFormValid()) {
      this.messageForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.sendingType = 'both';

    const formData = this.messageForm.value;
    this.messageService.sendBoth(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.sendingType = null;
        if (response.success) {
          this.errorHandler.showSuccess(response.message || 'Messages sent successfully!');
          this.messageForm.reset();
        } else {
          this.errorHandler.showError(response.message || 'Failed to send messages');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.sendingType = null;
        this.errorHandler.showError(error);
      }
    });
  }
}

