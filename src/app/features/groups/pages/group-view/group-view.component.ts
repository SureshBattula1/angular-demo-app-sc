import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { GroupService } from '../../services/group.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentGroup } from '../../../../core/models/class-section.model';

@Component({
  selector: 'app-group-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './group-view.component.html',
  styleUrls: ['./group-view.component.scss']
})
export class GroupViewComponent implements OnInit {
  group?: StudentGroup;
  isLoading = true;
  groupId!: number;

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.groupId = +params['id'];
        this.loadGroup();
      }
    });
  }

  loadGroup(): void {
    this.isLoading = true;
    
    this.groupService.getGroup(this.groupId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.group = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/groups']);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/groups/edit', this.groupId]);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete group "${this.group?.name}"?`)) {
      this.groupService.deleteGroup(this.groupId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Group deleted successfully');
            this.router.navigate(['/groups']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/groups']);
  }

  manageMembers(): void {
    this.router.navigate(['/groups', this.groupId, 'members']);
  }

  getTypeIcon(type?: string): string {
    const icons: Record<string, string> = {
      'Academic': 'school',
      'Sports': 'sports',
      'Cultural': 'theater_comedy',
      'Club': 'groups'
    };
    return type ? icons[type] || 'groups' : 'groups';
  }

  getTypeColor(type?: string): string {
    const colors: Record<string, string> = {
      'Academic': 'primary',
      'Sports': 'accent',
      'Cultural': 'warn',
      'Club': 'primary'
    };
    return type ? colors[type] || 'primary' : 'primary';
  }
}

