import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../services/library.service';
import { LibraryProcurement } from '../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-procurement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './procurement-list.component.html',
  styleUrls: ['./procurement-list.component.scss']
})
export class ProcurementListComponent implements OnInit {
  loading = false;
  procurements: LibraryProcurement[] = [];
  showNewPOModal = false;

  newPO: {
    po_number: string;
    vendor_name: string;
    order_date: string;
    delivery_date: string;
    items: { title: string; author: string; isbn: string; quantity_ordered: number; unit_price: number }[];
  } = {
    po_number: '',
    vendor_name: '',
    order_date: new Date().toISOString().substring(0, 10),
    delivery_date: '',
    items: [
      { title: '', author: '', isbn: '', quantity_ordered: 1, unit_price: 0 }
    ]
  };

  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'po_number', header: 'PO #', sortable: true, width: '130px' },
      { key: 'vendor_name', header: 'Vendor / Distributor', sortable: true },
      { key: 'order_date', header: 'Order Date', width: '120px' },
      { key: 'items_count', header: 'Line Items', width: '100px', align: 'center' },
      { key: 'total_amount', header: 'Total (₹)', width: '120px', align: 'right' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' }
    ],
    actions: [
      {
        icon: 'inventory_2',
        label: 'Receive & Accession',
        color: 'primary',
        action: (row) => this.receivePO(row),
        show: (row) => row.status === 'Ordered' || row.status === 'Draft'
      }
    ],
    pagination: true,
    serverSide: true,
    totalCount: 0,
    addButtonPermission: 'library.create',
    primaryButtonLabel: 'NEW PURCHASE ORDER'
  };

  constructor(
    private libraryService: LibraryService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadProcurements();
  }

  loadProcurements(): void {
    this.loading = true;
    this.libraryService.getProcurements(this.filters).subscribe({
      next: (res) => {
        this.procurements = res.data || [];
        if (res.meta) { this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total }; }
        this.loading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  onAction(event: any): void {
    if (event.action === 'add') {
      this.openNewPOModal();
    }
  }

  onPaginationChange(e: PaginationEvent): void {
    this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize };
    this.loadProcurements();
  }

  openNewPOModal(): void {
    this.newPO = {
      po_number: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor_name: '',
      order_date: new Date().toISOString().substring(0, 10),
      delivery_date: '',
      items: [
        { title: '', author: '', isbn: '', quantity_ordered: 1, unit_price: 0 }
      ]
    };
    this.showNewPOModal = true;
  }

  closeNewPOModal(): void {
    this.showNewPOModal = false;
  }

  addLineItem(): void {
    this.newPO.items.push({ title: '', author: '', isbn: '', quantity_ordered: 1, unit_price: 0 });
  }

  removeLineItem(idx: number): void {
    if (this.newPO.items.length > 1) {
      this.newPO.items.splice(idx, 1);
    }
  }

  submitPO(): void {
    const branchId = this.auth.currentUser()?.branch_id || 1;
    this.libraryService.createProcurement({ ...this.newPO, branch_id: branchId }).subscribe({
      next: () => {
        this.closeNewPOModal();
        this.loadProcurements();
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  receivePO(row: LibraryProcurement): void {
    if (!confirm(`Mark PO #${row.po_number} as Received? All books will be automatically accessioned into library copies inventory.`)) { return; }
    this.libraryService.receiveProcurement(row.id).subscribe({
      next: () => {
        alert('Books received and physical copies created in inventory with barcodes!');
        this.loadProcurements();
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
