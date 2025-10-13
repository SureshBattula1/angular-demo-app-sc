import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `<div class="card"><h1>Teachers</h1><p>Teacher list page</p></div>`,
  styles: [`.card { padding: var(--spacing-lg); }`]
})
export class TeacherListComponent {}
