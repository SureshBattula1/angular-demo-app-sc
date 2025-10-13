import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-student-add',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `<div class="card"><h1>Add Student</h1><p>Add new student form</p></div>`,
  styles: [`.card { padding: var(--spacing-lg); }`]
})
export class StudentAddComponent {}
