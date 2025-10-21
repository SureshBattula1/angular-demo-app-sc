import { Component, Input, Output, EventEmitter, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { TableColumn, TableAction, TableConfig, SearchCriteria, PaginationEvent, SortEvent, SearchEvent } from './data-table.interface';
import { AdvancedSearchConfig } from '../advanced-search-sidebar/search-field.interface';
import { AdvancedSearchSidebarComponent } from '../advanced-search-sidebar/advanced-search-sidebar.component';
import { ExportButtonComponent, ExportEvent } from '../export-button/export-button.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, SharedModule, AdvancedSearchSidebarComponent, ExportButtonComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() data: any[] = [];
  @Input() config!: TableConfig;
  @Input() advancedSearchConfig?: AdvancedSearchConfig;
  @Input() loading = false;
  @Input() title = '';
  
  @Output() actionClicked = new EventEmitter<{ action: string, row: any }>();
  @Output() rowClicked = new EventEmitter<any>();
  @Output() selectionChanged = new EventEmitter<any[]>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() exportClicked = new EventEmitter<'excel' | 'pdf' | 'csv'>();
  
  // Server-side events
  @Output() paginationChanged = new EventEmitter<PaginationEvent>();
  @Output() sortChanged = new EventEmitter<SortEvent>();
  @Output() advancedSearchChanged = new EventEmitter<SearchEvent>();
  @Output() searchFieldChanged = new EventEmitter<{ field: string, value: any }>();
  @Output() searchResetEvent = new EventEmitter<void>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('searchInput') searchInput?: any;
  
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  displayedColumns: string[] = [];
  
  // Subscriptions for cleanup
  private subscriptions = new Subscription();
  private resizeListener: (() => void) | null = null;
  private sortSubscribed = false;
  private paginatorSubscribed = false;
  
  constructor(private cdr: ChangeDetectorRef) {
    // Initialize dataSource to prevent undefined errors
    this.dataSource = new MatTableDataSource<any>([]);
  }
  
  // Search & Filter
  searchQuery = '';
  showAdvancedSearch = false;
  savedSearches: any[] = [];
  currentSearchCriteria: SearchCriteria = {};
  
  // Pagination
  pageSize = 5;
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalCount = 0;
  currentPage = 0;
  previousPageSize = 5; // Track previous page size to detect changes
  
  // Server-side state
  currentSort: { field: string; direction: 'asc' | 'desc' } | null = null;
  currentFilters: { [key: string]: any } = {};
  
  // View modes
  isMobile = false;
  viewMode: 'list' | 'card' = 'list';
  
  // Math object for templates
  Math = Math;
  
  ngOnInit(): void {
    this.initializeTable();
    this.checkScreenSize();
    
    // Add resize listener with proper cleanup
    this.resizeListener = () => this.checkScreenSize();
    window.addEventListener('resize', this.resizeListener);
    
    // Load saved searches from localStorage
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      this.savedSearches = JSON.parse(saved);
    }
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
    
    // Reset subscription flags
    this.sortSubscribed = false;
    this.paginatorSubscribed = false;
    
    // Remove resize event listener
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      if (this.dataSource) {
        // Update existing dataSource data
        this.dataSource.data = this.data || [];
        
        // Update total count for display
        if (!this.config.serverSide) {
          this.totalCount = this.data?.length || 0;
        }
        
        // For client-side pagination, the MatTableDataSource automatically updates
        // the paginator. We just need to ensure it's connected.
        if (this.paginator && this.config.pagination !== false && !this.config.serverSide) {
          // Reset to first page when data changes significantly
          if (this.paginator.pageIndex > 0 && this.data.length <= this.paginator.pageIndex * this.paginator.pageSize) {
            this.paginator.firstPage();
          }
        }
      }
    }
    
    if (changes['config']) {
      // For server-side pagination, update totalCount when config changes
      if (this.config.serverSide && this.config.totalCount !== undefined) {
        this.totalCount = this.config.totalCount;
        // Update paginator length if it exists, but preserve pageSize and pageIndex
        if (this.paginator) {
          const currentPageSize = this.paginator.pageSize;
          const currentPageIndex = this.paginator.pageIndex;
          
          this.paginator.length = this.config.totalCount;
          // Preserve user's selections
          this.paginator.pageSize = currentPageSize;
          this.paginator.pageIndex = currentPageIndex;
          this.pageSize = currentPageSize;
          this.currentPage = currentPageIndex;
        }
      }
      
      if (changes['config'].currentValue && changes['config'].firstChange) {
        this.initializeTable();
      }
    }
  }
  
  initializeTable(): void {
    // Set page size - preserve user's selection if paginator exists
    if (this.config.serverSide && this.paginator && this.paginator.pageSize) {
      // Preserve the user's selected page size
      this.pageSize = this.paginator.pageSize;
      this.previousPageSize = this.paginator.pageSize;
    } else {
      // Use default page size for initial load
      this.pageSize = this.config.defaultPageSize || 10;
      this.previousPageSize = this.pageSize;
    }
    this.pageSizeOptions = this.config.pageSizeOptions || [5, 10, 25, 50, 100];
    
    // Set total count for server-side pagination
    if (this.config.serverSide) {
      this.totalCount = this.config.totalCount || 0;
    } else {
      this.totalCount = this.data.length;
    }
    
    // Clear and setup columns
    this.displayedColumns = [];
    
    if (this.config.selectable) {
      this.displayedColumns.push('select');
    }
    
    this.displayedColumns.push(...this.config.columns.map(col => col.key));
    
    if (this.config.actions && this.config.actions.length > 0) {
      this.displayedColumns.push('actions');
    }
    
    // Initialize data source
    this.dataSource = new MatTableDataSource(this.data);
    
    // Setup custom filter only for client-side
    if (!this.config.serverSide) {
      this.dataSource.filterPredicate = this.createFilter();
    }
    
    // Reconnect paginator and sort if they exist (after view init)
    this.connectPaginatorAndSort();
  }
  
  ngAfterViewInit(): void {
    // Connect paginator and sort after view initialization
    setTimeout(() => {
      this.connectPaginatorAndSort();
    }, 0);
  }
  
  /**
   * Connect paginator and sort to the data source
   * This should be called after view init and whenever dataSource is recreated
   */
  private connectPaginatorAndSort(): void {
    if (!this.dataSource) {
      return;
    }
    
    // Wait for next tick to ensure view is fully rendered
    Promise.resolve().then(() => {
      // Client-side pagination - let MatTableDataSource handle everything
      if (this.config.pagination !== false && !this.config.serverSide) {
        if (this.paginator) {
          // Disconnect first to clear any existing connection
          this.dataSource.paginator = null;
          
          // Reconnect - MatTableDataSource will automatically handle everything
          this.dataSource.paginator = this.paginator;
        }
      }
      
      // Client-side sorting
      if (!this.config.serverSide) {
        if (this.sort) {
          // Disconnect first to clear any existing connection
          this.dataSource.sort = null;
          // Reconnect
          this.dataSource.sort = this.sort;
        }
      } else {
        // For server-side, handle sort events manually
        if (this.sort && !this.sortSubscribed) {
          // CRITICAL: Connect sort to dataSource even for server-side
          // This is needed for mat-sort-header directives to trigger sortChange events
          this.dataSource.sort = this.sort;
          
          // Subscribe to sort changes for server-side tables
          // The subscription will be cleaned up in ngOnDestroy
          const sortSub = this.sort.sortChange.subscribe((sort: Sort) => {
            this.onServerSort(sort);
          });
          this.subscriptions.add(sortSub);
          this.sortSubscribed = true;
        }
        
        // For server-side, handle pagination events manually  
        if (this.paginator) {
          // Only set initial configuration if paginator hasn't been configured yet
          // This preserves user's page size selection across data reloads
          if (!this.paginator.length) {
            this.paginator.length = this.totalCount;
            this.paginator.pageSize = this.pageSize;
            this.paginator.pageIndex = this.currentPage;
          } else {
            // Update only the length, preserve user's pageSize and pageIndex
            this.paginator.length = this.totalCount;
            // Keep the user's selected pageSize
            this.pageSize = this.paginator.pageSize;
            this.currentPage = this.paginator.pageIndex;
          }
          
          if (!this.paginatorSubscribed) {
            const pageSub = this.paginator.page.subscribe((pageEvent: PageEvent) => {
              this.onServerPageChange(pageEvent);
            });
            this.subscriptions.add(pageSub);
            this.paginatorSubscribed = true;
          }
        }
      }
    });
  }
  
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile && this.config.responsive) {
      this.viewMode = 'card';
    } else {
      this.viewMode = 'list';
    }
  }
  
  // Search Functions
  applySearch(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    // Keep spaces in the middle and on the right side, only trim leading spaces
    // Also normalize multiple consecutive spaces to single space for better matching
    this.searchQuery = filterValue.replace(/^\s+/, '').replace(/\s+/g, ' ');
    
    if (this.config.serverSide) {
      // For server-side, emit search event
      this.searchChanged.emit(this.searchQuery);
      this.advancedSearchChanged.emit({
        query: this.searchQuery,
        filters: this.currentFilters
      });
    } else {
      // For client-side, apply filter directly
      this.dataSource.filter = this.searchQuery.toLowerCase();
      this.searchChanged.emit(this.searchQuery);
    }
  }
  
  openAdvancedSearch(): void {
    this.showAdvancedSearch = true;
  }
  
  closeAdvancedSearch(): void {
    this.showAdvancedSearch = false;
  }
  
  onAdvancedSearchApplied(criteria: SearchCriteria): void {
    this.currentSearchCriteria = criteria;
    this.currentFilters = criteria;
    
    if (this.config.serverSide) {
      // For server-side, emit advanced search event
      this.advancedSearchChanged.emit({
        query: this.searchQuery,
        filters: criteria
      });
    } else {
      // For client-side, apply filters directly
      this.applyAdvancedFilters(criteria);
    }
  }
  
  applyAdvancedFilters(criteria: SearchCriteria): void {
    this.dataSource.filterPredicate = (data: any) => {
      return Object.keys(criteria).every(key => {
        const criteriaValue = criteria[key];
        const dataValue = data[key];
        
        // Handle different comparison types
        if (Array.isArray(criteriaValue)) {
          return criteriaValue.includes(dataValue);
        }
        if (typeof criteriaValue === 'string') {
          // Normalize spaces for better matching with search text containing spaces
          // Only trim leading spaces, keep trailing spaces
          const normalizedData = dataValue?.toString().toLowerCase().replace(/\s+/g, ' ') || '';
          const normalizedCriteria = criteriaValue.toLowerCase().replace(/^\s+/, '').replace(/\s+/g, ' ');
          return normalizedData.includes(normalizedCriteria);
        }
        return dataValue === criteriaValue;
      });
    };
    this.dataSource.filter = JSON.stringify(criteria);
  }
  
  onSearchReset(): void {
    // Clear search query
    this.searchQuery = '';
    
    // Clear current search criteria
    this.currentSearchCriteria = {};
    
    // Clear data source filter
    this.dataSource.filter = '';
    this.dataSource.filterPredicate = this.createFilter();
    
    // Emit reset event to parent component to reload data
    this.searchResetEvent.emit();
  }
  
  /**
   * Reset all filters and search in real-time
   */
  resetAllFilters(): void {
    // Clear search query
    this.searchQuery = '';
    
    // Clear data source filter
    this.dataSource.filter = '';
    
    // Clear current search criteria
    this.currentSearchCriteria = {};
    
    // Clear current filters
    this.currentFilters = {};
    
    // Reset filter predicate
    this.dataSource.filterPredicate = this.createFilter();
    
    // For server-side tables, emit reset event
    if (this.config.serverSide) {
      this.advancedSearchChanged.emit({
        query: '',
        filters: {}
      });
    }
  }
  
  /**
   * Check if there are any active filters
   */
  hasActiveFilters(): boolean {
    return this.searchQuery.length > 0 || 
           Object.keys(this.currentSearchCriteria).length > 0 ||
           Object.keys(this.currentFilters).length > 0;
  }
  
  /**
   * Get the count of active advanced search filters
   * Excludes empty values and pagination/sorting parameters
   */
  getActiveFilterCount(): number {
    if (!this.currentFilters) {
      return 0;
    }
    
    // List of keys to exclude from filter count (pagination, sorting, etc.)
    const excludeKeys = ['page', 'per_page', 'sort_by', 'sort_direction', 'search'];
    
    // Count non-empty filter values
    let count = 0;
    for (const key in this.currentFilters) {
      if (this.currentFilters.hasOwnProperty(key) && !excludeKeys.includes(key)) {
        const value = this.currentFilters[key];
        
        // Only count non-empty, non-null values
        if (value !== null && value !== undefined && value !== '') {
          // For arrays, only count if not empty
          if (Array.isArray(value)) {
            if (value.length > 0) {
              count++;
            }
          } else {
            count++;
          }
        }
      }
    }
    
    return count;
  }
  
  onSearchSaved(event: { name: string, criteria: SearchCriteria }): void {
    this.savedSearches.push(event);
    localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
  }
  
  onFieldValueChanged(event: { field: string, value: any }): void {
    this.searchFieldChanged.emit(event);
  }
  
  createFilter(): (data: any, filter: string) => boolean {
    return (data: any, filter: string): boolean => {
      // Try advanced search first
      try {
        const filters = JSON.parse(filter) as SearchCriteria;
        return Object.keys(filters).every(key => {
          const value = data[key];
          const filterValue = filters[key];
          if (Array.isArray(filterValue)) {
            return filterValue.includes(value);
          }
          return value?.toString().toLowerCase().includes(filterValue.toString().toLowerCase());
        });
      } catch {
        // Basic search fallback - supports spaces in search (including trailing spaces)
        const searchStr = filter.toLowerCase().replace(/^\s+/, '');
        
        // If search is empty, show all
        if (!searchStr) {
          return true;
        }
        
        return this.config.columns
          .filter(col => col.searchable !== false)
          .some(col => {
            const value = data[col.key];
            if (value === null || value === undefined) {
              return false;
            }
            // Normalize spaces in the value for better matching
            const normalizedValue = value.toString().toLowerCase().replace(/\s+/g, ' ');
            return normalizedValue.includes(searchStr);
          });
      }
    };
  }
  
  // Selection Functions
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  
  isIndeterminate(): boolean {
    return this.selection.hasValue() && !this.isAllSelected();
  }
  
  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
    this.selectionChanged.emit(this.selection.selected);
  }
  
  toggleRow(row: any): void {
    this.selection.toggle(row);
    this.selectionChanged.emit(this.selection.selected);
  }
  
  isSelected(row: any): boolean {
    return this.selection.isSelected(row);
  }
  
  // Action Functions
  onActionClick(action: TableAction, row: any): void {
    action.action(row);
    this.actionClicked.emit({ action: action.label, row });
  }
  
  onRowClick(row: any): void {
    this.rowClicked.emit(row);
  }
  
  // Export Functions
  onExport(event: ExportEvent): void {
    this.exportClicked.emit(event.format);
  }
  
  // Add Functions
  onAdd(): void {
    this.actionClicked.emit({ action: 'add', row: null });
  }
  
  // Utility Functions
  getCellValue(row: any, column: TableColumn): any {
    // Handle nested properties (e.g., 'branch.name')
    let value: any;
    if (column.key.includes('.')) {
      const keys = column.key.split('.');
      value = row;
      for (const key of keys) {
        value = value?.[key];
        if (value === null || value === undefined) break;
      }
    } else {
      value = row[column.key];
    }
    
    // Check if value is null, undefined, or empty string
    // Note: 0 and false are valid values and should not be replaced with "-"
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    
    // Handle arrays - show "-" if empty, otherwise show joined values or count
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '-';
      }
      // If array contains simple values (strings/numbers), join them
      // Otherwise show count
      if (value.every(item => typeof item === 'string' || typeof item === 'number')) {
        return value.join(', ');
      }
      return `${value.length} items`;
    }
    
    // Handle objects (but not dates) - show "-" if empty
    if (typeof value === 'object' && !(value instanceof Date)) {
      if (Object.keys(value).length === 0) {
        return '-';
      }
      // For non-empty objects, return as-is (might have custom template)
      return value;
    }
    
    if (column.pipe) {
      return this.applyPipe(value, column.pipe);
    }
    
    // Auto-apply date formatting for date type columns
    if (column.type === 'date') {
      return this.applyPipe(value, 'date');
    }
    
    return value;
  }
  
  applyPipe(value: any, pipeName: string): any {
    switch (pipeName) {
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'currency':
        return (value !== null && value !== undefined) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : '-';
      default:
        return value;
    }
  }
  
  getCellClass(row: any, column: TableColumn): string {
    if (typeof column.cellClass === 'function') {
      return column.cellClass(row);
    }
    return column.cellClass || '';
  }
  
  onPageSizeChange(): void {
    if (this.paginator) {
      this.paginator.pageSize = this.pageSize;
      this.paginator.firstPage();
    }
  }

  // Manual sort trigger for testing
  onHeaderClick(column: TableColumn): void {
    // Only trigger manual sort for server-side and sortable columns
    if (this.config.serverSide && column.sortable !== false) {
      // Determine next sort direction
      let nextDirection: 'asc' | 'desc' | '' = 'asc';
      
      if (this.currentSort?.field === column.key) {
        // Toggle direction: asc -> desc -> no sort
        if (this.currentSort.direction === 'asc') {
          nextDirection = 'desc';
        } else if (this.currentSort.direction === 'desc') {
          nextDirection = ''; // Clear sort
        }
      }
      
      // Manually call onServerSort to test the full chain
      this.onServerSort({
        active: column.key,
        direction: nextDirection
      });
    }
  }

  // Server-side event handlers
  onServerSort(sort: Sort): void {
    if (sort.direction) {
      this.currentSort = {
        field: sort.active,
        direction: sort.direction as 'asc' | 'desc'
      };
      
      // Emit sort event to parent component
      this.sortChanged.emit({
        field: sort.active,
        direction: sort.direction as 'asc' | 'desc'
      });
    } else {
      // Clear sort
      this.currentSort = null;
      
      // Emit sort event with empty direction to indicate sort clear
      // Parent component should handle this by loading data without sorting
      this.sortChanged.emit({
        field: sort.active,
        direction: 'asc' // Default direction when clearing
      });
    }
  }

  onServerPageChange(pageEvent: PageEvent): void {
    // Detect if this is a page size change (not a page navigation)
    const isPageSizeChange = pageEvent.pageSize !== this.previousPageSize;
    
    if (isPageSizeChange) {
      // When page size changes, reset to first page
      this.currentPage = 0;
      this.pageSize = pageEvent.pageSize;
      this.previousPageSize = pageEvent.pageSize;
    } else {
      // Normal page navigation
      this.currentPage = pageEvent.pageIndex;
      this.pageSize = pageEvent.pageSize;
    }
    
    this.paginationChanged.emit({
      page: this.currentPage,
      pageSize: this.pageSize
    });
  }

  // Method to update server-side data
  updateServerData(data: any[], totalCount: number): void {
    if (this.config.serverSide) {
      this.dataSource.data = data;
      this.totalCount = totalCount;
      
      if (this.paginator) {
        this.paginator.length = totalCount;
        this.paginator.pageIndex = this.currentPage;
        this.paginator.pageSize = this.pageSize;
      }
    }
  }

  // Method to reset server-side state
  resetServerState(): void {
    this.currentPage = 0;
    this.currentSort = null;
    this.currentFilters = {};
    this.searchQuery = '';
    this.currentSearchCriteria = {};
    
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    
    if (this.sort) {
      this.sort.sort({ id: '', start: 'asc', disableClear: false });
    }
  }

  /**
   * Get actions that should be visible for a specific row
   * Filters based on the show property of each action
   */
  getVisibleActions(row: any): TableAction[] {
    if (!this.config.actions) {
      return [];
    }
    
    return this.config.actions.filter(action => {
      // If no show function defined, always show
      if (!action.show) {
        return true;
      }
      
      // Otherwise, call the show function
      return action.show(row);
    });
  }
}

