import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `<div class="card"><h1>Student View</h1><p>Student details page</p></div>`,
  styles: [`.card { padding: var(--spacing-lg); }`]
})
export class StudentViewComponent {}
