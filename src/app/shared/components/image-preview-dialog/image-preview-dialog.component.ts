import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../modules/material/material.module';

export interface ImagePreviewDialogData {
  title: string;
  imageUrl: string;
}

@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="preview-content">
      <div *ngIf="imageLoading && !loadFailed" class="preview-loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading image…</p>
      </div>
      <img
        *ngIf="!loadFailed"
        [src]="data.imageUrl"
        [alt]="data.title"
        class="preview-image"
        [class.preview-image-visible]="imageLoaded"
        (load)="onImageLoad()"
        (error)="onImageError()"
      />
      <p *ngIf="loadFailed" class="preview-error">Could not load this image.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .preview-content {
      min-width: min(90vw, 520px);
      max-width: min(95vw, 720px);
      min-height: 120px;
      padding-top: 8px;
      position: relative;
    }
    .preview-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px;
      color: rgba(0, 0, 0, 0.6);
    }
    .preview-image {
      display: block;
      max-width: 100%;
      max-height: 70vh;
      margin: 0 auto;
      object-fit: contain;
      border-radius: 8px;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .preview-image-visible {
      opacity: 1;
    }
    .preview-error {
      color: var(--mat-sys-error, #b00020);
      text-align: center;
      padding: 24px;
    }
  `]
})
export class ImagePreviewDialogComponent {
  imageLoading = true;
  imageLoaded = false;
  loadFailed = false;

  data = inject<ImagePreviewDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ImagePreviewDialogComponent>);

  onImageLoad(): void {
    this.imageLoading = false;
    this.imageLoaded = true;
  }

  onImageError(): void {
    this.imageLoading = false;
    this.loadFailed = true;
  }
}
