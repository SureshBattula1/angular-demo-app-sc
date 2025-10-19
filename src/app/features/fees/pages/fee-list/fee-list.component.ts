import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { FeeService } from '../../services/fee.service';
import { FeeTypeService } from '../../services/fee-type.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FeeStructure, FeePayment, FeeType } from '../../../../core/models/fee.model';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  template: `
    <div class="page-container">
      <!-- Tabbed Interface -->
      <div class="tabs-container">
        <!-- Tab Header -->
        <div class="tabs-header">
          <button 
            class="tab-item" 
            [class.active]="activeTab === 'structures'"
            (click)="switchTab('structures')">
            <div class="tab-label-full">
              <mat-icon>account_balance</mat-icon>
              Fee Structures
              <span class="tab-badge" *ngIf="structureCount > 0">{{ structureCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>account_balance</mat-icon>
              Structures
              <span class="tab-badge" *ngIf="structureCount > 0">{{ structureCount }}</span>
            </div>
          </button>
          
          <button 
            class="tab-item" 
            [class.active]="activeTab === 'payments'"
            (click)="switchTab('payments')">
            <div class="tab-label-full">
              <mat-icon>receipt_long</mat-icon>
              Fee Payments
              <span class="tab-badge" *ngIf="paymentCount > 0">{{ paymentCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>receipt_long</mat-icon>
              Payments
              <span class="tab-badge" *ngIf="paymentCount > 0">{{ paymentCount }}</span>
            </div>
          </button>
          
          <button 
            class="tab-item" 
            [class.active]="activeTab === 'types'"
            (click)="switchTab('types')">
            <div class="tab-label-full">
              <mat-icon>category</mat-icon>
              Fee Types
              <span class="tab-badge" *ngIf="feeTypeCount > 0">{{ feeTypeCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>category</mat-icon>
              Types
              <span class="tab-badge" *ngIf="feeTypeCount > 0">{{ feeTypeCount }}</span>
            </div>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tabs-content">
          <!-- Fee Structures Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'structures'">
            <app-data-table
              #structuresTable
              [data]="feeStructures"
              [config]="structuresTableConfig"
              [advancedSearchConfig]="structuresSearchConfig"
              [title]="'Fee Structures'"
              [loading]="loading"
              (actionClicked)="onStructureAction($event)"
              (rowClicked)="onRowClick($event)"
              (selectionChanged)="onSelectionChange($event)"
              (exportClicked)="onStructureExport($event)"
              (searchChanged)="onSearchChange($event)"
              (advancedSearchChanged)="onStructuresSearch($event)"
              (searchResetEvent)="onSearchReset()">
            </app-data-table>
          </div>

          <!-- Fee Payments Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'payments'">
            <app-data-table
              #paymentsTable
              [data]="feePayments"
              [config]="paymentsTableConfig"
              [advancedSearchConfig]="paymentsSearchConfig"
              [title]="'Fee Payments'"
              [loading]="loading"
              (actionClicked)="onPaymentAction($event)"
              (rowClicked)="onRowClick($event)"
              (selectionChanged)="onSelectionChange($event)"
              (exportClicked)="onPaymentExport($event)"
              (searchChanged)="onSearchChange($event)"
              (advancedSearchChanged)="onPaymentsSearch($event)"
              (searchResetEvent)="onSearchReset()">
            </app-data-table>
          </div>

          <!-- Fee Types Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'types'">
            <app-data-table
              #feeTypesTable
              [data]="feeTypes"
              [config]="feeTypesTableConfig"
              [advancedSearchConfig]="feeTypesSearchConfig"
              [title]="'Fee Types'"
              [loading]="loading"
              (actionClicked)="onFeeTypeAction($event)"
              (rowClicked)="onRowClick($event)"
              (selectionChanged)="onSelectionChange($event)"
              (exportClicked)="onFeeTypeExport($event)"
              (searchChanged)="onSearchChange($event)"
              (advancedSearchChanged)="onFeeTypesSearch($event)"
              (searchResetEvent)="onSearchReset()">
            </app-data-table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-container { max-width: 1600px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 16px; background: var(--card-background); border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
    .header-content h1 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px 0; font-size: 28px; font-weight: 600; color: var(--text-primary); }
    .header-content h1 mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--primary-color); }
    .subtitle { margin: 0; color: var(--text-secondary); font-size: 14px; }
    @media (max-width: 960px) {
      .page-container { padding: 16px; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .header-actions { width: 100%; }
      .header-actions button { width: 100%; }
    }
  `]
})
export class FeeListComponent implements OnInit {
  @ViewChild('structuresTable') structuresTable!: DataTableComponent;
  @ViewChild('paymentsTable') paymentsTable!: DataTableComponent;
  @ViewChild('feeTypesTable') feeTypesTable!: DataTableComponent;
  
  loading = false;
  activeTab: 'structures' | 'payments' | 'types' = 'structures';
  
  // Separate data arrays for each tab
  feeStructures: FeeStructure[] = [];
  feePayments: FeePayment[] = [];
  feeTypes: FeeType[] = [];
  selectedRecords: (FeeStructure | FeePayment | FeeType)[] = [];
  
  // Counts for tab badges
  structureCount = 0;
  paymentCount = 0;
  feeTypeCount = 0;
  
  // Current filters
  currentFilters: Record<string, unknown> = {};
  branches: any[] = [];
  grades: any[] = [];
  
  // Separate table configurations
  structuresTableConfig: TableConfig = {
    columns: this.getStructureColumns(),
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
  
  paymentsTableConfig: TableConfig = {
    columns: this.getPaymentColumns(),
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
  
  // Separate search configurations
  structuresSearchConfig: AdvancedSearchConfig = {
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
        options: []
      },
      {
        key: 'grade',
        label: 'Grade',
        type: 'select',
        icon: 'school',
        options: []
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
        ]
      },
      {
        key: 'academic_year',
        label: 'Academic Year',
        type: 'text',
        icon: 'event',
        placeholder: '2024-2025'
      },
      {
        key: 'is_active',
        label: 'Status',
        type: 'select',
        icon: 'check_circle',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' }
        ]
      }
    ]
  };
  
  paymentsSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Payment Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        icon: 'business',
        options: []
      },
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
        ]
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
        ]
      },
      {
        key: 'from_date',
        label: 'From Date',
        type: 'date',
        icon: 'event'
      },
      {
        key: 'to_date',
        label: 'To Date',
        type: 'date',
        icon: 'event'
      }
    ]
  };

  feeTypesTableConfig: TableConfig = {
    columns: this.getFeeTypeColumns(),
    actions: [
      { icon: 'visibility', label: 'View', action: (row) => this.viewFeeType(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editFeeType(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteFeeType(row) },
      { icon: 'toggle_on', label: 'Toggle Status', color: 'accent', action: (row) => this.toggleFeeTypeStatus(row) }
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

  feeTypesSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Fee Type Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        icon: 'business',
        options: []
      },
      {
        key: 'is_active',
        label: 'Status',
        type: 'select',
        icon: 'check_circle',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' }
        ]
      },
      {
        key: 'is_mandatory',
        label: 'Type',
        type: 'select',
        icon: 'label',
        options: [
          { value: 'true', label: 'Mandatory' },
          { value: 'false', label: 'Optional' }
        ]
      },
      {
        key: 'is_refundable',
        label: 'Refundable',
        type: 'select',
        icon: 'currency_exchange',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ]
      }
    ]
  };
  
  constructor(
    private feeService: FeeService,
    private feeTypeService: FeeTypeService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    // Check query parameters to restore active tab
    this.route.queryParams.subscribe(params => {
      const tabType = params['tab'];
      if (tabType === 'payments') {
        this.activeTab = 'payments';
      } else if (tabType === 'types') {
        this.activeTab = 'types';
      } else {
        this.activeTab = 'structures'; // Default to structures
      }
      console.log('Active tab set to:', this.activeTab);
    });
    
    this.loadBranches();
    this.loadGrades();
    this.loadFeeStructures();
    this.loadFeePayments();
    this.loadFeeTypes();
  }

  // Tab switching method
  switchTab(tab: 'structures' | 'payments' | 'types'): void {
    this.activeTab = tab;
    console.log('Switched to tab:', tab);
  }

  // Load fee structures
  loadFeeStructures(filters: Record<string, any> = {}): void {
    this.loading = true;
    
    this.feeService.getFeeStructures(filters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.feeStructures = response.data;
          this.structureCount = this.feeStructures.length;
          this.structuresTableConfig.totalCount = this.structureCount;
        } else {
          this.feeStructures = [];
          this.structureCount = 0;
          this.structuresTableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.feeStructures = [];
        this.structureCount = 0;
        this.structuresTableConfig.totalCount = 0;
        this.loading = false;
      }
    });
  }

  // Load fee payments
  loadFeePayments(filters: Record<string, any> = {}): void {
    this.loading = true;
    
    this.feeService.getFeePayments(filters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.feePayments = response.data;
          this.paymentCount = this.feePayments.length;
          this.paymentsTableConfig.totalCount = this.paymentCount;
        } else {
          this.feePayments = [];
          this.paymentCount = 0;
          this.paymentsTableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.feePayments = [];
        this.paymentCount = 0;
        this.paymentsTableConfig.totalCount = 0;
        this.loading = false;
      }
    });
  }

  // Load fee types
  loadFeeTypes(filters: Record<string, any> = {}): void {
    this.loading = true;
    
    this.feeTypeService.getFeeTypes(filters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.feeTypes = response.data;
          this.feeTypeCount = this.feeTypes.length;
          this.feeTypesTableConfig.totalCount = this.feeTypeCount;
        } else {
          this.feeTypes = [];
          this.feeTypeCount = 0;
          this.feeTypesTableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.feeTypes = [];
        this.feeTypeCount = 0;
        this.feeTypesTableConfig.totalCount = 0;
        this.loading = false;
      }
    });
  }
  
  getStructureColumns(): TableColumn[] {
    return [
      // { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'grade', header: 'Grade', sortable: true, searchable: true, width: '100px' },
      { key: 'fee_type', header: 'Fee Type', sortable: true, searchable: true, width: '130px' },
      { key: 'amount', header: 'Amount', sortable: true, width: '120px', align: 'right' },
      { key: 'academic_year', header: 'Academic Year', sortable: true, width: '130px' },
      { key: 'due_date', header: 'Due Date', type: 'date', sortable: true, width: '120px' },
      { key: 'is_active', header: 'Status', type: 'badge', width: '100px', align: 'center' }
    ];
  }
  
  getPaymentColumns(): TableColumn[] {
    return [
      { key: 'receipt_number', header: 'Receipt No.', sortable: true, searchable: true, width: '140px' },
      { key: 'payment_date', header: 'Payment Date', type: 'date', sortable: true, width: '130px' },
      { key: 'student_name', header: 'Student', sortable: true, searchable: true },
      { key: 'fee_type', header: 'Fee Type', sortable: true, width: '120px' },
      { key: 'amount_paid', header: 'Amount', sortable: true, width: '110px', align: 'right' },
      { key: 'payment_method', header: 'Method', sortable: true, width: '100px' },
      { key: 'payment_status', header: 'Status', type: 'badge', width: '120px', align: 'center' }
    ];
  }

  getFeeTypeColumns(): TableColumn[] {
    return [
      // { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'name', header: 'Fee Type Name', sortable: true, searchable: true },
      { key: 'code', header: 'Code', sortable: true, searchable: true, width: '120px' },
      { key: 'branch.name', header: 'Branch', sortable: true, width: '150px' },
      { key: 'is_mandatory', header: 'Mandatory', type: 'badge', width: '110px', align: 'center' },
      { key: 'is_refundable', header: 'Refundable', type: 'badge', width: '110px', align: 'center' },
      { key: 'is_active', header: 'Status', type: 'badge', width: '100px', align: 'center' }
    ];
  }

  /**
   * Load branches dynamically
   */
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
          
          const branchOptions = this.branches.map((b: any) => ({
            value: b.id.toString(),
            label: b.name
          }));
          
          // Update structure search config with branches
          const structureBranchField = this.structuresSearchConfig.fields.find(f => f.key === 'branch_id');
          if (structureBranchField) {
            structureBranchField.options = branchOptions;
          }
          
          // Update payment search config with branches
          const paymentBranchField = this.paymentsSearchConfig.fields.find(f => f.key === 'branch_id');
          if (paymentBranchField) {
            paymentBranchField.options = branchOptions;
          }
          
          // Update fee type search config with branches
          const feeTypeBranchField = this.feeTypesSearchConfig.fields.find(f => f.key === 'branch_id');
          if (feeTypeBranchField) {
            feeTypeBranchField.options = branchOptions;
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  /**
   * Load grades dynamically
   */
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const gradeOptions = response.data.map(grade => ({
            value: grade.value,
            label: grade.label
          }));
          
          // Update structure search config
          const structureGradeField = this.structuresSearchConfig.fields.find(f => f.key === 'grade');
          if (structureGradeField) {
            structureGradeField.options = gradeOptions;
          }
        }
      },
      error: (error) => {
        console.error('Error loading grades:', error);
      }
    });
  }
  
  // Structure tab actions
  onStructureAction(event: { action: string; row: any }): void {
    const structure = event.row as FeeStructure;
    
    switch (event.action) {
      case 'View':
        this.viewStructure(structure);
        break;
      case 'Edit':
        this.editStructure(structure);
        break;
      case 'Delete':
        this.deleteStructure(structure);
        break;
      case 'add':
        this.addFeeStructure();
        break;
      default:
        console.log('Unknown structure action:', event.action);
    }
  }

  // Payment tab actions
  onPaymentAction(event: { action: string; row: any }): void {
    const payment = event.row as FeePayment;
    
    switch (event.action) {
      case 'View Receipt':
        this.viewPayment(payment);
        break;
      case 'Print':
        this.printReceipt(payment);
        break;
      case 'add':
        this.recordPayment();
        break;
      default:
        console.log('Unknown payment action:', event.action);
    }
  }
  
  // Structure Actions
  addFeeStructure(): void {
    this.router.navigate(['/fees/structure/create'], {
      queryParams: { tab: 'structures' }
    });
  }
  
  viewStructure(structure: FeeStructure): void {
    this.router.navigate(['/fees/structure/view', structure.id], {
      queryParams: { tab: 'structures' }
    });
  }
  
  editStructure(structure: FeeStructure): void {
    this.router.navigate(['/fees/structure/edit', structure.id], {
      queryParams: { tab: 'structures' }
    });
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
    this.router.navigate(['/fees/payment/create'], {
      queryParams: { tab: 'payments' }
    });
  }
  
  viewPayment(payment: FeePayment): void {
    this.router.navigate(['/fees/payment/view', payment.id], {
      queryParams: { tab: 'payments' }
    });
  }
  
  printReceipt(payment: FeePayment): void {
    this.errorHandler.showInfo('Opening receipt for printing...');
    // Implement print logic
  }
  
  onRowClick(row: FeeStructure | FeePayment | FeeType): void {
    if (this.activeTab === 'structures') {
      this.viewStructure(row as FeeStructure);
    } else if (this.activeTab === 'payments') {
      this.viewPayment(row as FeePayment);
    } else {
      this.viewFeeType(row as FeeType);
    }
  }
  
  onSelectionChange(selected: (FeeStructure | FeePayment | FeeType)[]): void {
    this.selectedRecords = selected;
  }
  
  onStructureExport(format: string): void {
    this.errorHandler.showInfo(`Exporting fee structures as ${format.toUpperCase()}...`);
  }
  
  onPaymentExport(format: string): void {
    this.errorHandler.showInfo(`Exporting fee payments as ${format.toUpperCase()}...`);
  }
  
  onSearchChange(query: string): void {
    // Handle basic search - load data for active tab
    if (this.activeTab === 'structures') {
      this.loadFeeStructures({ search: query });
    } else if (this.activeTab === 'payments') {
      this.loadFeePayments({ search: query });
    } else {
      this.loadFeeTypes({ search: query });
    }
  }
  
  onStructuresSearch(event: SearchEvent): void {
    console.log('Advanced search changed:', event);
    
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query
    };
    
    this.loadFeeStructures(filters);
  }
  
  onPaymentsSearch(event: SearchEvent): void {
    console.log('Advanced search changed:', event);
    
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query
    };
    
    this.loadFeePayments(filters);
  }
  
  onFeeTypesSearch(event: SearchEvent): void {
    console.log('Advanced search changed:', event);
    
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query
    };
    
    this.loadFeeTypes(filters);
  }
  
  onSearchReset(): void {
    // Load fresh data for active tab
    if (this.activeTab === 'structures') {
      this.loadFeeStructures();
    } else if (this.activeTab === 'payments') {
      this.loadFeePayments();
    } else {
      this.loadFeeTypes();
    }
  }

  onFeeTypeExport(format: string): void {
    this.errorHandler.showInfo(`Exporting fee types as ${format.toUpperCase()}...`);
  }

  // Fee Type Actions
  onFeeTypeAction(event: { action: string; row: any }): void {
    const feeType = event.row as FeeType;
    
    switch (event.action) {
      case 'View':
        this.viewFeeType(feeType);
        break;
      case 'Edit':
        this.editFeeType(feeType);
        break;
      case 'Delete':
        this.deleteFeeType(feeType);
        break;
      case 'Toggle Status':
        this.toggleFeeTypeStatus(feeType);
        break;
      case 'add':
        this.addFeeType();
        break;
      default:
        console.log('Unknown fee type action:', event.action);
    }
  }

  addFeeType(): void {
    this.router.navigate(['/fees/type/create'], {
      queryParams: { tab: 'types' }
    });
  }
  
  viewFeeType(feeType: FeeType): void {
    this.router.navigate(['/fees/type/view', feeType.id], {
      queryParams: { tab: 'types' }
    });
  }
  
  editFeeType(feeType: FeeType): void {
    this.router.navigate(['/fees/type/edit', feeType.id], {
      queryParams: { tab: 'types' }
    });
  }
  
  deleteFeeType(feeType: FeeType): void {
    if (confirm(`Are you sure you want to delete the fee type "${feeType.name}"? This action cannot be undone.`)) {
      this.feeTypeService.deleteFeeType(feeType.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Fee type deleted successfully');
            this.loadFeeTypes();
          } else {
            this.errorHandler.showError(response.message || 'Failed to delete fee type');
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  toggleFeeTypeStatus(feeType: FeeType): void {
    this.feeTypeService.toggleStatus(feeType.id!).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess(`Fee type ${feeType.is_active ? 'deactivated' : 'activated'} successfully`);
          this.loadFeeTypes();
        } else {
          this.errorHandler.showError(response.message || 'Failed to toggle status');
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
      }
    });
  }
}
