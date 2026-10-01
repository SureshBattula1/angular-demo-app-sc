import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { AssignmentService } from '../../services/assignment.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { MediaUrlService } from '../../../../core/services/media-url.service';
import { ImagePreviewService } from '../../../../shared/services/image-preview.service';
import { Assignment, AssignmentAttachment } from '../../../../core/models/assignment.model';

@Component({
  selector: 'app-assignment-view',
  standalone: true,
  imports: [CommonModule, MaterialModule, HasPermissionDirective],
  templateUrl: './assignment-view.component.html',
  styleUrls: ['./assignment-view.component.scss']
})
export class AssignmentViewComponent implements OnInit {
  loading = false;
  assignment: Assignment | null = null;
  assignmentId?: string;

  constructor(
    private assignmentService: AssignmentService,
    private errorHandler: ErrorHandlerService,
    private mediaUrl: MediaUrlService,
    private imagePreview: ImagePreviewService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.assignmentId = this.route.snapshot.paramMap.get('id') || undefined;
    if (!this.assignmentId) {
      this.router.navigate(['/assignments']);
      return;
    }
    this.loadAssignment(this.assignmentId);
  }

  classLabel(): string {
    if (!this.assignment) {
      return '-';
    }
    const section = this.assignment.section?.trim();
    const parts = [this.assignment.grade, section || (this.assignment.grade ? 'All sections' : '')].filter(Boolean);
    return parts.join(' · ') || this.assignment.class_name || '-';
  }

  audienceLabel(): string {
    if (this.assignment?.audience_mode === 'custom') {
      return 'Selected students';
    }
    return 'All students in class';
  }

  statusClass(): string {
    const status = this.assignment?.status;
    if (status === 'Draft') {
      return 'status-draft';
    }
    if (status === 'Due') {
      return 'status-due';
    }
    return 'status-published';
  }

  attachmentName(file: AssignmentAttachment): string {
    return file.original_name || file.file_name || 'Attachment';
  }

  attachmentUrl(file: AssignmentAttachment): string {
    return this.mediaUrl.resolve(file.file_url || file.file_path);
  }

  isImageAttachment(file: AssignmentAttachment): boolean {
    const type = (file.file_type || '').toLowerCase();
    const name = this.attachmentName(file).toLowerCase();
    return type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(name);
  }

  previewAttachment(file: AssignmentAttachment): void {
    const url = this.attachmentUrl(file);
    if (!url) {
      return;
    }
    if (this.isImageAttachment(file)) {
      this.imagePreview.openImage(this.attachmentName(file), url);
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  onBack(): void {
    this.router.navigate(['/assignments']);
  }

  onEdit(): void {
    if (!this.assignment?.can_edit || !this.assignmentId) {
      return;
    }
    this.router.navigate(['/assignments/edit', this.assignmentId]);
  }

  onDelete(): void {
    if (!this.assignment?.can_edit || !this.assignmentId) {
      this.errorHandler.showError('Only the teacher who created this assignment can delete it.');
      return;
    }
    if (!confirm(`Delete assignment "${this.assignment.title}"? This cannot be undone.`)) {
      return;
    }
    this.assignmentService.deleteAssignment(this.assignmentId).subscribe({
      next: response => {
        if (response.success) {
          this.errorHandler.showSuccess(response.message || 'Assignment deleted');
          this.router.navigate(['/assignments']);
        } else {
          this.errorHandler.showError(response.message || 'Failed to delete assignment');
        }
      },
      error: error => this.errorHandler.showError(error)
    });
  }

  private loadAssignment(id: string): void {
    this.loading = true;
    this.assignmentService.getAssignment(id).subscribe({
      next: response => {
        this.assignment = response.data || null;
        if (!this.assignment) {
          this.errorHandler.showError('Assignment not found');
          this.router.navigate(['/assignments']);
        }
        this.loading = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.router.navigate(['/assignments']);
      }
    });
  }
}
