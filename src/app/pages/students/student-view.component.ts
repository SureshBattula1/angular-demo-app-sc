import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/modules/material/material.module';

@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="p-lg">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Student View</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Student details page</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: []
})
export class StudentViewComponent {}
