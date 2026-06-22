import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeService } from '../../services/fee.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-fee-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './fee-payment-form.component.html',
  styleUrls: ['./fee-payment-form.component.scss']
})
export class FeePaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  filterForm!: FormGroup;
  isLoading = false;
  returnTab = 'payments';
  
  students: any[] = [];
  filteredStudents: any[] = [];
  feeStructures: any[] = [];
  selectedStudent: any = null;
  selectedFeeStructure: any = null;
  
  branches: any[] = [];
  grades: any[] = [];
  sections: any[] = [];
  loadingGrades = false;
  loadingSections = false;
  
  paymentMethods = [
    { value: 'Cash', label: 'Cash', icon: 'money' },
    { value: 'Card', label: 'Debit/Credit Card', icon: 'credit_card' },
    { value: 'Online', label: 'Online Transfer', icon: 'cloud_upload' },
    { value: 'Cheque', label: 'Cheque', icon: 'receipt' },
    { value: 'Other', label: 'Other', icon: 'more_horiz' }
  ];
  
  paymentStatuses = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Partial', label: 'Partial Payment' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Refunded', label: 'Refunded' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private feeService: FeeService,
    private studentService: StudentCrudService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    
    // Get return tab from query params
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'] || 'payments';
    });
  }
  
  initForm(): void {
    // Filter form for branch, grade, section
    this.filterForm = this.fb.group({
      branch_id: [null, Validators.required],
      grade: [null, Validators.required],
      section: [null]
    });
    
    // Payment form
    this.paymentForm = this.fb.group({
      student_id: [null, Validators.required],
      fee_structure_id: [null, Validators.required],
      amount_paid: [0, [Validators.required, Validators.min(0)]],
      payment_date: [this.getTodayDate(), Validators.required],
      payment_method: ['Cash', Validators.required],
      transaction_id: [''],
      discount_amount: [0, Validators.min(0)],
      late_fee: [0, Validators.min(0)],
      payment_status: ['Completed', Validators.required],
      remarks: ['']
    });
    
    // Watch branch changes to load branch-specific grades
    this.filterForm.get('branch_id')?.valueChanges.subscribe((branchId) => {
      this.filterForm.get('grade')?.setValue(null, { emitEvent: false });
      this.filterForm.get('section')?.setValue(null, { emitEvent: false });
      this.grades = [];
      this.sections = [];
      this.loadGrades(branchId);
      this.resetStudentSelection();
    });
    
    this.filterForm.get('grade')?.valueChanges.subscribe(() => {
      this.filterForm.get('section')?.setValue(null, { emitEvent: false });
      this.loadSections();
      this.resetStudentSelection();
    });
    
    // Watch for section changes to filter students
    this.filterForm.get('section')?.valueChanges.subscribe(() => {
      this.filterStudents();
    });
    
    // Watch for student selection to load their fee structures
    this.paymentForm.get('student_id')?.valueChanges.subscribe(studentId => {
      if (studentId) {
        this.loadStudentFeeStructures(studentId);
      }
    });
    
    // Watch for fee structure selection to enable validation
    this.paymentForm.get('fee_structure_id')?.valueChanges.subscribe(feeStructureId => {
      if (feeStructureId) {
        this.selectedFeeStructure = this.feeStructures.find(f => f.id === feeStructureId);
        this.validatePaymentAmount();
      } else {
        this.selectedFeeStructure = null;
      }
    });
    
    // Watch for amount changes to auto-determine payment status
    this.paymentForm.get('amount_paid')?.valueChanges.subscribe(() => {
      this.validatePaymentAmount();
    });
    
    this.paymentForm.get('discount_amount')?.valueChanges.subscribe(() => {
      this.validatePaymentAmount();
    });
    
    this.paymentForm.get('late_fee')?.valueChanges.subscribe(() => {
      this.validatePaymentAmount();
    });
    
    // Auto-calculate total amount
    this.paymentForm.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }
  
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
      }
    });
  }
  
  loadGrades(branchId?: number | string | null): void {
    if (!branchId) {
      this.grades = [];
      return;
    }
    this.loadingGrades = true;
    // branchId may be an opaque hashid string when HASHIDS_ENABLED is on; never Number() it (→ NaN).
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data;
        } else {
          this.grades = [];
        }
        this.loadingGrades = false;
      },
      error: (error) => {
        this.loadingGrades = false;
        this.grades = [];
        this.errorHandler.showError(error);
      }
    });
  }
  
  loadSections(): void {
    const branchId = this.filterForm.get('branch_id')?.value;
    const grade = this.filterForm.get('grade')?.value;
    
    if (!branchId || !grade) {
      this.sections = [];
      this.filterForm.get('section')?.setValue(null);
      return;
    }
    
    // First check if fee structures exist for this branch/grade combination
    this.checkFeeStructures(branchId, grade);
    
    this.loadingSections = true;
    // Note: SectionService uses 'grade_level' parameter
    this.sectionService.getSections({ 
      branch_id: branchId, 
      grade_level: grade,
      per_page: 1000,
      is_active: true
    }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Double-check is_active filter (already filtered by backend, but safe to filter again)
          this.sections = response.data.filter((s: any) => s.is_active);
        } else {
          this.sections = [];
        }
        this.loadingSections = false;
        
        // Load students after sections are loaded
        this.loadStudents();
      },
      error: () => {
        this.sections = [];
        this.loadingSections = false;
      }
    });
  }
  
  checkFeeStructures(branchId: number, grade: any): void {
    // Check if fee structures exist for this branch/grade
    this.feeService.getFeeStructures({ branch_id: String(branchId), grade: String(grade) }).subscribe({
      next: (response: any) => {
        if (response.success) {
          const feeStructureCount = response.data?.length || 0;
          
          if (feeStructureCount === 0) {
            const gradeLabel = this.getGradeLabel(grade);
            const branch = this.branches.find(b => b.id === branchId);
            const branchName = branch ? branch.name : 'this branch';
            
            this.errorHandler.showWarning(
              `⚠️ No fee structures found for ${gradeLabel} in ${branchName}. ` +
              `Students will appear in the list, but you won't be able to record payments until fee structures are created.`
            );
          }
        }
      },
      error: () => {
        // Ignore error - this is just a warning check
      }
    });
  }
  
  loadStudents(): void {
    const branchId = this.filterForm.get('branch_id')?.value;
    const grade = this.filterForm.get('grade')?.value;
    const section = this.filterForm.get('section')?.value;
    
    if (!branchId || !grade) {
      this.students = [];
      this.filteredStudents = [];
      return;
    }
    
    this.isLoading = true;
    const filters: any = {
      branch_id: branchId,
      grade: grade,
      student_status: 'Active',
      per_page: 500
    };
    if (section) {
      filters.section = section;
    }
    
    this.studentService.getStudents(filters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.students = Array.isArray(response.data) ? response.data : [];
          this.filterStudents();
        } else {
          this.students = [];
          this.filteredStudents = [];
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.students = [];
        this.filteredStudents = [];
        this.isLoading = false;
      }
    });
  }
  
  filterStudents(): void {
    const section = this.filterForm.get('section')?.value;
    
    if (!section) {
      this.filteredStudents = [...this.students];
    } else {
      // API may return section as current_section, section, or section_name
      this.filteredStudents = this.students.filter((student: any) => {
        const s = (student.current_section ?? student.section ?? student.section_name ?? '').toString().trim();
        return s === section;
      });
    }
    
    this.paymentForm.get('student_id')?.setValue(null);
  }
  
  resetStudentSelection(): void {
    this.students = [];
    this.filteredStudents = [];
    this.sections = [];
    this.paymentForm.get('student_id')?.setValue(null);
    this.paymentForm.get('fee_structure_id')?.setValue(null);
    this.feeStructures = [];
  }
  
  loadStudentFeeStructures(studentId: string): void {
    this.isLoading = true;
    
    this.feeService.getStudentFees(studentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.feeStructures = response.data.pending_fees || [];
          this.selectedStudent = response.data;
          
          // Show informative message if no fee structures available for this student
          if (this.feeStructures.length === 0) {
            const student = this.filteredStudents.find(s => (s.user_id || s.id) == studentId);
            const studentName = student ? this.getStudentName(student) : 'this student';
            const grade = this.filterForm.get('grade')?.value;
            const gradeLabel = this.getGradeLabel(grade);
            const branch = this.branches.find(b => b.id === this.filterForm.get('branch_id')?.value);
            const branchName = branch ? branch.name : 'this branch';
            
            this.errorHandler.showInfo(
              `📋 ${studentName} has no pending fees. ` +
              `This could mean: (1) All fees are paid, or (2) No fee structures exist for ${gradeLabel} in ${branchName}. ` +
              `To record a payment, please create fee structures first (Fees → Fee Structures).`
            );
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
      }
    });
  }
  
  calculateTotal(): void {
    const amountPaid = this.paymentForm.get('amount_paid')?.value || 0;
    const lateFee = this.paymentForm.get('late_fee')?.value || 0;
    const total = amountPaid + lateFee;
    // Currently used via getTotalAmount() for UI only
  }
  
  getTotalAmount(): number {
    const amountPaid = this.paymentForm.get('amount_paid')?.value || 0;
    const lateFee = this.paymentForm.get('late_fee')?.value || 0;
    // Discount applies to the fee amount, not this payment amount
    return amountPaid + lateFee;
  }
  
  validatePaymentAmount(): void {
    if (!this.selectedFeeStructure) return;
    
    this.validateAmountWithinMax();
    
    // Get the full fee amount
    const feeAmount = parseFloat(this.selectedFeeStructure.amount || 0);
    // Get amount already paid (from previous partial payments)
    const alreadyPaid = parseFloat((this.selectedFeeStructure as any).amount_paid || 0);
    // Total discount (previous payments + current entry)
    const totalDiscount = this.getTotalDiscountAmount();
    // Remaining amount to be paid BEFORE this payment (after all discounts)
    const remainingAmount = Math.max(0, feeAmount - totalDiscount - alreadyPaid);
    
    const amountPaid = parseFloat(this.paymentForm.get('amount_paid')?.value || 0);
    const lateFee = parseFloat(this.paymentForm.get('late_fee')?.value || 0);
    
    const netAmount = amountPaid + lateFee;
    const remainingBalance = remainingAmount - netAmount;
    
    // Auto-suggest payment status based on amount
    const currentStatus = this.paymentForm.get('payment_status')?.value;
    
    if (netAmount <= 0) {
      // No payment or negative amount
      if (currentStatus !== 'Failed' && currentStatus !== 'Pending') {
        this.paymentForm.get('payment_status')?.setValue('Pending', { emitEvent: false });
      }
    } else if (netAmount < remainingAmount) {
      // Partial payment (not covering full remaining amount)
      if (currentStatus === 'Completed') {
        // Warn user about partial payment marked as completed
        this.errorHandler.showWarning(
          `⚠️ Partial Payment Detected! ` +
          `Fee amount: ₹${feeAmount.toLocaleString('en-IN')}, ` +
          `Already paid: ₹${alreadyPaid.toLocaleString('en-IN')}, ` +
          `Remaining: ₹${remainingAmount.toLocaleString('en-IN')}, ` +
          `Paying now: ₹${netAmount.toLocaleString('en-IN')}, ` +
          `Balance after payment: ₹${remainingBalance.toLocaleString('en-IN')}. ` +
          `Please use "Partial Payment" status instead of "Completed".`
        );
      }
      // Auto-suggest Partial status for partial payments
      if (currentStatus === 'Completed' || !currentStatus || currentStatus === 'Pending') {
        this.paymentForm.get('payment_status')?.setValue('Partial', { emitEvent: false });
      }
    } else if (netAmount >= remainingAmount) {
      // Full payment (covers remaining amount) or overpayment
      if (currentStatus === 'Partial' || currentStatus === 'Pending' || !currentStatus) {
        this.paymentForm.get('payment_status')?.setValue('Completed', { emitEvent: false });
      }
    }
  }
  
  getRemainingBalance(): number {
    if (!this.selectedFeeStructure) return 0;
    
    // Get the full fee amount
    const feeAmount = parseFloat(this.selectedFeeStructure.amount || 0);
    // Get amount already paid (from previous partial payments)
    const alreadyPaid = parseFloat((this.selectedFeeStructure as any).amount_paid || 0);
    // Total discount (previous + current)
    const totalDiscount = this.getTotalDiscountAmount();
    // Remaining amount BEFORE this payment (after all discounts)
    const remainingAmount = Math.max(0, feeAmount - alreadyPaid - totalDiscount);
    // Get current payment amount
    const netAmount = this.getTotalAmount();
    // Calculate remaining balance after this payment
    return Math.max(0, remainingAmount - netAmount);
  }
  
  getAlreadyPaidAmount(): number {
    if (!this.selectedFeeStructure) return 0;
    return parseFloat((this.selectedFeeStructure as any).amount_paid || 0);
  }

  getPreviousDiscountAmount(): number {
    if (!this.selectedStudent || !this.selectedFeeStructure) return 0;
    const payments = (this.selectedStudent.payments || []) as any[];
    return payments
      .filter(p => String(p.fee_structure_id) === String(this.selectedFeeStructure.id))
      .reduce((sum, p) => sum + (parseFloat(p.discount_amount ?? 0) || 0), 0);
  }

  getTotalDiscountAmount(): number {
    const currentDiscount = parseFloat(this.paymentForm.get('discount_amount')?.value || 0);
    return this.getPreviousDiscountAmount() + currentDiscount;
  }
  
  getRemainingAmountBeforePayment(): number {
    if (!this.selectedFeeStructure) return 0;
    const feeAmount = parseFloat(this.selectedFeeStructure.amount || 0);
    const alreadyPaid = this.getAlreadyPaidAmount();
    const totalDiscount = this.getTotalDiscountAmount();
    return Math.max(0, feeAmount - alreadyPaid - totalDiscount);
  }
  
  getFeeStructureAmount(): number {
    return this.selectedFeeStructure ? parseFloat(this.selectedFeeStructure.amount || 0) : 0;
  }
  
  isPartialPayment(): boolean {
    if (!this.selectedFeeStructure) return false;
    
    const remainingAmount = this.getRemainingAmountBeforePayment();
    const netAmount = this.getTotalAmount();
    
    return netAmount > 0 && netAmount < remainingAmount;
  }

  /** Max allowed: Remaining Before Payment + Late Fee (late fee is acceptable) */
  getMaxAllowedAmount(): number {
    const remaining = this.getRemainingAmountBeforePayment();
    const lateFee = parseFloat(this.paymentForm.get('late_fee')?.value || 0);
    return remaining + lateFee;
  }

  /** Amount Paid exceeds max (Remaining + Late Fee) */
  isAmountExceedsMax(): boolean {
    const amountPaid = parseFloat(this.paymentForm.get('amount_paid')?.value || 0);
    return amountPaid > this.getMaxAllowedAmount();
  }

  private validateAmountWithinMax(): void {
    const ctrl = this.paymentForm.get('amount_paid');
    if (!ctrl || !this.selectedFeeStructure) return;
    if (this.isAmountExceedsMax()) {
      ctrl.setErrors({ ...ctrl.errors, overAmount: true });
    } else if (ctrl.hasError('overAmount')) {
      const { overAmount, ...rest } = ctrl.errors || {};
      ctrl.setErrors(Object.keys(rest).length ? rest : null);
    }
  }
  
  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched(this.paymentForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.validateAmountWithinMax();
    if (this.isAmountExceedsMax()) {
      const max = this.getMaxAllowedAmount();
      const remaining = this.getRemainingAmountBeforePayment();
      const lateFee = parseFloat(this.paymentForm.get('late_fee')?.value || 0);
      this.errorHandler.showWarning(
        `You entered more than the actual amount. Maximum allowed: ₹${max.toLocaleString('en-IN')} (Remaining: ₹${remaining.toLocaleString('en-IN')} + Late Fee: ₹${lateFee.toLocaleString('en-IN')})`
      );
      return;
    }
    
    // Validate partial payment logic
    const paymentStatus = this.paymentForm.get('payment_status')?.value;
    if (this.isPartialPayment() && paymentStatus === 'Completed') {
      const alreadyPaid = this.getAlreadyPaidAmount();
      const remainingBefore = this.getRemainingAmountBeforePayment();
      const confirmed = confirm(
        `⚠️ WARNING: This is a partial payment!\n\n` +
        `Fee Amount: ₹${this.getFeeStructureAmount().toLocaleString('en-IN')}\n` +
        `Already Paid: ₹${alreadyPaid.toLocaleString('en-IN')}\n` +
        `Remaining: ₹${remainingBefore.toLocaleString('en-IN')}\n` +
        `Paying Now: ₹${this.getTotalAmount().toLocaleString('en-IN')}\n` +
        `Balance After Payment: ₹${this.getRemainingBalance().toLocaleString('en-IN')}\n\n` +
        `You've marked this as "Completed" but it's only a partial payment. ` +
        `The fee will be removed from pending list even though ₹${this.getRemainingBalance().toLocaleString('en-IN')} is still due.\n\n` +
        `Are you sure you want to mark this as "Completed"?`
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    this.isLoading = true;
    const formData = this.paymentForm.value;
    if (formData.payment_date instanceof Date) {
      formData.payment_date = formData.payment_date.toISOString().split('T')[0];
    }
    
    this.feeService.recordPayment(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess('Payment recorded successfully');
          this.router.navigate(['/fees'], {
            queryParams: { tab: this.returnTab }
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }
  
  onCancel(): void {
    this.router.navigate(['/fees'], {
      queryParams: { tab: this.returnTab }
    });
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
  
  private getTodayDate(): Date {
    return new Date();
  }
  
  getStudentName(student: any): string {
    const firstName = student.first_name || student.user?.first_name || '';
    const lastName = student.last_name || student.user?.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }
  
  getGradeLabel(gradeValue: any): string {
    const grade = this.grades.find(g => g.value === gradeValue);
    return grade ? grade.label : `Grade ${gradeValue}`;
  }
  
  getErrorMessage(fieldName: string): string {
    const control = this.paymentForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['min'].min}`;
    }

    if (control?.hasError('overAmount') && fieldName === 'amount_paid') {
      const max = this.getMaxAllowedAmount();
      return `You entered more than the actual amount. Maximum allowed: ₹${max.toLocaleString('en-IN')} (Remaining + Late Fee)`;
    }
    
    return '';
  }
  
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      student_id: 'Student',
      fee_structure_id: 'Fee Type',
      amount_paid: 'Amount',
      payment_date: 'Payment Date',
      payment_method: 'Payment Method',
      payment_status: 'Payment Status'
    };
    return labels[fieldName] || fieldName;
  }
}


