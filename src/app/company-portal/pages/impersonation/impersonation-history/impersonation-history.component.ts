import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ImpersonationService } from '../../../services/impersonation.service';

@Component({
  selector: 'app-impersonation-history',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="impersonation-history-container">
      <h1>Impersonation History</h1>
      <mat-card>
        <p>Impersonation history component - to be implemented</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .impersonation-history-container {
      padding: 24px;
    }
  `]
})
export class ImpersonationHistoryComponent implements OnInit {
  constructor(
    private impersonationService: ImpersonationService
  ) {}

  ngOnInit(): void {
    this.impersonationService.getSessionHistory().subscribe();
  }
}

