import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { LibraryService } from '../../../services/library.service';
import { LibraryStockVerification } from '../../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-stock-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './stock-verification.component.html',
  styleUrls: ['./stock-verification.component.scss']
})
export class StockVerificationComponent implements OnInit {
  activeSession: LibraryStockVerification | null = null;
  pastSessions: LibraryStockVerification[] = [];
  scanBarcode = '';
  recentScans: { barcode: string; title: string; time: Date }[] = [];

  constructor(
    private libraryService: LibraryService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.libraryService.getStockAudits().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.activeSession = list.find((s) => s.status === 'In Progress') || null;
        this.pastSessions = list;
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  startSession(): void {
    const title = prompt('Enter title for this stock verification session:', `Audit Session ${new Date().toLocaleDateString()}`);
    if (!title) { return; }

    const branchId = this.auth.currentUser()?.branch_id || 1;
    this.libraryService.startStockAudit({ branch_id: branchId, session_title: title }).subscribe({
      next: (res) => {
        this.activeSession = res.data || null;
        this.recentScans = [];
        this.loadSessions();
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  onBarcodeScanned(): void {
    const code = this.scanBarcode.trim();
    if (!code || !this.activeSession) { return; }

    this.libraryService.scanAuditBarcode(this.activeSession.id, { barcode: code }).subscribe({
      next: (res: any) => {
        const item = res.data;
        this.recentScans.unshift({
          barcode: code,
          title: item?.copy?.book?.title || 'Verified Book',
          time: new Date()
        });
        if (this.activeSession) {
          this.activeSession.total_copies_checked++;
        }
        this.scanBarcode = '';
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.scanBarcode = '';
      }
    });
  }

  completeSession(): void {
    if (!this.activeSession) { return; }
    if (!confirm('Are you sure you want to complete this verification session? Missing copies will be reconciled.')) { return; }

    this.libraryService.completeStockAudit(this.activeSession.id).subscribe({
      next: () => {
        this.activeSession = null;
        this.loadSessions();
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
