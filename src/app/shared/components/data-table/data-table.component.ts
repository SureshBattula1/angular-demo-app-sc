import { Component, Input, Output, EventEmitter, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { TableColumn, TableAction, TableConfig, SearchCriteria, PaginationEvent, SortEvent, SearchEvent } from './data-table.interface';
import { AdvancedSearchConfig } from '../advanced-search-sidebar/search-field.interface';
import { AdvancedSearchSidebarComponent } from '../advanced-search-sidebar/advanced-search-sidebar.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, SharedModule, AdvancedSearchSidebarComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() data: any[] = [];
  @Input() config!: TableConfig;
  @Input() advancedSearchConfig?: AdvancedSearchConfig;
  @Input() loading = false;
  @Input() title = '';
  
  @Output() actionClicked = new EventEmitter<{ action: string, row: any }>();
  @Output() rowClicked = new EventEmitter<any>();
  @Output() selectionChanged = new EventEmitter<any[]>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() exportClicked = new EventEmitter<string>();
  
  // Server-side events
  @Output() paginationChanged = new EventEmitter<PaginationEvent>();
  @Output() sortChanged = new EventEmitter<SortEvent>();
  @Output() advancedSearchChanged = new EventEmitter<SearchEvent>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource!: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  displayedColumns: string[] = [];
  
  // Search & Filter
  searchQuery = '';
  showAdvancedSearch = false;
  savedSearches: any[] = [];
  currentSearchCriteria: SearchCriteria = {};
  
  // Pagination
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalCount = 0;
  currentPage = 0;
  
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
    window.addEventListener('resize', () => this.checkScreenSize());
    
    // Load saved searches from localStorage
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      this.savedSearches = JSON.parse(saved);
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.dataSource) {
      this.dataSource.data = this.data;
    }
  }
  
  initializeTable(): void {
    // Set page size
    this.pageSize = this.config.defaultPageSize || 10;
    this.pageSizeOptions = this.config.pageSizeOptions || [5, 10, 25, 50, 100];
    
    // Set total count for server-side pagination
    if (this.config.serverSide) {
      this.totalCount = this.config.totalCount || 0;
    } else {
      this.totalCount = this.data.length;
    }
    
    // Setup columns
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
  }
  
  ngAfterViewInit(): void {
    if (this.config.pagination !== false && !this.config.serverSide) {
      this.dataSource.paginator = this.paginator;
    }
    
    if (!this.config.serverSide) {
      this.dataSource.sort = this.sort;
    } else {
      // For server-side, handle sort events manually
      if (this.sort) {
        this.sort.sortChange.subscribe((sort: Sort) => {
          this.onServerSort(sort);
        });
      }
      
      // For server-side, handle pagination events manually
      if (this.paginator) {
        this.paginator.page.subscribe((pageEvent: PageEvent) => {
          this.onServerPageChange(pageEvent);
        });
      }
    }
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
    this.searchQuery = filterValue.trim();
    
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
          return dataValue?.toString().toLowerCase().includes(criteriaValue.toLowerCase());
        }
        return dataValue === criteriaValue;
      });
    };
    this.dataSource.filter = JSON.stringify(criteria);
  }
  
  onSearchReset(): void {
    this.currentSearchCriteria = {};
    this.dataSource.filter = '';
    this.dataSource.filterPredicate = this.createFilter();
  }
  
  onSearchSaved(event: { name: string, criteria: SearchCriteria }): void {
    this.savedSearches.push(event);
    localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
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
        // Basic search fallback
        const searchStr = filter.toLowerCase();
        return this.config.columns
          .filter(col => col.searchable !== false)
          .some(col => {
            const value = data[col.key];
            return value?.toString().toLowerCase().includes(searchStr);
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
  onExport(format: 'csv' | 'excel' | 'pdf'): void {
    this.exportClicked.emit(format);
  }
  
  // Add Functions
  onAdd(): void {
    this.actionClicked.emit({ action: 'add', row: null });
  }
  
  // Utility Functions
  getCellValue(row: any, column: TableColumn): any {
    const value = row[column.key];
    
    if (column.pipe) {
      return this.applyPipe(value, column.pipe);
    }
    
    return value;
  }
  
  applyPipe(value: any, pipeName: string): any {
    switch (pipeName) {
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
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

  // Server-side event handlers
  onServerSort(sort: Sort): void {
    if (sort.direction) {
      this.currentSort = {
        field: sort.active,
        direction: sort.direction
      };
    } else {
      this.currentSort = null;
    }
    
    this.sortChanged.emit({
      field: sort.active,
      direction: sort.direction || 'asc'
    });
  }

  onServerPageChange(pageEvent: PageEvent): void {
    this.currentPage = pageEvent.pageIndex;
    this.pageSize = pageEvent.pageSize;
    
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
}

