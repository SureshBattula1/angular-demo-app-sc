import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="company-form-container">
      <mat-card>
        <p>Company form component - to be implemented</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .company-form-container {
      padding: 24px;
    }
  `]
})
export class CompanyFormComponent {}

