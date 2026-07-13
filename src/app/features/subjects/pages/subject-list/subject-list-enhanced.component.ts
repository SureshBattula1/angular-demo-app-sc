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
  templateUrl: './subject-list-enhanced.component.html',
  styleUrls: ['./subject-list-enhanced.component.scss']
})
export class SubjectListEnhancedComponent implements OnInit {
  activeTab: 'subjects' | 'assignments' = 'subjects';
  loadedTabs = new Set<string>(['subjects']); // Track which tabs have been loaded for lazy loading
  subjectCount = 0;
  assignmentCount = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check query params for tab selection
    this.route.queryParams.subscribe(params => {
      // Check for returnTab first (when coming back from view/edit), then tab
      const targetTab = params['returnTab'] || params['tab'];
      
      if (targetTab === 'assignments') {
        this.activeTab = 'assignments';
        // Mark as loaded when switching via query params
        this.loadedTabs.add('assignments');
      } else {
        this.activeTab = 'subjects';
        // Subjects is loaded by default
        this.loadedTabs.add('subjects');
      }
    });
  }

  /**
   * Handle tab/menu click with lazy loading
   * Only load data when user clicks on a tab for the first time
   */
  switchTab(tab: 'subjects' | 'assignments'): void {
    this.activeTab = tab;
    
    // Mark tab as loaded for lazy loading
    if (!this.loadedTabs.has(tab)) {
      this.loadedTabs.add(tab);
    }
    
    // Update URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Check if a tab has been loaded (for lazy loading)
   */
  isTabLoaded(tab: string): boolean {
    return this.loadedTabs.has(tab);
  }
}
