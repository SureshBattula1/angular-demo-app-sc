import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { FeeService } from '../../services/fee.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FeeStructure, FeePayment } from '../../../../core/models/fee.model';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  templateUrl: './fee-list.component.html',
  styleUrls: ['./fee-list.component.scss']
})
export class FeeListComponent implements OnInit {
  @ViewChild('structuresTable') structuresTable!: DataTableComponent;
  @ViewChild('paymentsTable') paymentsTable!: DataTableComponent;
  
  selectedTab = 0; // 0 = Structures, 1 = Payments
  loading = false;
  
  // Fee Structures
  feeStructures: FeeStructure[] = [];
  structuresTableConfig!: TableConfig;
  structuresSearchConfig!: AdvancedSearchConfig;
  
  // Fee Payments
  feePayments: FeePayment[] = [];
  paymentsTableConfig!: TableConfig;
  paymentsSearchConfig!: AdvancedSearchConfig;
  
  branches: any[] = [];
  
  constructor(
    private feeService: FeeService,
    private branchService: BranchService,
    private errorHandler: ErrorHandlerService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.initializeStructuresTable();
    this.initializePaymentsTable();
    this.loadBranches();
    this.loadFeeStructures();
  }
  
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
          this.updateBranchFilters();
        }
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
      }
    });
  }
  
  updateBranchFilters(): void {
    const branchOptions = this.branches.map((b: any) => ({
      value: b.id.toString(),
      label: b.name
    }));
    
    // Update structures search config
    const structureBranchField = this.structuresSearchConfig.fields.find(f => f.key === 'branch_id');
    if (structureBranchField) {
      structureBranchField.options = branchOptions;
    }
    
    // Update payments search config
    const paymentBranchField = this.paymentsSearchConfig.fields.find(f => f.key === 'branch_id');
    if (paymentBranchField) {
      paymentBranchField.options = branchOptions;
    }
  }
  
  initializeStructuresTable(): void {
    this.structuresTableConfig = {
      columns: [
        { key: 'id', header: 'ID', sortable: true, width: '120px' },
        { key: 'grade', header: 'Grade', sortable: true, searchable: true, width: '100px' },
        { key: 'fee_type', header: 'Fee Type', sortable: true, searchable: true, width: '130px' },
        { key: 'amount', header: 'Amount', sortable: true, width: '120px', align: 'right' },
        { key: 'academic_year', header: 'Academic Year', sortable: true, width: '130px' },
        { key: 'due_date', header: 'Due Date', type: 'date', sortable: true, width: '120px' },
        { key: 'is_active', header: 'Status', type: 'badge', width: '100px', align: 'center' }
      ],
      actions: [
        { icon: 'visibility', label: 'View', action: (row) => this.viewStructure(row) },
        { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editStructure(row) },
        { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteStructure(row) }
      ],
      selectable: true,
      pagination: true,
      searchable: true,
      advancedSearch: true,
      exportable: true,
      responsive: true,
      serverSide: false,
      totalCount: 0,
      pageSizeOptions: [10, 25, 50, 100],
      defaultPageSize: 25
    };
    
    this.structuresSearchConfig = {
      title: 'Advanced Fee Structure Search',
      width: '500px',
      showReset: true,
      showSaveSearch: false,
      fields: [
        {
          key: 'branch_id',
          label: 'Branch',
          type: 'select',
          icon: 'business',
          options: [],
          group: 'Basic Filters'
        },
        {
          key: 'grade',
          label: 'Grade',
          type: 'select',
          icon: 'school',
          options: Array.from({length: 12}, (_, i) => ({
            value: String(i + 1),
            label: `Grade ${i + 1}`
          })),
          group: 'Basic Filters'
        },
        {
          key: 'fee_type',
          label: 'Fee Type',
          type: 'select',
          icon: 'category',
          options: [
            { value: 'Tuition', label: 'Tuition' },
            { value: 'Library', label: 'Library' },
            { value: 'Laboratory', label: 'Laboratory' },
            { value: 'Sports', label: 'Sports' },
            { value: 'Transport', label: 'Transport' },
            { value: 'Exam', label: 'Exam' },
            { value: 'Other', label: 'Other' }
          ],
          group: 'Basic Filters'
        },
        {
          key: 'academic_year',
          label: 'Academic Year',
          type: 'text',
          icon: 'event',
          placeholder: '2024-2025',
          group: 'Basic Filters'
        }
      ]
    };
  }
  
  initializePaymentsTable(): void {
    this.paymentsTableConfig = {
      columns: [
        { key: 'receipt_number', header: 'Receipt No.', sortable: true, searchable: true, width: '140px' },
        { key: 'payment_date', header: 'Payment Date', type: 'date', sortable: true, width: '130px' },
        { key: 'student_name', header: 'Student', sortable: true, searchable: true },
        { key: 'fee_type', header: 'Fee Type', sortable: true, width: '120px' },
        { key: 'amount_paid', header: 'Amount', sortable: true, width: '110px', align: 'right' },
        { key: 'payment_method', header: 'Method', sortable: true, width: '100px' },
        { key: 'payment_status', header: 'Status', type: 'badge', width: '120px', align: 'center' }
      ],
      actions: [
        { icon: 'visibility', label: 'View Receipt', action: (row) => this.viewPayment(row) },
        { icon: 'print', label: 'Print', color: 'primary', action: (row) => this.printReceipt(row) }
      ],
      selectable: true,
      pagination: true,
      searchable: true,
      advancedSearch: true,
      exportable: true,
      responsive: true,
      serverSide: false,
      totalCount: 0,
      pageSizeOptions: [10, 25, 50, 100],
      defaultPageSize: 25
    };
    
    this.paymentsSearchConfig = {
      title: 'Advanced Payment Search',
      width: '500px',
      showReset: true,
      showSaveSearch: false,
      fields: [
        {
          key: 'payment_status',
          label: 'Payment Status',
          type: 'select',
          icon: 'info',
          options: [
            { value: 'Pending', label: 'Pending' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Failed', label: 'Failed' },
            { value: 'Refunded', label: 'Refunded' }
          ],
          group: 'Status Filters'
        },
        {
          key: 'payment_method',
          label: 'Payment Method',
          type: 'select',
          icon: 'payment',
          options: [
            { value: 'Cash', label: 'Cash' },
            { value: 'Card', label: 'Card' },
            { value: 'Online', label: 'Online' },
            { value: 'Cheque', label: 'Cheque' },
            { value: 'Other', label: 'Other' }
          ],
          group: 'Payment Filters'
        },
        {
          key: 'from_date',
          label: 'From Date',
          type: 'date',
          icon: 'event',
          group: 'Date Range'
        },
        {
          key: 'to_date',
          label: 'To Date',
          type: 'date',
          icon: 'event',
          group: 'Date Range'
        }
      ]
    };
  }
  
  loadFeeStructures(filters?: any): void {
    this.loading = true;
    
    this.feeService.getFeeStructures(filters).subscribe({
      next: (response) => {
        console.log('Fee Structures Response:', response);
        if (response.success && response.data) {
          this.feeStructures = response.data;
          this.structuresTableConfig.totalCount = response.data.length;
          console.log('Loaded fee structures:', this.feeStructures.length);
        } else {
          this.feeStructures = [];
          this.structuresTableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading fee structures:', error);
        this.errorHandler.showError(error);
        this.loading = false;
        this.feeStructures = [];
      }
    });
  }
  
  loadFeePayments(filters?: any): void {
    this.loading = true;
    
    this.feeService.getFeePayments(filters).subscribe({
      next: (response) => {
        console.log('Fee Payments Response:', response);
        if (response.success && response.data) {
          this.feePayments = response.data;
          this.paymentsTableConfig.totalCount = response.data.length;
          console.log('Loaded fee payments:', this.feePayments.length);
        } else {
          this.feePayments = [];
          this.paymentsTableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading fee payments:', error);
        this.errorHandler.showError(error);
        this.loading = false;
        this.feePayments = [];
      }
    });
  }
  
  onTabChange(index: number): void {
    this.selectedTab = index;
    if (index === 0) {
      this.loadFeeStructures();
    } else {
      this.loadFeePayments();
    }
  }
  
  // Structure Actions
  addFeeStructure(): void {
    this.router.navigate(['/fees/structure/create']);
  }
  
  viewStructure(structure: FeeStructure): void {
    this.router.navigate(['/fees/structure/view', structure.id]);
  }
  
  editStructure(structure: FeeStructure): void {
    this.router.navigate(['/fees/structure/edit', structure.id]);
  }
  
  deleteStructure(structure: FeeStructure): void {
    if (confirm(`Are you sure you want to delete this fee structure for Grade ${structure.grade}?`)) {
      this.feeService.deleteFeeStructure(structure.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Fee structure deleted successfully');
            this.loadFeeStructures();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  // Payment Actions
  recordPayment(): void {
    this.router.navigate(['/fees/payment/create']);
  }
  
  viewPayment(payment: FeePayment): void {
    this.router.navigate(['/fees/payment/view', payment.id]);
  }
  
  printReceipt(payment: FeePayment): void {
    this.errorHandler.showInfo('Opening receipt for printing...');
    // Implement print logic
  }
  
  onAction(event: { action: string; row: any }): void {
    if (this.selectedTab === 0) {
      // Fee Structures actions
      const structure = event.row as FeeStructure;
      console.log('Structure action:', event.action, structure);
      // Actions are already handled by individual methods
    } else {
      // Fee Payments actions
      const payment = event.row as FeePayment;
      console.log('Payment action:', event.action, payment);
      // Actions are already handled by individual methods
    }
  }
  
  onStructuresSearch(event: SearchEvent): void {
    this.loadFeeStructures(event.filters);
  }
  
  onPaymentsSearch(event: SearchEvent): void {
    this.loadFeePayments(event.filters);
  }
  
  onStructureExport(format: string): void {
    this.errorHandler.showInfo(`Exporting fee structures as ${format.toUpperCase()}...`);
  }
  
  onPaymentExport(format: string): void {
    this.errorHandler.showInfo(`Exporting fee payments as ${format.toUpperCase()}...`);
  }
}

