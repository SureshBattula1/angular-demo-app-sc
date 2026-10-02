import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ImagePreviewDialogComponent,
  ImagePreviewDialogData
} from '../components/image-preview-dialog/image-preview-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ImagePreviewService {
  private dialog = inject(MatDialog);

  openImage(title: string, imageUrl: string): void {
    if (!imageUrl?.trim()) {
      return;
    }
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { title, imageUrl } satisfies ImagePreviewDialogData,
      maxWidth: '95vw',
      panelClass: 'image-preview-dialog-panel'
    });
  }
}
