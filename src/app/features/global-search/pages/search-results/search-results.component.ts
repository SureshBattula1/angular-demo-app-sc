import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { ExportFormat } from '../../../../shared/components/export-button/export-button.component';
import { GlobalSearchService } from '../../services/global-search.service';
import { GlobalSearchResult } from '../../../../core/models/global-search.model';
import { BranchService } from '../../../branches/services/branch.service';
import { ExportService } from '../../../../shared/services/export.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

/** A result row enriched with display-ready fields for the table. */
type SearchRow = GlobalSearchResult & {
  branchName: string;
  categoryLabel: string;
};

/** Advanced-search filters merged into every request. */
type SearchFilters = {
  filter_branch_id?: string;
  category?: GlobalSearchResult['category'];
};

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('nameCell', { static: true }) nameCellTemplate!: TemplateRef<unknown>;

  loading = false;
  query = '';
  results: SearchRow[] = [];

  private page = 1;
  private perPage = 25;
  /** Advanced-search filters (branch/category) merged into every request. */
  private filters: SearchFilters = {};
  private queryParamSub?: Subscription;

  tableConfig: TableConfig = {
    columns: [
      { key: 'branchName', header: 'Branch', width: '220px' },
      { key: 'name', header: 'Name', type: 'custom' },
      { key: 'categoryLabel', header: 'Category', type: 'badge', width: '140px', align: 'center' },
      { key: 'phone', header: 'Phone', width: '160px' },
      { key: 'email', header: 'Email' }
    ],
    selectable: false,
    pagination: true,
    searchable: false,        // no basic in-table search box
    advancedSearch: true,
    filterable: true,
    exportable: true,
    exportButtonPermission: 'search.global',
    responsive: true,
    serverSide: true,
    totalCount: 0,
    showAddButton: false,     // no "Add" button
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Search',
    width: '460px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'filter_branch_id',   // NOT branch_id — avoids the branch-scoped permission check
        label: 'Branch',
        type: 'select',
        icon: 'business',
        placeholder: 'Select branch',
        options: []                // populated from BranchService
      },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        icon: 'category',
        placeholder: 'Select category',
        options: [
          { value: 'student', label: 'Student' },
          { value: 'teacher', label: 'Teacher' },
          { value: 'accountant', label: 'Accountant' },
          { value: 'staff', label: 'Staff' }
        ]
      }
    ]
  };

  constructor(
    private globalSearchService: GlobalSearchService,
    private branchService: BranchService,
    private exportService: ExportService,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBranchOptions();

    // React to header search submissions (?q=) without recreating the component.
    this.queryParamSub = this.route.queryParamMap.subscribe(params => {
      this.query = (params.get('q') || '').trim();
      this.page = 1;
      this.loadResults();
    });
  }

  ngAfterViewInit(): void {
    // Wire the clickable-name template into the Name column.
    const nameColumn = this.tableConfig.columns.find(c => c.key === 'name');
    if (nameColumn) {
      nameColumn.customTemplate = this.nameCellTemplate;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.queryParamSub?.unsubscribe();
  }

  private loadBranchOptions(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        const field = this.advancedSearchConfig.fields.find(f => f.key === 'filter_branch_id');
        if (field) {
          // Keep branch ids as opaque strings — never Number() a hashid.
          field.options = (response.success && response.data)
            ? response.data.map(b => ({ value: b.id.toString(), label: b.name }))
            : [];
        }
      },
      error: () => { /* leave branch options empty on failure */ }
    });
  }

  private loadResults(): void {
    if (this.query.length < 2) {
      this.results = [];
      this.tableConfig = { ...this.tableConfig, totalCount: 0 };
      return;
    }

    this.loading = true;
    const params = { q: this.query, page: this.page, per_page: this.perPage, ...this.filters };

    this.globalSearchService.search(params).subscribe({
      next: (response) => {
        this.results = (response.data || []).map(item => ({
          ...item,
          branchName: item.branch?.name || '—',
          categoryLabel: this.categoryLabel(item.category)
        }));
        this.tableConfig = { ...this.tableConfig, totalCount: response.meta?.total ?? this.results.length };
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  onPaginationChange(event: PaginationEvent): void {
    this.page = event.page + 1; // backend is 1-based
    this.perPage = event.pageSize;
    this.loadResults();
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    this.filters = { ...(event.filters || {}) } as SearchFilters;
    if (event.query) {
      this.query = event.query.trim();
    }
    this.page = 1;
    this.loadResults();
  }

  onSearchReset(): void {
    this.filters = {};
    this.page = 1;
    this.loadResults(); // keeps the header search term (this.query)
  }

  onExport(format: ExportFormat): void {
    this.errorHandler.showInfo(`Exporting as ${format.toUpperCase()}...`);
    this.exportService.export(
      { endpoint: '/global-search/export', filename: 'search-results' },
      { format, filters: { q: this.query, ...this.filters } }
    );
  }

  /**
   * routerLink target for the matching profile. The hashid id is passed
   * verbatim (never Number()'d).
   */
  profileLink(row: SearchRow): string[] {
    const base = row.type === 'student' ? '/students/view' : '/teachers/view';
    return [base, row.id];
  }

  private categoryLabel(category: GlobalSearchResult['category']): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
