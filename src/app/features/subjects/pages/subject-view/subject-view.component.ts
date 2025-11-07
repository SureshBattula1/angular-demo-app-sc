import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { SubjectService } from '../../services/subject.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { Subject } from '../../../../core/models/subject.model';

@Component({
  selector: 'app-subject-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './subject-view.component.html',
  styleUrls: ['./subject-view.component.scss']
})
export class SubjectViewComponent implements OnInit {
  subject?: Subject;
  isLoading = true;
  subjectId!: number;
  returnTab?: string;

  // Permission checks
  hasEditPermission = false;
  hasDeletePermission = false;

  constructor(
    private subjectService: SubjectService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private permissionService: PermissionService
  ) {
    this.hasEditPermission = this.permissionService.hasPermission('subjects.edit');
    this.hasDeletePermission = this.permissionService.hasPermission('subjects.delete');
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.subjectId = +params['id'];
        this.loadSubject();
      }
    });
    
    // Capture returnTab from query parameters
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'];
    });
  }

  loadSubject(): void {
    this.isLoading = true;
    
    this.subjectService.getSubject(this.subjectId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.subject = response.data;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/subjects'], { queryParams: { tab: this.returnTab } });
      }
    });
  }

  onEdit(): void {
    if (!this.hasEditPermission) {
      this.errorHandler.showError('You do not have permission to edit subjects');
      return;
    }
    this.router.navigate(['/subjects/edit', this.subjectId], {
      queryParams: { returnTab: this.returnTab }
    });
  }

  onDelete(): void {
    if (!this.hasDeletePermission) {
      this.errorHandler.showError('You do not have permission to delete subjects');
      return;
    }
    
    if (confirm(`Are you sure you want to delete subject "${this.subject?.name}"?`)) {
      this.subjectService.deleteSubject(this.subjectId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.errorHandler.showSuccess('Subject deleted successfully');
            this.router.navigate(['/subjects'], { queryParams: { tab: this.returnTab } });
          }
        },
        error: (error: any) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/subjects'], { queryParams: { tab: this.returnTab } });
  }
}
