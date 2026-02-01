import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CompanyService } from '../../../services/company.service';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="company-list-container">
      <div class="header">
        <h1>Companies</h1>
        <button mat-raised-button color="primary" routerLink="/company-portal/companies/create">
          <mat-icon>add</mat-icon>
          Add Company
        </button>
      </div>
      <mat-card>
        <p>Company list component - to be implemented</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .company-list-container {
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
  `]
})
export class CompanyListComponent implements OnInit {
  companies = signal<any[]>([]);

  constructor(
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.companyService.getCompanies().subscribe(response => {
      if (response.success && response.data) {
        this.companies.set(response.data);
      }
    });
  }
}

