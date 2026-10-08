import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../services/library.service';
import { LibraryMember } from '../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss']
})
export class MemberListComponent implements OnInit {
  loading = false;
  members: LibraryMember[] = [];
  selectedMember: any = null;
  showProfileModal = false;
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'first_name', header: 'First Name', sortable: true },
      { key: 'last_name', header: 'Last Name', sortable: true },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'role', header: 'Member Type', type: 'badge', width: '130px', align: 'center' },
      { key: 'active_loans_count', header: 'Active Loans', width: '120px', align: 'center' },
      { key: 'overdue_count', header: 'Overdue', width: '100px', align: 'center' },
      { key: 'pending_fines', header: 'Fines Due (₹)', width: '120px', align: 'right' }
    ],
    actions: [
      { icon: 'account_circle', label: 'View Profile', color: 'primary', action: (row) => this.openProfileModal(row) }
    ],
    pagination: true,
    searchable: true,
    serverSide: true,
    totalCount: 0,
    showAddButton: false
  };

  constructor(
    private libraryService: LibraryService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.libraryService.getMembers(this.filters).subscribe({
      next: (res) => {
        this.members = res.data || [];
        if (res.meta) { this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total }; }
        this.loading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  onAction(_event: any): void {}

  onPaginationChange(e: PaginationEvent): void {
    this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize };
    this.loadMembers();
  }

  onSearch(term: string): void {
    this.filters = { ...this.filters, search: term, page: 1 };
    this.loadMembers();
  }

  openProfileModal(member: LibraryMember): void {
    this.libraryService.getMemberProfile(member.id, member.role).subscribe({
      next: (res) => {
        this.selectedMember = res.data;
        this.showProfileModal = true;
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }
}
