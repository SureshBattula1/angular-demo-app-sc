import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/modules/material/material.module';

@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="p-lg">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Edit Student</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Edit student form</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: []
})
export class StudentEditComponent {}

