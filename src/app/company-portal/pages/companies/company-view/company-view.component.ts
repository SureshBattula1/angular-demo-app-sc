import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-company-view',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="company-view-container">
      <mat-card>
        <p>Company view component - to be implemented</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .company-view-container {
      padding: 24px;
    }
  `]
})
export class CompanyViewComponent {}

