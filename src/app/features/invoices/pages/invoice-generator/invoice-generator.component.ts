import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule} from '@angular/material/divider';
import { InvoiceService } from '../../services/invoice.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-invoice-generator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './invoice-generator.component.html',
  styleUrls: ['./invoice-generator.component.scss']
})
export class InvoiceGeneratorComponent implements OnInit {
  searchForm!: FormGroup;
  invoiceForm!: FormGroup;
  transactions: any[] = [];
  selection = new SelectionModel<any>(true, []);
  searching = false;
  generating = false;
  step: 'search' | 'generate' = 'search';

  displayedColumns = ['select', 'transaction_number', 'party_name', 'description', 'amount', 'transaction_date'];

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    this.searchForm = this.fb.group({
      search_term: [''],  // Student name/roll, Teacher name, Expense name
      type: [''],         // Income or Expense (blank = both)
      from_date: [''],
      to_date: ['']
    });

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);

    this.invoiceForm = this.fb.group({
      customer_name: ['', Validators.required],
      customer_email: ['', Validators.email],
      customer_phone: [''],
      customer_address: [''],
      invoice_date: [today, Validators.required],
      due_date: [dueDate, Validators.required],
      tax_percentage: [0, [Validators.min(0), Validators.max(100)]],
      discount_percentage: [0, [Validators.min(0), Validators.max(100)]],
      notes: ['']
    });
  }

  searchTransactions(): void {
    this.searching = true;
    const params: any = {};
    
    if (this.searchForm.value.search_term) {
      params.search_term = this.searchForm.value.search_term;
    }
    if (this.searchForm.value.type) {
      params.type = this.searchForm.value.type;
    }
    if (this.searchForm.value.from_date) {
      params.from_date = this.formatDate(this.searchForm.value.from_date);
    }
    if (this.searchForm.value.to_date) {
      params.to_date = this.formatDate(this.searchForm.value.to_date);
    }

    console.log('Searching transactions with params:', params);

    this.invoiceService.searchTransactions(params).subscribe({
      next: (response) => {
        console.log('Search response:', response);
        if (response.success) {
          this.transactions = response.data || [];
          this.selection.clear();
          
          const message = this.transactions.length > 0
            ? `Found ${this.transactions.length} transaction(s)`
            : 'No uninvoiced transactions found';
          
          this.errorHandler.showSuccess(message);
        }
        this.searching = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.errorHandler.showError('Failed to search transactions');
        this.searching = false;
      }
    });
  }

  isAllSelected(): boolean {
    return this.transactions.length > 0 && this.selection.selected.length === this.transactions.length;
  }

  masterToggle(): void {
    this.isAllSelected() 
      ? this.selection.clear()
      : this.transactions.forEach(row => this.selection.select(row));
  }

  getSelectedTotal(): number {
    return this.selection.selected.reduce((sum, trans) => sum + parseFloat(trans.amount), 0);
  }

  getTaxAmount(): number {
    const percentage = this.invoiceForm.get('tax_percentage')?.value || 0;
    return (this.getSelectedTotal() * percentage) / 100;
  }

  getDiscountAmount(): number {
    const percentage = this.invoiceForm.get('discount_percentage')?.value || 0;
    return (this.getSelectedTotal() * percentage) / 100;
  }

  getFinalTotal(): number {
    return this.getSelectedTotal() + this.getTaxAmount() - this.getDiscountAmount();
  }

  proceedToGenerate(): void {
    if (this.selection.selected.length === 0) {
      this.errorHandler.showWarning('Please select at least one transaction');
      return;
    }

    // Auto-fill customer name from first transaction
    const firstTrans = this.selection.selected[0];
    this.invoiceForm.patchValue({
      customer_name: firstTrans.party_name
    });

    this.step = 'generate';
  }

  backToSearch(): void {
    this.step = 'search';
  }

  generateInvoice(): void {
    if (this.invoiceForm.invalid) {
      this.errorHandler.showError('Please fill all required fields');
      return;
    }

    this.generating = true;
    const formValue = this.invoiceForm.value;

    const data = {
      transaction_ids: this.selection.selected.map(t => t.id),
      customer_name: formValue.customer_name,
      customer_email: formValue.customer_email,
      customer_phone: formValue.customer_phone,
      customer_address: formValue.customer_address,
      invoice_date: this.formatDate(formValue.invoice_date),
      due_date: this.formatDate(formValue.due_date),
      tax_percentage: formValue.tax_percentage || 0,
      discount_percentage: formValue.discount_percentage || 0,
      notes: formValue.notes
    };

    console.log('Generating invoice with data:', data);

    this.invoiceService.generateFromTransactions(data).subscribe({
      next: (response) => {
        console.log('Generation response:', response);
        if (response.success) {
          this.errorHandler.showSuccess(`Invoice ${response.data?.invoice_number} generated successfully!`);
          this.router.navigate(['/invoices/view', response.data?.id]);
        }
        this.generating = false;
      },
      error: (error) => {
        console.error('Generation error:', error);
        this.errorHandler.showError('Failed to generate invoice');
        this.generating = false;
      }
    });
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  onCancel(): void {
    this.router.navigate(['/invoices']);
  }
}

