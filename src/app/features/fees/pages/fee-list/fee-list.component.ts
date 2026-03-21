import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { FeeService } from '../../services/fee.service';
import { FeeTypeService } from '../../services/fee-type.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';
import { AcademicYearService } from '../../../settings/services/academic-year.service';
import { FeeStructure, FeePayment, FeeType } from '../../../../core/models/fee.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { IndianCurrencyPipe } from '../../../../shared/pipes/indian-currency.pipe';

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
    MatButtonToggleModule,
    IndianCurrencyPipe
  ],
  templateUrl: './fee-list.component.html',
  styleUrls: ['./fee-list.component.scss']
})
export class FeeListComponent implements OnInit, OnDestroy {
  @ViewChild('structuresTable') structuresTable!: DataTableComponent;
  @ViewChild('paymentsTable') paymentsTable!: DataTableComponent;
  @ViewChild('feeTypesTable') feeTypesTable!: DataTableComponent;
  
  loading = false;
  activeTab: 'today' | 'structures' | 'payments' | 'types' = 'today'; // Default to today's payments
  
  // Track which tabs have been loaded for lazy loading
  private loadedTabs = new Set<string>();
  private academicYearSub?: Subscription;
  
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
        options: [],
        dependsOn: 'branch_id'
      },
      {
        key: 'fee_type',
        label: 'Fee Type',
        type: 'select',
        icon: 'category',
        options: [],
        dependsOn: 'branch_id'
      },
      {
        key: 'academic_year_id',
        label: 'Academic Year',
        type: 'select',
        icon: 'event',
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
      // { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteFeeType(row) } // We can enable this only when ever the user want to delete the fee stracture , we have to do that part in the manuavaly 
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
    private academicYearService: AcademicYearService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute,
    private academicYearContext: AcademicYearContextService
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.loadGrades();
    this.loadSections();
    this.loadFeeTypesForFilter();
    this.loadAcademicYearsForFilter();
    this.academicYearSub = this.academicYearContext.selectedYearId$.pipe(skip(1)).subscribe(() => this.loadActiveTabData());
    
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

  ngOnDestroy(): void {
    this.academicYearSub?.unsubscribe();
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
          // Transform data: use API grade_label (branch-specific) when present, else fallback
          this.feeStructures = (response.data || []).map((structure: any) => {
            const gradeLabel = structure.grade_label != null && structure.grade_label !== ''
              ? structure.grade_label
              : (this.grades.find((g: any) => g.value === structure.grade)?.label ?? `Grade ${structure.grade}`);
            return {
              ...structure,
              grade_label: gradeLabel,
              amount_formatted: `₹${structure.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
              is_active_display: this.toBoolean(structure.is_active) ? 'Active' : 'Deactive'
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

    // Apply academic year from top toolbar to keep dashboard (paid + pending) consistent
    const selectedAcademicYear = this.academicYearContext.selectedYear;
    if (selectedAcademicYear?.name) {
      dateFilters['academic_year'] = selectedAcademicYear.name;
    }
    
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
    // Apply academic year from toolbar (context) so list is filtered by selected year
    const academicYearId = this.academicYearContext.selectedYearId;
    const requestFilters = academicYearId != null
      ? { ...this.paymentFilters, academic_year_id: academicYearId }
      : this.paymentFilters;

    this.feeService.getFeePayments(requestFilters).subscribe({
      next: (response: any) => {
        if (response.success) {
            // Transform data to add student_name, fee_type_name, amount_formatted, branch_name
          this.feePayments = (response.data || []).map((payment: any) => {
            const studentName = payment.student 
              ? `${payment.student.first_name || ''} ${payment.student.last_name || ''}`.trim()
              : 'N/A';
            const feeTypeName = payment.fee_structure?.fee_type || 'N/A';
            const branchName = payment.branch_name ?? payment.fee_structure?.branch?.name ?? null;
            const amountFormatted = `₹${payment.amount_paid?.toLocaleString('en-IN', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) || '0.00'}`;
            return {
              ...payment,
              student_name: studentName,
              fee_type_name: feeTypeName,
              branch_name: branchName,
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
    
    // Apply academic year from top toolbar so the list is scoped by selection
    const academicYearId = this.academicYearContext.selectedYearId;
    const requestFilters = academicYearId != null
      ? { ...this.feeTypeFilters, academic_year_id: academicYearId }
      : this.feeTypeFilters;

    this.feeTypeService.getFeeTypes(requestFilters).subscribe({
      next: (response: any) => {
        if (response.success) {
          const raw = response.data || [];
          this.feeTypes = raw.map((item: any) => ({
            ...item,
            is_mandatory: this.toBoolean(item.is_mandatory),
            is_refundable: this.toBoolean(item.is_refundable),
            is_active: this.toBoolean(item.is_active),
            is_mandatory_display: this.toBoolean(item.is_mandatory) ? 'Yes' : 'No',
            is_refundable_display: this.toBoolean(item.is_refundable) ? 'Yes' : 'No',
            is_active_display: this.toBoolean(item.is_active) ? 'Active' : 'Deactive'
            ,
            // Flatten relationship for the table column
            academic_year_name: item?.academicYear?.name ?? item?.academic_year?.name ?? null
          }));
          
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
      { key: 'branch.name', header: 'Branch', sortable: true },
      { key: 'grade_label', header: 'Grade', sortable: true, searchable: true, width: '120px' },
      { key: 'fee_type', header: 'Fee Type', sortable: true, searchable: true, width: '150px' },
      { key: 'amount_formatted', header: 'Amount', sortable: true, width: '120px', align: 'right' },
      { key: 'academic_year', header: 'Academic Year', sortable: true, width: '130px' },
      { key: 'due_date', header: 'Due Date', type: 'date', sortable: true, width: '120px' },
      {
        key: 'is_active_display',
        header: 'Status',
        type: 'badge',
        width: '100px',
        align: 'center',
        cellClass: (row: any) => row?.is_active_display === 'Deactive' ? 'badge-danger' : 'badge-success'
      }
    ];
  }
  
  getPaymentColumns(): TableColumn[] {
    return [
      { key: 'branch_name', header: 'Branch', sortable: true, width: '140px' },
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
      { key: 'code', header: 'Code', sortable: true, searchable: true },
      { key: 'branch.name', header: 'Branch', sortable: true },
      { key: 'academic_year_name', header: 'Academic Year', sortable: false, width: '160px' },
      { key: 'is_mandatory_display', header: 'Mandatory', type: 'badge', width: '110px', align: 'center' },
      { key: 'is_refundable_display', header: 'Refundable', type: 'badge', width: '110px', align: 'center' },
      {
        key: 'is_active_display',
        header: 'Status',
        type: 'badge',
        width: '100px',
        align: 'center',
        cellClass: (row: any) => row?.is_active_display === 'Deactive' ? 'badge-danger' : 'badge-success'
      }
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
          const gradeOptions = response.data.map((grade: any) => ({
            value: grade.value,
            label: grade.label
          }));
          // Structure grade is loaded per-branch via onStructuresSearchFieldChanged
          // Update today's payments search config only
          const todayGradeField = this.todayPaymentsSearchConfig.fields.find(f => f.key === 'grade');
          if (todayGradeField) {
            todayGradeField.options = gradeOptions;
          }
        }
      },
      error: () => {}
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
   * Load fee types for advanced search filter (optionally by branch)
   */
  loadFeeTypesForFilter(branchId?: number | string | null): void {
    const params: Record<string, unknown> = { is_active: true };
    if (branchId) {
      params['branch_id'] = branchId;
    }
    this.feeTypeService.getFeeTypes(params).subscribe({
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

  /**
   * Load academic years for advanced search filter (Fee Structures)
   */
  loadAcademicYearsForFilter(): void {
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const academicYearOptions = response.data.map((ay: any) => ({
            value: ay.id.toString(),
            label: ay.name
          }));
          
          const structureAcademicYearField = this.structuresSearchConfig.fields.find(f => f.key === 'academic_year_id');
          if (structureAcademicYearField) {
            structureAcademicYearField.options = academicYearOptions;
          }
        }
      },
      error: () => {}
    });
  }

  /**
   * When branch changes in structures advanced search, load grades and fee types for that branch
   */
  onStructuresSearchFieldChanged(event: { field: string; value: any }): void {
    if (event.field === 'branch_id' && event.value) {
      const branchId = Number(event.value);
      // Load grades for selected branch
      this.gradeService.getGrades({ branch_id: branchId }).subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            const gradeOptions = response.data.map((g: any) => ({
              value: g.value,
              label: g.label
            }));
            const structureGradeField = this.structuresSearchConfig.fields.find(f => f.key === 'grade');
            if (structureGradeField) {
              structureGradeField.options = gradeOptions;
            }
          }
        },
        error: () => {}
      });
      // Load fee types for selected branch
      this.loadFeeTypesForFilter(branchId);
    }
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
    if (!payment?.id) {
      this.errorHandler.showWarning('Payment information is not available.');
      return;
    }
    this.errorHandler.showInfo('Preparing receipt PDF...');
    this.feeService.downloadFeePaymentReceipt(payment.id).subscribe({
      next: (blob: Blob) => {
        const fileName = (payment.receipt_number ? `fee-receipt-${payment.receipt_number}` : `fee-receipt-${payment.id}`) + '.pdf';
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
        this.errorHandler.showSuccess('Receipt downloaded.');
      },
      error: (err) => this.errorHandler.showError(err),
    });
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
    this.paymentFilters = {
      ...(event.filters || {}),
      search: event.query || undefined,
      page: 1
    };
    this.loadFeePayments();
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
      this.loadFeeStructures({ page: 1 });
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

  /** Normalize API boolean-like values: true/1/'1'/'true' => true */
  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'active';
    }
    return false;
  }
}
