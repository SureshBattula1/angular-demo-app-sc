import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { SubjectListComponent } from './subject-list.component';
import { AssignedSubjectsListComponent } from '../assigned-subjects-list/assigned-subjects-list.component';

@Component({
  selector: 'app-subject-list-enhanced',
  standalone: true,
  imports: [CommonModule, MaterialModule, SubjectListComponent, AssignedSubjectsListComponent],
  template: `
    <div class="page-container">
      <!-- Tabbed Interface -->
      <div class="tabs-container">
        <!-- Tab Header -->
        <div class="tabs-header">
          <button 
            class="tab-item" 
            [class.active]="activeTab === 'subjects'"
            (click)="switchTab('subjects')">
            <div class="tab-label-full">
              <mat-icon>menu_book</mat-icon>
              All Subjects
              <span class="tab-badge" *ngIf="subjectCount > 0">{{ subjectCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>menu_book</mat-icon>
              Subjects
              <span class="tab-badge" *ngIf="subjectCount > 0">{{ subjectCount }}</span>
            </div>
          </button>
          
          <button 
            class="tab-item" 
            [class.active]="activeTab === 'assignments'"
            (click)="switchTab('assignments')">
            <div class="tab-label-full">
              <mat-icon>assignment_turned_in</mat-icon>
              Assigned Subjects
              <span class="tab-badge" *ngIf="assignmentCount > 0">{{ assignmentCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>assignment_turned_in</mat-icon>
              Assignments
              <span class="tab-badge" *ngIf="assignmentCount > 0">{{ assignmentCount }}</span>
            </div>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tabs-content">
          <!-- Subjects Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'subjects'">
            <app-subject-list></app-subject-list>
          </div>

          <!-- Assignments Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'assignments'">
            <app-assigned-subjects-list></app-assigned-subjects-list>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-container { max-width: 1600px; margin: 0 auto; }
    
    /* tabs.css provides all styling - just padding override */
    .tab-content {
      padding: 0;
    }
  `]
})
export class SubjectListEnhancedComponent implements OnInit {
  activeTab: 'subjects' | 'assignments' = 'subjects';
  subjectCount = 0;
  assignmentCount = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check query params for tab selection
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'assignments') {
        this.activeTab = 'assignments';
      } else {
        this.activeTab = 'subjects';
      }
    });
  }

  switchTab(tab: 'subjects' | 'assignments'): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }
}

