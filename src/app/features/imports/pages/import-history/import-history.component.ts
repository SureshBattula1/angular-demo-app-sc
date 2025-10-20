import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { ImportService } from '../../services/import.service';
import { ImportHistory } from '../../../../core/models/import.model';

@Component({
  selector: 'app-import-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="import-history-container">
      <div class="header">
        <h1>Import History</h1>
        <button mat-raised-button color="primary" routerLink="/imports">
          <mat-icon>add</mat-icon>
          New Import
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <div *ngIf="loading" class="loading">
            <mat-spinner></mat-spinner>
            <p>Loading import history...</p>
          </div>

          <div *ngIf="!loading && history.length > 0" class="table-container">
            <table mat-table [dataSource]="history" class="history-table">
              <ng-container matColumnDef="batch_id">
                <th mat-header-cell *matHeaderCellDef>Batch ID</th>
                <td mat-cell *matCellDef="let record">{{ record.batch_id }}</td>
              </ng-container>

              <ng-container matColumnDef="entity_type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let record">
                  <mat-chip>{{ record.entity_type }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="file_name">
                <th mat-header-cell *matHeaderCellDef>File Name</th>
                <td mat-cell *matCellDef="let record">{{ record.file_name }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let record">
                  <mat-chip [class]="record.status">{{ record.status }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="records">
                <th mat-header-cell *matHeaderCellDef>Records</th>
                <td mat-cell *matCellDef="let record">
                  {{ record.imported_rows }} / {{ record.total_rows }}
                </td>
              </ng-container>

              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let record">
                  {{ formatDate(record.created_at) }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator
              [length]="totalRecords"
              [pageSize]="pageSize"
              [pageSizeOptions]="[25, 50, 100]"
              (page)="onPageChange($event)"
            ></mat-paginator>
          </div>

          <div *ngIf="!loading && history.length === 0" class="no-data">
            <mat-icon>inbox</mat-icon>
            <p>No import history found</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .import-history-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .loading, .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
    }
    .history-table {
      width: 100%;
    }
    mat-chip.completed { background-color: #4caf50; color: white; }
    mat-chip.failed { background-color: #f44336; color: white; }
    mat-chip.importing { background-color: #ff9800; color: white; }
  `]
})
export class ImportHistoryComponent implements OnInit {
  history: ImportHistory[] = [];
  loading = true;
  currentPage = 1;
  pageSize = 25;
  totalRecords = 0;
  displayedColumns = ['batch_id', 'entity_type', 'file_name', 'status', 'records', 'created_at'];

  constructor(
    private importService: ImportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(page: number = 1): void {
    this.loading = true;
    this.importService.getHistory(page, this.pageSize).subscribe({
      next: (response) => {
        this.history = response.data;
        this.totalRecords = response.meta.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(event: any): void {
    this.loadHistory(event.pageIndex + 1);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}

