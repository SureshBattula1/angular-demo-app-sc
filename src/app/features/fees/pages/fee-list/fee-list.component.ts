import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { FeeService } from '../../services/fee.service';
import { FeeTypeService } from '../../services/fee-type.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FeeStructure, FeePayment, FeeType } from '../../../../core/models/fee.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MaterialModule, 
    DataTableComponent,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule
  ],
  templateUrl: './fee-list.component.html',
  styleUrls: ['./fee-list.component.scss']
})
export class FeeListComponent implements OnInit {
  @ViewChild('structuresTable') structuresTable!: DataTableComponent;
  @ViewChild('paymentsTable') paymentsTable!: DataTableComponent;
  @ViewChild('feeTypesTable') feeTypesTable!: DataTableComponent;
  
  loading = false;
  activeTab: 'today' | 'structures' | 'payments' | 'types' = 'today'; // Default to today's payments
  
  // Track which tabs have been loaded for lazy loading
  private loadedTabs = new Set<string>();
  
  // Separate data arrays for each tab
  todayPaymentsDashboard: any = null;
  feeStructures: FeeStructure[] = [];
  feePayments: FeePayment[] = [];
  feeTypes: FeeType[] = [];
  selectedRecords: (FeeStructure | FeePayment | FeeType)[] = [];
  
  // Counts for tab badges
  todayPaymentCount = 0;
  structureCount = 0;
  paymentCount = 0;
  feeTypeCount = 0;
  
  // Current filters for each tab
  todayPaymentFilters: Record<string, unknown> = {};
  structureFilters: Record<string, unknown> = {};
  paymentFilters: Record<string, unknown> = {};
  feeTypeFilters: Record<string, unknown> = {};
  branches: any[] = [];
  grades: any[] = [];
  sections: any[] = [];
  selectedBranch: string | number | null = null;
  
  // Date range filters (similar to dashboard)
  selectedPeriod = new FormControl('today');
  customFromDate = new FormControl();
  customToDate = new FormControl();
  
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
    serverSide: true,
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
    serverSide: true,
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
        options: [] // Will be populated dynamically from API
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
  
  todayPaymentsSearchConfig: AdvancedSearchConfig = {
    title: 'Filter Today\'s Payments',
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
        label: 'Class/Grade',
        type: 'select',
        icon: 'school',
        options: []
      },
      {
        key: 'section',
        label: 'Section',
        type: 'select',
        icon: 'class',
        options: []
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
    serverSide: true,
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
    this.loadBranches();
    this.loadGrades();
    this.loadSections();
    this.loadFeeTypesForFilter();
    
    // Check query parameters to restore active tab
    this.route.queryParams.subscribe(params => {
      // Check for returnTab first (when coming back from view/edit), then tab
      const targetTab = params['returnTab'] || params['tab'];
      
      if (targetTab === 'today') {
        this.activeTab = 'today';
      } else if (targetTab === 'payments') {
        this.activeTab = 'payments';
      } else if (targetTab === 'types') {
        this.activeTab = 'types';
      } else if (targetTab === 'structures') {
        this.activeTab = 'structures';
      } else {
        this.activeTab = 'today'; // Default to today's payments
      }
      
      // Mark the initial tab as loaded
      this.loadedTabs.add(this.activeTab);
    });
    
    // Load data for the active tab only (lazy loading)
    this.loadActiveTabData();
    
    // Listen to period changes for today's payments tab
    this.selectedPeriod.valueChanges.subscribe(() => {
      if (this.activeTab === 'today') {
        this.loadTodayPayments();
      }
    });
  }
  
  // Check if a tab has been loaded (for lazy loading)
  isTabLoaded(tab: string): boolean {
    return this.loadedTabs.has(tab);
  }

  // Tab switching method
  switchTab(tab: 'today' | 'structures' | 'payments' | 'types'): void {
    this.activeTab = tab;
    
    // Mark tab as loaded for lazy loading
    this.loadedTabs.add(tab);
    
    // Update URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    
    // Load data for the tab
    this.loadActiveTabData();
  }
  
  // Load data for active tab only
  private loadActiveTabData(): void {
    if (this.activeTab === 'today') {
      this.loadTodayPayments();
    } else if (this.activeTab === 'structures') {
      this.loadFeeStructures();
    } else if (this.activeTab === 'payments') {
      this.loadFeePayments();
    } else if (this.activeTab === 'types') {
      this.loadFeeTypes();
    }
  }

