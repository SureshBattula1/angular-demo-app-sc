import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  constructor(
    private fileUploadService: FileUploadService,
    private http: HttpClient
  ) {}

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
    if (!this.moduleId || this.moduleId === 0) {
      console.log('No moduleId provided, cannot load attachments', this.moduleId);
      return;
    }
    
    this.isLoading = true;
    
    // Load attachments from the database using the attachments API
    const apiUrl = `${environment.apiUrl}/attachments/${this.module}/${this.moduleId}`;
    console.log('Loading attachments from:', apiUrl);
    
    this.http.get(apiUrl).subscribe({
      next: (response: any) => {
        console.log('Attachments API response:', response);
        this.isLoading = false;
        if (response.success && response.data) {
          console.log('Attachments data:', response.data);
          // Map the response data to our Attachment interface
          this.attachments = response.data.map((file: any) => ({
            id: file.id || Date.now() + Math.random(),
            attachment_type: file.attachment_type || this.module,
            file_name: file.file_name || file.name,
            file_path: file.file_path || file.path,
            file_type: file.file_type || file.type,
            file_size: file.file_size || file.size || 0,
            original_name: file.original_name || file.file_name || file.name,
            description: file.description || '',
            created_at: file.created_at || new Date().toISOString()
          }));
          console.log('Mapped attachments:', this.attachments);
        } else {
          console.log('No attachments in response or response not successful');
          this.attachments = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading attachments:', error);
        this.isLoading = false;
        this.attachments = [];
      }
    });
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
          // Now save to database
          this.saveAttachmentToDatabase({
            attachment_type: this.module,
            file_name: response.data.file_name,
            file_path: response.data.file_path,
            file_type: response.data.file_type,
            file_size: response.data.file_size,
            original_name: input.file!.name,
            description: input.description
          });
          
          // Mark as completed
          input.isCompleted = true;
          input.name = '';
          input.description = '';
          input.file = null;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Upload error:', error);
        alert('Failed to upload attachment');
        this.isLoading = false;
      }
    });
  }

  saveAttachmentToDatabase(attachmentData: any): void {
    const apiUrl = `${environment.apiUrl}/attachments/save`;
    const payload = {
      module: this.module,
      module_id: this.moduleId,
      ...attachmentData
    };
    
    this.http.post(apiUrl, payload).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const newAttachment: Attachment = {
            id: response.data.id,
            attachment_type: response.data.attachment_type,
            file_name: response.data.file_name,
            file_path: response.data.file_path,
            file_type: response.data.file_type,
            file_size: response.data.file_size,
            original_name: response.data.original_name,
            description: response.data.description,
            created_at: response.data.created_at
          };
          
          // Update attachments list if this is a reload, otherwise add new
          const existingIndex = this.attachments.findIndex(a => !a.id || a.id === response.data.id);
          if (existingIndex >= 0) {
            this.attachments[existingIndex] = newAttachment;
          } else {
            this.attachments.push(newAttachment);
          }
          
          this.attachmentsUploaded.emit([newAttachment]);
          alert('Attachment saved successfully');
        }
      },
      error: (error: any) => {
        console.error('Error saving attachment to database:', error);
        alert('Attachment uploaded but not saved to database');
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
            // Now save to database
            this.saveAttachmentToDatabase({
              attachment_type: this.module,
              file_name: response.data.file_name,
              file_path: response.data.file_path,
              file_type: response.data.file_type,
              file_size: response.data.file_size,
              original_name: file.name,
              description: attachment.description || ''
            });
            
            // Remove from pending list
            const index = this.attachments.findIndex(a => a.id === attachment.id);
            if (index >= 0) {
              this.attachments.splice(index, 1);
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

  previewUploadedFile(attachment: Attachment): void {
    if (!attachment.file_path) {
      alert('Attachment is pending upload. Please save the ' + this.module + ' first.');
      return;
    }
    
    const fileName = attachment.original_name?.toLowerCase() || attachment.file_name?.toLowerCase() || '';
    const fileType = attachment.file_type?.toLowerCase() || '';
    
    // Construct the public URL for the file
    // Laravel public storage files are accessible at: http://localhost:8004/storage/{file_path}
    const baseUrl = environment.apiUrl.replace('/api', '');
    const fileUrl = `${baseUrl}/storage/${attachment.file_path}`;
    console.log('Preview file URL:', fileUrl);
    
    // Check if it's an image
    if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head><title>Preview - ${attachment.original_name}</title></head>
            <body style="margin:0; padding:20px; font-family:Arial; background:#f5f5f5;">
              <h2>${attachment.original_name}</h2>
              <img src="${fileUrl}" style="max-width:100%; height:auto; border:1px solid #ddd; padding:10px; background:white;" onerror="alert('Failed to load image. Please check if the file exists.')" />
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
      return;
    }
    
    // Check if it's a PDF
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head><title>Preview - ${attachment.original_name}</title></head>
            <body style="margin:0; padding:0;">
              <iframe src="${fileUrl}" style="width:100%; height:100vh; border:none;" onerror="alert('Failed to load PDF. Please download the file to view it.')"></iframe>
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
      return;
    }
    
    // For other file types, show file info or download
    alert(`Preview not available for ${attachment.original_name}.\nFile size: ${this.formatFileSize(attachment.file_size)}\nFile type: ${fileType || 'Unknown'}\n\nYou can download this file to view it.`);
  }

  downloadAttachment(attachment: Attachment): void {
    // If pending, can't download yet
    if (!attachment.file_path) {
      alert('Attachment is pending upload. Please save the ' + this.module + ' first.');
      return;
    }
    
    // Download using the attachments API
    const downloadUrl = `${environment.apiUrl}/attachments/${this.module}/${this.moduleId}/${attachment.id}/download`;
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = attachment.original_name || attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteAttachment(attachment: Attachment): void {
    if (confirm(`Are you sure you want to delete "${attachment.original_name}"?`)) {
      // If pending, just remove from list
      if (!attachment.file_path) {
        this.attachments = this.attachments.filter(a => a.id !== attachment.id);
        return;
      }
      
      // Delete using the attachments API
      const deleteUrl = `${environment.apiUrl}/attachments/${this.module}/${this.moduleId}/${attachment.id}`;
      this.http.delete(deleteUrl).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.attachments = this.attachments.filter(a => a.id !== attachment.id);
            alert('Attachment deleted successfully');
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

