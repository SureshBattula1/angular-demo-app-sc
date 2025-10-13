import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `<div class="card"><h1>Holidays</h1><p>Holiday list page</p></div>`,
  styles: [`.card { padding: var(--spacing-lg); }`]
})
export class HolidayListComponent {}
