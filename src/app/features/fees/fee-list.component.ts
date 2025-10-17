import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `<div class="card"><h1>Fees</h1><p>Fee list page</p></div>`,
  styles: [`.card { padding: var(--spacing-lg); }`]
})
export class FeeListComponent {}

