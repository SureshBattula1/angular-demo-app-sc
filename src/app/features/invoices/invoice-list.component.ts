import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `<div class="card"><h1>Invoices</h1><p>Invoice list page</p></div>`,
  styles: [`.card { padding: var(--spacing-lg); }`]
})
export class InvoiceListComponent {}

