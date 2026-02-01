import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-school-view',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="school-view-container">
      <mat-card>
        <p>School view component - to be implemented</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .school-view-container {
      padding: 24px;
    }
  `]
})
export class SchoolViewComponent {}

