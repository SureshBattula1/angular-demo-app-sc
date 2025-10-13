import { Component, Input, Output, EventEmitter, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { TableColumn, TableAction, TableConfig, SearchCriteria } from './data-table.interface';
import { AdvancedSearchConfig } from '../advanced-search-sidebar/search-field.interface';
import { AdvancedSearchSidebarComponent } from '../advanced-search-sidebar/advanced-search-sidebar.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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
    
    // Setup custom filter
    this.dataSource.filterPredicate = this.createFilter();
  }
  
  ngAfterViewInit(): void {
    if (this.config.pagination !== false) {
      this.dataSource.paginator = this.paginator;
    }
    this.dataSource.sort = this.sort;
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
    this.searchQuery = filterValue.trim().toLowerCase();
    this.dataSource.filter = this.searchQuery;
    this.searchChanged.emit(this.searchQuery);
  }
  
  openAdvancedSearch(): void {
    this.showAdvancedSearch = true;
  }
  
  closeAdvancedSearch(): void {
    this.showAdvancedSearch = false;
  }
  
  onAdvancedSearchApplied(criteria: SearchCriteria): void {
    this.currentSearchCriteria = criteria;
    this.applyAdvancedFilters(criteria);
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
}

