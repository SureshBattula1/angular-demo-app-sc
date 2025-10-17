import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `<div class="card"><h1>Departments</h1><p>Department list page</p></div>`,
  styles: [`.card { padding: var(--spacing-lg); }`]
})
export class DepartmentListComponent {}

