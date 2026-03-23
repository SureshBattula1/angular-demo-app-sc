import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { SectionService } from '../../services/section.service';
import { GradeService } from '../../../grades/services/grade.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ExportService } from '../../../../shared/services/export.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-section-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="sections"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Sections'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (searchFieldChanged)="onSearchFieldChanged($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)"
      (searchResetEvent)="onSearchReset()">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class SectionListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;

  loading = false;
  sections: Section[] = [];
  selectedSections: Section[] = [];
  currentFilters: Record<string, unknown> = {};
  private selectedBranchId: string | number | null = null;

  tableConfig: TableConfig = {
    columns: [
      { key: 'code', header: 'Code', sortable: true, searchable: true, width: '120px' },
      { key: 'name', header: 'Section ', sortable: true, searchable: true, width: '120px' },
      { key: 'branch.name', header: 'Branch', sortable: true, width: '150px' },
      { key: 'grade_label', header: 'Class (Grade)', sortable: true, width: '120px' },
      { key: 'capacity', header: 'Capacity', type: 'number', align: 'center', width: '100px' },
      { key: 'current_strength', header: 'Students', type: 'number', align: 'center', width: '100px' },
      { key: 'room_number', header: 'Room', sortable: true, width: '100px' },
      {
        key: 'status_label',
        header: 'Status',
        type: 'badge',
        width: '110px',
        align: 'center',
        cellClass: (row: any) => (row?.is_active === false || row?.status_label === 'Deactive') ? 'badge-danger' : 'badge-success'
      }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'View Details',
        action: (row) => this.viewSection(row),
        permission: 'sections.view'
      },
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: (row) => this.editSection(row),
        permission: 'sections.edit'
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row) => this.deleteSection(row),
        permission: 'sections.delete'
      }
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
    defaultPageSize: 25,
    addButtonPermission: 'sections.create'
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Section Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        placeholder: 'Select branch',
        icon: 'business',
        options: [], // Will be populated dynamically
        group: 'Basic Information'
      },

      {
        key: 'grade_level',
        label: 'Grade Level',
        type: 'select',
        icon: 'school',
        options: [], // Will be populated dynamically
        group: 'Basic Information'
      },
      {
        key: 'name',
        label: 'Section Name',
        type: 'text',
        placeholder: 'Enter section name',
        icon: 'class',
        group: 'Basic Information'
      },
      {
        key: 'code',
        label: 'Section Code',
        type: 'text',
        placeholder: 'Enter section code',
        icon: 'qr_code',
        group: 'Basic Information'
      },
      {
        key: 'is_active',
        label: 'Active Only',
        type: 'checkbox',
        icon: 'check_circle',
        group: 'Basic Information'
      }
    ]
  };

  constructor(
    private sectionService: SectionService,
    private gradeService: GradeService,
    private branchService: BranchService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.loadBranches();
    this.loadSections();
    this.setGradeOptions([]);
  }

  /**
   * Load branches dynamically for advanced search filter
   */
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const branchField = this.advancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (branchField) {
            branchField.options = response.data.map(branch => ({
              value: branch.id.toString(),
              label: branch.name
            }));
          }
        }
      },
      error: (error) => {
      }
    });
  }

  private setGradeOptions(options: Array<{ value: any; label: string; disabled?: boolean }>): void {
    const gradeField = this.advancedSearchConfig.fields.find(f => f.key === 'grade_level');
    if (gradeField) gradeField.options = options;
  }

  private loadGradesForBranch(branchId: string | number): void {
    this.setGradeOptions([{ value: '', label: 'Loading grades...', disabled: true }]);
    this.gradeService.getGrades({ branch_id: Number(branchId) }).subscribe({
      next: (response) => {
        const options = (response.success && response.data)
          ? response.data.filter((g: any) => g.is_active).map((g: any) => ({ value: g.value, label: g.label }))
          : [];
        this.setGradeOptions(options);
      },
      error: () => this.setGradeOptions([])
    });
  }

  onSearchFieldChanged(event: { field: string; value: any }): void {
    if (event.field === 'branch_id') {
      this.selectedBranchId = event.value || null;
      // Clear grade when branch changes
      if (this.selectedBranchId) {
        this.loadGradesForBranch(this.selectedBranchId);
      } else {
        this.setGradeOptions([]);
      }
    }
  }

  loadSections(): void {
    this.loading = true;

    this.sectionService.getSections(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.sections = (response.data || []).map((s: any) => ({
            ...s,
            status_label: s?.is_active ? 'Active' : 'Deactive'
          }));
          if (response.meta) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.meta.total };
          }
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  /**
   * Handle pagination changes
   */
  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1,
      per_page: event.pageSize
    };
    this.loadSections();
  }

  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    const columnMapping: Record<string, string> = {
      'code': 'code',
      'name': 'name',
      'branch.name': 'branch_id',
      'grade_label': 'grade_level',
      'capacity': 'capacity',
      'current_strength': 'current_strength',
      'room_number': 'room_number',
      'is_active': 'is_active'
    };

    const sortColumn = columnMapping[event.field] || event.field;

    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
      sort_direction: event.direction
    };
    this.loadSections();
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.loadSections();
  }

  onSearchReset(): void {
    this.currentFilters = {};
    this.selectedBranchId = null;
    this.setGradeOptions([]);
    this.loadSections();
  }

  onAction(event: { action: string, row: Section | null }): void {
    if (event.action === 'add') {
      // Check permission before allowing create
      if (this.permissionService.hasPermission('sections.create')) {
        this.router.navigate(['/sections/create']);
      } else {
        this.errorHandler.showError('You do not have permission to create sections');
      }
    }
  }

  onRowClick(row: Section): void {
    this.viewSection(row);
  }

  onSelectionChange(selected: Section[]): void {
    this.selectedSections = selected;
  }

  viewSection(section: Section): void {
    this.router.navigate(['/sections/view', section.id]);
  }

  editSection(section: Section): void {
    this.router.navigate(['/sections/edit', section.id]);
  }

  deleteSection(section: Section): void {
    if (confirm(`Are you sure you want to delete section "${section.name}"?`)) {
      this.sectionService.deleteSection(section.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Section deleted successfully');
            this.loadSections();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onExport(format: 'excel' | 'pdf' | 'csv'): void {
    // Check permission before allowing export
    if (!this.permissionService.hasPermission('sections.export')) {
      this.errorHandler.showError('You do not have permission to export sections');
      return;
    }

    // Show loading message
    this.errorHandler.showInfo(`Exporting as ${format.toUpperCase()}...`);

    // Call export service with current filters
    this.exportService.export(
      {
        endpoint: '/sections/export',
        filename: 'sections'
      },
      {
        format: format,
        filters: this.currentFilters
      }
    );
  }
}

