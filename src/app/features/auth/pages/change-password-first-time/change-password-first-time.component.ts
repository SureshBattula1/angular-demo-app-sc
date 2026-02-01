import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-change-password-first-time',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterModule],
  templateUrl: './change-password-first-time.component.html',
  styleUrls: ['./change-password-first-time.component.scss']
})
export class ChangePasswordFirstTimeComponent implements OnInit, OnDestroy {
  passwordChangeForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  otpSent = false;
  otpVerified = false;
  otpExpiresIn = 600; // 10 minutes in seconds
  countdown = 0;
  canResendOtp = false;
  isVerifyingOtp = false;
  private countdownSubscription?: Subscription;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.initForm();
    // Don't auto-request OTP, user will click "Request OTP" button
  }

  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  private initForm(): void {
    this.passwordChangeForm = this.fb.group({
      otp: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{6}$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  requestOtp(): void {
    this.isLoading = true;
    this.authService.requestPasswordChangeOtp().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.otpSent = true;
          // Convert expires_in to number (backend returns number, but ApiResponse types it as string)
          this.otpExpiresIn = typeof response.expires_in === 'number' 
            ? response.expires_in 
            : (response.expires_in ? parseInt(response.expires_in, 10) : 600);
          this.countdown = this.otpExpiresIn;
          this.canResendOtp = false;
          this.startCountdown();
          this.errorHandler.showSuccess('OTP sent successfully to your registered phone number');
        } else {
          this.errorHandler.showError(response.message || 'Failed to send OTP');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleError(error);
      }
    });
  }

  isRequestingOtp = false;

  requestOtpOnly(): void {
    this.isRequestingOtp = true;
    this.authService.requestPasswordChangeOtp().subscribe({
      next: (response) => {
        this.isRequestingOtp = false;
        if (response.success) {
          this.otpSent = true;
          // Convert expires_in to number (backend returns number, but ApiResponse types it as string)
          this.otpExpiresIn = typeof response.expires_in === 'number' 
            ? response.expires_in 
            : (response.expires_in ? parseInt(response.expires_in, 10) : 600);
          this.countdown = this.otpExpiresIn;
          this.canResendOtp = false;
          this.startCountdown();
          this.errorHandler.showSuccess('OTP sent successfully to your registered phone number');
        } else {
          this.errorHandler.showError(response.message || 'Failed to send OTP');
        }
      },
      error: (error) => {
        this.isRequestingOtp = false;
        this.errorHandler.handleError(error);
      }
    });
  }

  resendOtp(): void {
    if (!this.canResendOtp || this.isRequestingOtp) {
      return;
    }
    this.otpVerified = false; // Reset verification when resending
    this.requestOtpOnly();
  }

  startCountdown(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }

    this.countdownSubscription = interval(1000).subscribe(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        this.canResendOtp = true;
        if (this.countdownSubscription) {
          this.countdownSubscription.unsubscribe();
        }
      }
    });
  }

  getCountdownMinutes(): number {
    return Math.floor(this.countdown / 60);
  }

  getCountdownSeconds(): number {
    return this.countdown % 60;
  }

  verifyOtp(): void {
    const otpControl = this.passwordChangeForm.get('otp');
    if (!otpControl || otpControl.invalid) {
      otpControl?.markAsTouched();
      this.errorHandler.showError('Please enter a valid 6-digit OTP');
      return;
    }

    this.isVerifyingOtp = true;
    const otp = otpControl.value;

    this.authService.verifyOtpOnly(otp).subscribe({
      next: (response) => {
        this.isVerifyingOtp = false;
        if (response.success) {
          this.otpVerified = true;
          this.errorHandler.showSuccess('OTP verified successfully! You can now change your password.');
        } else {
          this.otpVerified = false;
          this.errorHandler.showError(response.message || 'Invalid or expired OTP');
        }
      },
      error: (error) => {
        this.isVerifyingOtp = false;
        this.otpVerified = false;
        this.errorHandler.handleError(error);
      }
    });
  }

  onSubmit(): void {
    if (this.passwordChangeForm.invalid) {
      this.markFormGroupTouched(this.passwordChangeForm);
      return;
    }

    if (!this.otpVerified) {
      this.errorHandler.showError('Please verify OTP first');
      return;
    }

    this.isLoading = true;
    const formData = {
      otp: this.passwordChangeForm.get('otp')?.value,
      password: this.passwordChangeForm.get('password')?.value,
      password_confirmation: this.passwordChangeForm.get('password_confirmation')?.value
    };

    this.authService.verifyOtpAndChangePassword(
      formData.otp,
      formData.password,
      formData.password_confirmation
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess('Password changed successfully! Redirecting to dashboard...');
          
          // Update user in auth service
          this.authService.getCurrentUser().subscribe({
            next: () => {
              // Redirect to dashboard after 2 seconds
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 2000);
            },
            error: () => {
              // Still redirect even if user fetch fails
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 2000);
            }
          });
        } else {
          this.errorHandler.showError(response.message || 'Failed to change password');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleError(error);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.passwordChangeForm.get(field);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(field)} is required`;
    }
    
    if (field === 'otp' && control?.hasError('pattern')) {
      return 'OTP must be 6 digits';
    }
    
    if (field === 'password') {
      if (control?.hasError('minlength')) {
        return 'Password must be at least 8 characters';
      }
      if (control?.hasError('pattern')) {
        return 'Password must contain uppercase, lowercase, number and special character';
      }
    }
    
    if (field === 'password_confirmation' && control?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      otp: 'OTP',
      password: 'Password',
      password_confirmation: 'Confirm Password'
    };
    return labels[field] || field;
  }

  navigateToLogin(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
