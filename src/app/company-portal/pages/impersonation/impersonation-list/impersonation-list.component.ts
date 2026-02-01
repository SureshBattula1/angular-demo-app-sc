import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ImpersonationService } from '../../../services/impersonation.service';

@Component({
  selector: 'app-impersonation-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule
  ],
  template: `
    <div class="impersonation-list-container">
      <h1>Virtual Onboarding</h1>
      <mat-card>
        <p>Impersonation list component - to be implemented</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .impersonation-list-container {
      padding: 24px;
    }
  `]
})
export class ImpersonationListComponent implements OnInit {
  constructor(
    private impersonationService: ImpersonationService
  ) {}

  ngOnInit(): void {
    this.impersonationService.getActiveSessions().subscribe();
  }
}