  // Load fee structures
  loadFeeStructures(filters: Record<string, any> = {}): void {
    this.loading = true;
    this.structureFilters = { ...this.structureFilters, ...filters };
    
    this.feeService.getFeeStructures(this.structureFilters).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Transform data to add grade_label and amount_formatted
          this.feeStructures = (response.data || []).map((structure: any) => {
            const gradeObj = this.grades.find((g: any) => g.value === structure.grade);
            return {
              ...structure,
              grade_label: gradeObj ? gradeObj.label : `Grade ${structure.grade}`,
              amount_formatted: `₹${structure.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
            };
          });
          
          if (response.meta) {
            this.structuresTableConfig = { ...this.structuresTableConfig, totalCount: response.meta.total };
            this.structureCount = response.meta.total;
          } else {
            this.structureCount = this.feeStructures.length;
            this.structuresTableConfig = { ...this.structuresTableConfig, totalCount: this.structureCount };
          }
        } else {
          this.feeStructures = [];
          this.structureCount = 0;
          this.structuresTableConfig = { ...this.structuresTableConfig, totalCount: 0 };
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.feeStructures = [];
        this.structureCount = 0;
        this.structuresTableConfig = { ...this.structuresTableConfig, totalCount: 0 };
        this.loading = false;
      }
    });
  }

  // Load today's payments dashboard
  loadTodayPayments(filters: Record<string, any> = {}): void {
    this.loading = true;
    
    // Build filters with date range
    const dateFilters: Record<string, any> = {
      period: this.selectedPeriod.value || 'today'
    };
    
    // Add custom date range if selected
    if (this.selectedPeriod.value === 'custom') {
      if (this.customFromDate.value) {
        dateFilters['from_date'] = this.formatDate(this.customFromDate.value);
      }
      if (this.customToDate.value) {
        dateFilters['to_date'] = this.formatDate(this.customToDate.value);
      }
    }
    
    // Merge with existing filters
    this.todayPaymentFilters = { ...this.todayPaymentFilters, ...filters, ...dateFilters };
    
    this.feeService.getTodayPayments(this.todayPaymentFilters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.todayPaymentsDashboard = response.data;
          this.todayPaymentCount = response.data.summary?.total_count || 0;
        } else {
          this.todayPaymentsDashboard = null;
          this.todayPaymentCount = 0;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.todayPaymentsDashboard = null;
        this.todayPaymentCount = 0;
        this.loading = false;
      }
    });
  }

  onBranchFilterChange(): void {
    const filters: Record<string, any> = {};
    if (this.selectedBranch) {
      filters['branch_id'] = this.selectedBranch;
    }
    this.loadTodayPayments(filters);
  }

  // Load fee payments
  loadFeePayments(filters: Record<string, any> = {}): void {
    this.loading = true;
    this.paymentFilters = { ...this.paymentFilters, ...filters };
    
    this.feeService.getFeePayments(this.paymentFilters).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Transform data to add student_name, fee_type_name, and amount_formatted
          this.feePayments = (response.data || []).map((payment: any) => {
            // Get student name from relationship
            const studentName = payment.student 
              ? `${payment.student.first_name || ''} ${payment.student.last_name || ''}`.trim()
              : 'N/A';
            
            // Get fee type from fee_structure relationship
            const feeTypeName = payment.fee_structure?.fee_type || 'N/A';
            
            // Format amount
            const amountFormatted = `₹${payment.amount_paid?.toLocaleString('en-IN', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) || '0.00'}`;
            
            return {
              ...payment,
              student_name: studentName,
              fee_type_name: feeTypeName,
              amount_formatted: amountFormatted
            };
          });
          
          if (response.meta) {
            this.paymentsTableConfig = { ...this.paymentsTableConfig, totalCount: response.meta.total };
            this.paymentCount = response.meta.total;
          } else {
            this.paymentCount = this.feePayments.length;
            this.paymentsTableConfig = { ...this.paymentsTableConfig, totalCount: this.paymentCount };
          }
        } else {
          this.feePayments = [];
          this.paymentCount = 0;
          this.paymentsTableConfig = { ...this.paymentsTableConfig, totalCount: 0 };
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.feePayments = [];
        this.paymentCount = 0;
        this.paymentsTableConfig = { ...this.paymentsTableConfig, totalCount: 0 };
        this.loading = false;
      }
    });
  }

  // Load fee types
  loadFeeTypes(filters: Record<string, any> = {}): void {
    this.loading = true;
    this.feeTypeFilters = { ...this.feeTypeFilters, ...filters };
    
    this.feeTypeService.getFeeTypes(this.feeTypeFilters).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.feeTypes = response.data || [];
          
          if (response.meta) {
            this.feeTypesTableConfig = { ...this.feeTypesTableConfig, totalCount: response.meta.total };
            this.feeTypeCount = response.meta.total;
          } else {
            this.feeTypeCount = this.feeTypes.length;
            this.feeTypesTableConfig = { ...this.feeTypesTableConfig, totalCount: this.feeTypeCount };
          }
        } else {
          this.feeTypes = [];
          this.feeTypeCount = 0;
          this.feeTypesTableConfig = { ...this.feeTypesTableConfig, totalCount: 0 };
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.feeTypes = [];
        this.feeTypeCount = 0;
        this.feeTypesTableConfig = { ...this.feeTypesTableConfig, totalCount: 0 };
        this.loading = false;
      }
    });
  }
  
  getStructureColumns(): TableColumn[] {
    return [
      // { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'grade_label', header: 'Grade', sortable: true, searchable: true, width: '120px' },
      { key: 'fee_type', header: 'Fee Type', sortable: true, searchable: true, width: '150px' },
      { key: 'amount_formatted', header: 'Amount', sortable: true, width: '120px', align: 'right' },
      { key: 'academic_year', header: 'Academic Year', sortable: true, width: '130px' },
      { key: 'due_date', header: 'Due Date', type: 'date', sortable: true, width: '120px' },
      { key: 'is_active', header: 'Status', type: 'badge', width: '100px', align: 'center' }
    ];
  }
  
  getPaymentColumns(): TableColumn[] {
    return [
      { key: 'receipt_number', header: 'Receipt No.', sortable: true, searchable: true, width: '140px' },
      { key: 'payment_date', header: 'Payment Date', type: 'date', sortable: true, width: '130px' },
      { key: 'student_name', header: 'Student', sortable: true, searchable: true, width: '200px' },
      { key: 'fee_type_name', header: 'Fee Type', sortable: true, width: '150px' },
      { key: 'amount_formatted', header: 'Amount', sortable: true, width: '120px', align: 'right' },
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
          
          // Update today's payments search config with branches
          const todayBranchField = this.todayPaymentsSearchConfig.fields.find(f => f.key === 'branch_id');
          if (todayBranchField) {
            todayBranchField.options = branchOptions;
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
          this.grades = response.data;
          const gradeOptions = response.data.map(grade => ({
            value: grade.value,
            label: grade.label
          }));
          
          // Update structure search config
          const structureGradeField = this.structuresSearchConfig.fields.find(f => f.key === 'grade');
          if (structureGradeField) {
            structureGradeField.options = gradeOptions;
          }
          
          // Update today's payments search config
          const todayGradeField = this.todayPaymentsSearchConfig.fields.find(f => f.key === 'grade');
          if (todayGradeField) {
            todayGradeField.options = gradeOptions;
          }
        }
      },
      error: (error) => {
      }
    });
  }

  /**
   * Load sections dynamically (for filtering)
   */
  loadSections(): void {
    // Sections are typically loaded based on selected grade
    // For now, we'll create a method that can be called when grade changes
    // Common sections: A, B, C, D, etc.
    this.sections = [
      { value: 'A', label: 'Section A' },
      { value: 'B', label: 'Section B' },
      { value: 'C', label: 'Section C' },
      { value: 'D', label: 'Section D' },
      { value: 'E', label: 'Section E' }
    ];
    
    const sectionOptions = this.sections.map(section => ({
      value: section.value,
      label: section.label
    }));
    
    // Update today's payments search config
    const todaySectionField = this.todayPaymentsSearchConfig.fields.find(f => f.key === 'section');
    if (todaySectionField) {
      todaySectionField.options = sectionOptions;
    }
  }

  /**
   * Load fee types for advanced search filter
   */
  loadFeeTypesForFilter(): void {
    this.feeTypeService.getFeeTypes({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const feeTypeOptions = response.data.map((feeType: any) => ({
            value: feeType.name,
            label: feeType.name
          }));
          
          // Update structure search config with fee types
          const structureFeeTypeField = this.structuresSearchConfig.fields.find(f => f.key === 'fee_type');
          if (structureFeeTypeField) {
            structureFeeTypeField.options = feeTypeOptions;
          }
        }
      },
      error: (error) => {
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
    }
  }
  
  // Structure Actions
  addFeeStructure(): void {
    this.router.navigate(['/fees/structure/create'], {
      queryParams: { returnTab: this.activeTab }
    });
  }
  
  viewStructure(structure: FeeStructure): void {
    this.router.navigate(['/fees/structure/view', structure.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }
  
  editStructure(structure: FeeStructure): void {
    this.router.navigate(['/fees/structure/edit', structure.id], {
      queryParams: { returnTab: this.activeTab }
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
      queryParams: { returnTab: this.activeTab }
    });
  }
  
  viewPayment(payment: FeePayment): void {
    this.router.navigate(['/fees/payment/view', payment.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }
  
  printReceipt(payment: FeePayment): void {
    this.errorHandler.showInfo('Opening receipt for printing...');
    // Implement print logic
  }
  
  onRowClick(row: FeeStructure | FeePayment | FeeType): void {
    if (this.activeTab === 'today') {
      this.viewPayment(row as FeePayment);
    } else if (this.activeTab === 'structures') {
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
    
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    
    this.loadFeeStructures(filters);
  }
  
  onPaymentsSearch(event: SearchEvent): void {
    
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    
    this.loadFeePayments(filters);
  }
  
  onFeeTypesSearch(event: SearchEvent): void {
    
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    
    this.loadFeeTypes(filters);
  }
  
  onSearchReset(): void {
    // Load fresh data for active tab
    if (this.activeTab === 'today') {
      this.todayPaymentFilters = {};
      this.selectedPeriod.setValue('today');
      this.customFromDate.setValue(null);
      this.customToDate.setValue(null);
      this.loadTodayPayments();
    } else if (this.activeTab === 'structures') {
      this.structureFilters = {};
      this.loadFeeStructures();
    } else if (this.activeTab === 'payments') {
      this.paymentFilters = {};
      this.loadFeePayments();
    } else {
      this.feeTypeFilters = {};
      this.loadFeeTypes();
    }
  }
  
  /**
   * Handle custom date range change
   */
  onCustomRangeChange(): void {
    if (this.customFromDate.value && this.customToDate.value) {
      this.loadTodayPayments();
    }
  }
  
  /**
   * Format date to YYYY-MM-DD format
   */
  formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
  
  // Pagination handlers
  onStructurePaginationChange(event: PaginationEvent): void {
    this.loadFeeStructures({
      page: event.page + 1,
      per_page: event.pageSize
    });
  }
  
  onPaymentPaginationChange(event: PaginationEvent): void {
    this.loadFeePayments({
      page: event.page + 1,
      per_page: event.pageSize
    });
  }
  
  onFeeTypePaginationChange(event: PaginationEvent): void {
    this.loadFeeTypes({
      page: event.page + 1,
      per_page: event.pageSize
    });
  }
  
  // Sort handlers
  onStructureSortChange(event: SortEvent): void {
    this.loadFeeStructures({
      sort_by: event.field,
      sort_direction: event.direction
    });
  }
  
  onPaymentSortChange(event: SortEvent): void {
    this.loadFeePayments({
      sort_by: event.field,
      sort_direction: event.direction
    });
  }
  
  onFeeTypeSortChange(event: SortEvent): void {
    this.loadFeeTypes({
      sort_by: event.field,
      sort_direction: event.direction
    });
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
    }
  }

  addFeeType(): void {
    this.router.navigate(['/fees/type/create'], {
      queryParams: { returnTab: this.activeTab }
    });
  }
  
  viewFeeType(feeType: FeeType): void {
    this.router.navigate(['/fees/type/view', feeType.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }
  
  editFeeType(feeType: FeeType): void {
    this.router.navigate(['/fees/type/edit', feeType.id], {
      queryParams: { returnTab: this.activeTab }
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
