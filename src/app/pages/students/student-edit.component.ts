import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `<div class="card"><h1>Edit Student</h1><p>Edit student form</p></div>`,
  styles: [`.card { padding: var(--spacing-lg); }`]
})
export class StudentEditComponent {}
