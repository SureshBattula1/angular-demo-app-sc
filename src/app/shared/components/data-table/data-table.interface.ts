import { TemplateRef } from '@angular/core';
import { ServerTableRequest, TableState } from '../../interfaces/api.interface';

export interface TableColumn {
  key: string;                    // Property key from data object
  header: string;                 // Display header text
  sortable?: boolean;             // Enable sorting
  searchable?: boolean;           // Enable search for this column
  type?: 'text' | 'number' | 'date' | 'badge' | 'avatar' | 'actions' | 'custom';
  width?: string;                 // Column width (e.g., '150px', '20%')
  align?: 'left' | 'center' | 'right';
  pipe?: string;                  // Pipe to format data (e.g., 'date', 'currency')
  customTemplate?: TemplateRef<any>; // For custom cell rendering
  cellClass?: string | ((row: any) => string); // Dynamic cell classes
}

export interface TableAction {
  icon: string;                   // Material icon name
  label: string;                  // Tooltip text
  color?: 'primary' | 'accent' | 'warn';
  action: (row: any) => void;     // Action callback
  show?: (row: any) => boolean;   // Conditional visibility
}

export interface TableConfig {
  columns: TableColumn[];
  actions?: TableAction[];
  selectable?: boolean;           // Enable row selection
  expandable?: boolean;           // Enable row expansion
  pagination?: boolean;           // Enable pagination
  pageSizeOptions?: number[];     // Page size options
  defaultPageSize?: number;
  searchable?: boolean;           // Enable basic search
  advancedSearch?: boolean;       // Enable advanced search
  filterable?: boolean;           // Enable filter functionality
  exportable?: boolean;           // Enable export functionality
  responsive?: boolean;           // Mobile/tablet responsive
  serverSide?: boolean;           // Enable server-side operations
  totalCount?: number;            // Total count for server-side pagination
  showAddButton?: boolean;        // Show/hide the add button (default: true)
}

export interface SearchCriteria {
  [key: string]: any;             // Dynamic search values
}

// Server-side table events
export interface TableEvent {
  type: 'sort' | 'page' | 'search' | 'filter';
  data: any;
}

// Server-side pagination event
export interface PaginationEvent {
  page: number;
  pageSize: number;
}

// Server-side sort event
export interface SortEvent {
  field: string;
  direction: 'asc' | 'desc';
}

// Server-side search event
export interface SearchEvent {
  query: string;
  filters?: { [key: string]: any };
}

