import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../modules/material/material.module';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { environment } from '../../../../environments/environment';

interface Attachment {
  id: number;
  attachment_type: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  original_name: string;
  description?: string;
  created_at: string;
  pendingFile?: File; // Store file for pending uploads
}

interface AttachmentInput {
  id: number;
  name: string;
  description: string;
  file: File | null;
  isCompleted: boolean;
}

@Component({
  selector: 'app-universal-attachments',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './universal-attachments.component.html',
  styleUrls: ['./universal-attachments.component.scss']
})
export class UniversalAttachmentsComponent implements OnInit, OnChanges {
  @Input() module!: string; // 'branch', 'teacher', etc.
  @Input() moduleId!: number | null;
  @Input() mode: 'view' | 'form' = 'form';
  @Output() attachmentsUploaded = new EventEmitter<Attachment[]>();

  attachments: Attachment[] = [];
  isLoading = false;
  attachmentInputs: AttachmentInput[] = [];
  maxAttachments = 5;

  constructor(private fileUploadService: FileUploadService) {}

  ngOnInit(): void {
    if (this.moduleId) {
      this.loadAttachments();
    }
  }

  ngOnChanges(): void {
    if (this.moduleId) {
      this.loadAttachments();
    }
  }

  loadAttachments(): void {
    if (!this.moduleId || this.moduleId === 0) return;
    this.isLoading = false;
  }

  canAddMore(): boolean {
    // Always allow adding if under limit and no incomplete sections
    const hasIncomplete = this.attachmentInputs.some(input => !input.isCompleted);
    return this.attachmentInputs.length < this.maxAttachments && !hasIncomplete;
  }

  canSaveAttachment(index: number): boolean {
    const input = this.attachmentInputs[index];
    // Can save if has name and file (moduleId check happens in upload)
    return !!(input.name && input.file);
  }

  addAttachmentInput(): void {
    if (this.canAddMore()) {
      this.attachmentInputs.push({
        id: Date.now(),
        name: '',
        description: '',
        file: null,
        isCompleted: false
      });
    }
  }

  removeAttachmentInput(index: number): void {
    this.attachmentInputs.splice(index, 1);
  }

  onFileSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.attachmentInputs[index].file = input.files[0];
    }
  }

  saveAttachment(index: number): void {
    const input = this.attachmentInputs[index];
    
    if (!input.name || !input.file) {
      alert('Please fill in attachment name and select a file');
      return;
    }

    if (!this.moduleId || this.moduleId === 0) {
      // Store locally without uploading - keep the file reference for upload
      const newAttachment: Attachment = {
        id: Date.now() + Math.random(),
        attachment_type: this.module,
        file_name: input.file.name,
        file_path: '', // Will be set when uploaded
        file_type: input.file.name.split('.').pop() || '',
        file_size: input.file.size,
        original_name: input.file.name,
        description: input.description,
        created_at: new Date().toISOString(),
        pendingFile: input.file // Store the file for later upload
      };
      
      this.attachments.push(newAttachment);
      
      // Mark as completed and clear input
      input.isCompleted = true;
      input.name = '';
      input.description = '';
      input.file = null;
      
      alert('Attachment ready. It will be uploaded automatically when you save the ' + this.module + '.');
      return;
    }

    this.isLoading = true;

    // Use module name as attachment type
    const uploadPath = `attachments/${this.module}/${this.moduleId}/${this.module}`;

    // Upload the single file
    this.fileUploadService.uploadFile(input.file, uploadPath).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const newAttachment: Attachment = {
            id: Date.now() + Math.random(),
            attachment_type: this.module,
            file_name: response.data.file_name,
            file_path: response.data.file_path,
            file_type: response.data.file_type,
            file_size: response.data.file_size,
            original_name: input.file!.name,
            description: input.description,
            created_at: new Date().toISOString()
          };
          
          this.attachments.push(newAttachment);
          this.attachmentsUploaded.emit([newAttachment]);
          
          // Mark as completed
          input.isCompleted = true;
          this.isLoading = false;
          alert('Attachment uploaded successfully');
        }
      },
      error: (error: any) => {
        console.error('Upload error:', error);
        alert('Failed to upload attachment');
        this.isLoading = false;
      }
    });
  }

  uploadPendingAttachments(): void {
    // Upload all attachments that don't have file_path yet (pending uploads)
    const pendingAttachments = this.attachments.filter(a => !a.file_path && a.pendingFile);
    
    if (pendingAttachments.length === 0 || !this.moduleId || this.moduleId === 0) {
      return;
    }

    pendingAttachments.forEach((attachment) => {
      if (!attachment.pendingFile) return;
      
      const file = attachment.pendingFile;
      const uploadPath = `attachments/${this.module}/${this.moduleId}/${this.module}`;
      
      this.fileUploadService.uploadFile(file, uploadPath).subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            // Update attachment with file path and remove pending flag
            const index = this.attachments.findIndex(a => a.id === attachment.id);
            if (index >= 0) {
              this.attachments[index].file_path = response.data.file_path;
              this.attachments[index].file_name = response.data.file_name;
              delete this.attachments[index].pendingFile; // Remove pending flag
            }
          }
        },
        error: (error: any) => {
          console.error('Upload pending attachment error:', error);
        }
      });
    });
  }

  triggerFileInput(index: number, event: MouseEvent): void {
    event.preventDefault();
    const input = document.getElementById(`fileInput${index}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  previewFile(file: File | null): void {
    if (!file) return;
    
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Check if it's an image
    if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const modal = window.open('', '_blank');
        if (modal) {
          modal.document.write(`
            <html>
              <head><title>Preview - ${file.name}</title></head>
              <body style="margin:0; padding:20px; font-family:Arial; background:#f5f5f5;">
                <h2>${file.name}</h2>
                <img src="${e.target.result}" style="max-width:100%; height:auto; border:1px solid #ddd; padding:10px; background:white;" />
              </body>
            </html>
          `);
          modal.document.close();
        }
      };
      reader.readAsDataURL(file);
      return;
    }
    
    // Check if it's a PDF
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const modal = window.open('', '_blank');
        if (modal) {
          modal.document.write(`
            <html>
              <head><title>Preview - ${file.name}</title></head>
              <body style="margin:0; padding:0;">
                <iframe src="${e.target.result}" style="width:100%; height:100vh; border:none;"></iframe>
              </body>
            </html>
          `);
          modal.document.close();
        }
      };
      reader.readAsDataURL(file);
      return;
    }
    
    // For other file types, show file info
    alert(`Preview not available for ${file.name}.\nFile size: ${this.formatFileSize(file.size)}\nFile type: ${file.type || 'Unknown'}`);
  }

  downloadAttachment(attachment: Attachment): void {
    // If pending, can't download yet
    if (!attachment.file_path) {
      alert('Attachment is pending upload. Please save the ' + this.module + ' first.');
      return;
    }
    
    // Download using file path from upload service
    const downloadUrl = `${environment.apiUrl.replace('/api', '')}/storage/${attachment.file_path}`;
    window.open(downloadUrl, '_blank');
  }

  deleteAttachment(attachment: Attachment): void {
    if (confirm(`Are you sure you want to delete "${attachment.original_name}"?`)) {
      // If pending, just remove from list
      if (!attachment.file_path) {
        this.attachments = this.attachments.filter(a => a.id !== attachment.id);
        return;
      }
      
      // Delete using FileUploadService
      this.fileUploadService.deleteFile(attachment.file_path).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.attachments = this.attachments.filter(a => a.id !== attachment.id);
          }
        },
        error: (error: any) => {
          console.error('Delete error:', error);
          alert('Failed to delete attachment');
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    }
    return bytes + ' bytes';
  }

  getAttachmentTypeLabel(type: string): string {
    // Return capitalized module name
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  getFileIcon(fileType: string): string {
    const icons: Record<string, string> = {
      'pdf': 'picture_as_pdf',
      'doc': 'description',
      'docx': 'description',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'xlsx': 'table_chart',
      'xls': 'table_chart',
      'csv': 'table_chart',
      'zip': 'archive',
      'rar': 'archive'
    };
    return icons[fileType?.toLowerCase()] || 'insert_drive_file';
  }

  getPendingCount(): number {
    return this.attachments.filter(a => !a.file_path && a.pendingFile).length;
  }
}

