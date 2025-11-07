import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  returnUrl = '/dashboard';
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess('Login successful! Welcome back.');
          
          // Check if user is a student and redirect to their profile
          if (response.user && response.user.role === 'Student') {
            console.log('Student login detected, fetching student record...');
            // Get student ID by user_id and redirect to their profile
            this.authService.getStudentByUserId(response.user.id).subscribe({
              next: (studentResponse: any) => {
                console.log('Student response:', studentResponse);
                if (studentResponse.success && studentResponse.data) {
                  console.log('Redirecting to student view:', studentResponse.data.id);
                  // Use replaceUrl to prevent going back to login
                  this.router.navigate(['/students/view', studentResponse.data.id], {
                    queryParams: { studentView: 'true' },
                    replaceUrl: true
                  });
                } else {
                  // Show error if student record not found
                  this.errorHandler.showError('Student profile not found. Please contact administrator.');
                  this.authService.logout().subscribe();
                }
              },
              error: (err) => {
                console.error('Error fetching student:', err);
                // Show error instead of fallback
                this.errorHandler.showError('Failed to load student profile. Please contact administrator.');
                this.authService.logout().subscribe();
              }
            });
          } else {
            // For non-student users, navigate to returnUrl
            this.router.navigate([this.returnUrl]);
          }
        } else {
          this.errorHandler.showError(response.message || 'Login failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      email: 'Email',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}

