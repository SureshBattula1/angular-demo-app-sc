import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../modules/material/material.module';
import { FileUploadService, FileUploadResponse } from '../../../core/services/file-upload.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface FileUploadConfig {
  maxSize?: number; // in MB
  allowedTypes?: string[];
  multiple?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  showFileList?: boolean;
  maxFiles?: number;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit, OnDestroy {
  @Input() entityId?: number | string;
  @Input() module?: string;
  @Input() fileType: string = 'attachment';
  @Input() uploadPath?: string;
  @Input() config: FileUploadConfig = {
    maxSize: 5,
    allowedTypes: [],
    multiple: false,
    showPreview: true,
    showProgress: true,
    showFileList: true,
    maxFiles: 5
  };
  @Input() accept: string = '*/*';
  @Input() label: string = 'Upload File';
  @Input() icon: string = 'cloud_upload';
  @Input() disabled: boolean = false;

  @Output() uploadSuccess = new EventEmitter<FileUploadResponse['data']>();
  @Output() uploadError = new EventEmitter<string>();
  @Output() fileSelected = new EventEmitter<File>();
  @Output() filesChanged = new EventEmitter<File[]>();

  uploadedFiles: Array<FileUploadResponse['data'] & { file?: File }> = [];
  selectedFiles: File[] = [];
  isUploading = false;
  uploadProgress = 0;
  isDragging = false;
  previewUrls: Map<File, SafeUrl> = new Map();
  uniqueId = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fileUploadService: FileUploadService,
    private errorHandler: ErrorHandlerService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Generate unique ID for this component instance
    this.uniqueId = `file-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupPreviews();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    this.handleFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (this.disabled || this.isUploading) return;

    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  private handleFiles(files: File[]): void {
    // Validate file count
    if (!this.config.multiple && files.length > 1) {
      this.errorHandler.showError('Please select only one file');
      return;
    }

    if (this.config.maxFiles && files.length > this.config.maxFiles) {
      this.errorHandler.showError(`Maximum ${this.config.maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    files.forEach(file => {
      const validation = this.fileUploadService.validateFile(
        file,
        this.config.maxSize || 5,
        this.config.allowedTypes?.length ? this.config.allowedTypes : undefined
      );

      if (!validation.valid) {
        this.errorHandler.showError(`${file.name}: ${validation.error}`);
        return;
      }

      validFiles.push(file);

      // Generate preview if image
      if (this.isImageFile(file)) {
        this.generatePreview(file);
      }
    });

    if (validFiles.length === 0) return;

    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    this.filesChanged.emit(this.selectedFiles);

    // Auto upload if configured
    validFiles.forEach(file => {
      this.uploadFile(file);
    });
  }

  uploadFile(file: File): void {
    // Generate upload path if not provided
    let path = this.uploadPath;
    
    if (!path) {
      const extension = this.fileUploadService.getFileExtension(file.name);
      
      // Generate path based on module and file type
      if (this.module === 'branch' && this.fileType === 'logo') {
        path = this.fileUploadService.buildBranchLogoPath(extension);
      } else if (this.module === 'teacher' && this.fileType === 'profile_picture') {
        path = this.fileUploadService.buildTeacherProfilePath(extension);
      } else if (this.module === 'student' && this.fileType === 'profile_picture') {
        path = this.fileUploadService.buildStudentProfilePath(extension);
      } else if (this.module === 'parent' && this.fileType === 'profile_picture') {
        path = this.fileUploadService.buildParentProfilePath(extension);
      } else if (this.module && this.fileType) {
        // Generic path for any module/file type
        path = this.fileUploadService.buildCustomPath(`${this.fileType}s/${this.module}`, extension);
      } else {
        this.errorHandler.showError('Upload path not configured');
        return;
      }
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    this.fileUploadService.uploadFile(file, path)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: FileUploadResponse) => {
          if (response.success && response.data) {
            this.uploadedFiles.push({ ...response.data, file });
            this.uploadSuccess.emit(response.data);
            this.fileSelected.emit(file);
          }
          this.isUploading = false;
          this.uploadProgress = 100;
        },
        error: (error: any) => {
          this.isUploading = false;
          this.uploadError.emit(error);
          this.errorHandler.showError(error);
        }
      });
  }

  uploadAllFiles(): void {
    if (this.selectedFiles.length === 0) return;

    this.selectedFiles.forEach(file => this.uploadFile(file));
  }

  removeFile(index: number): void {
    const uploadedFile = this.uploadedFiles[index];
    
    // Delete from server if path exists
    if (uploadedFile?.file_path) {
      this.fileUploadService.deleteFile(uploadedFile.file_path).subscribe({
        next: () => {
          this.uploadedFiles.splice(index, 1);
          this.errorHandler.showSuccess('File removed successfully');
        },
        error: (error) => {
          this.errorHandler.showError('Failed to remove file');
        }
      });
    } else {
      // Just remove from local list if not uploaded
      this.uploadedFiles.splice(index, 1);
      this.selectedFiles.splice(index, 1);
    }
  }

  clearAll(): void {
    // Delete all uploaded files from server
    this.uploadedFiles.forEach(file => {
      if (file.file_path) {
        this.fileUploadService.deleteFile(file.file_path).subscribe();
      }
    });

    this.uploadedFiles = [];
    this.selectedFiles = [];
    this.cleanupPreviews();
    this.filesChanged.emit([]);
  }

  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private generatePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const safeUrl = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
      this.previewUrls.set(file, safeUrl);
    };
    reader.readAsDataURL(file);
  }

  private cleanupPreviews(): void {
    this.previewUrls.forEach(url => {
      if (url && typeof url === 'string') {
        URL.revokeObjectURL(url);
      }
    });
    this.previewUrls.clear();
  }

  getPreviewUrl(file: FileUploadResponse['data'] & { file?: File }): SafeUrl | null {
    if (file.file) {
      return this.previewUrls.get(file.file) || null;
    }
    return file.file_url ? this.sanitizer.bypassSecurityTrustUrl(file.file_url) : null;
  }

  getFileIcon(file: FileUploadResponse['data']): string {
    if (!file) return 'description';
    
    const ext = file.extension?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext || '')) {
      return 'image';
    }
    if (['pdf'].includes(ext || '')) {
      return 'picture_as_pdf';
    }
    if (['doc', 'docx'].includes(ext || '')) {
      return 'description';
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return 'table_chart';
    }
    
    return 'description';
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }
}

