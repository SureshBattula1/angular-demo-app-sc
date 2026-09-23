import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { TransportService } from '../../services/transport.service';
import { TransportRoute, RouteStop, StudentTransport } from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AssignStudentDialogComponent } from '../assign-student-dialog/assign-student-dialog.component';

@Component({
  selector: 'app-route-view',
  standalone: true,
  imports: [CommonModule, MaterialModule, HasPermissionDirective],
  templateUrl: './route-view.component.html',
  styleUrls: ['./route-view.component.scss']
})
export class RouteViewComponent implements OnInit {
  route: (TransportRoute & { stops?: RouteStop[] }) | null = null;
  students: StudentTransport[] = [];
  loading = false;

  stopColumns = ['seq', 'stop_name', 'pickup', 'drop'];
  studentColumns = ['student', 'pickup', 'drop', 'fee', 'status', 'actions'];

  private routeId!: string;

  constructor(
    private transport: TransportService, private activated: ActivatedRoute, private router: Router,
    private dialog: MatDialog, private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.activated.params.subscribe(p => { if (p['id']) { this.routeId = p['id']; this.load(); this.loadStudents(); } });
  }

  private load(): void {
    this.loading = true;
    this.transport.getRoute(this.routeId).subscribe({
      next: (res) => { if (res.success && res.data) { this.route = res.data; } this.loading = false; },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; this.router.navigate(['/transport/routes']); }
    });
  }

  private loadStudents(): void {
    this.transport.getRouteStudents(this.routeId).subscribe({
      next: (res) => { this.students = res.data || []; }, error: () => { this.students = []; }
    });
  }

  get sortedStops(): RouteStop[] {
    return [...(this.route?.stops || [])].sort((a, b) => (a.sequence_no ?? 0) - (b.sequence_no ?? 0));
  }

  openAssign(): void {
    if (!this.route) { return; }
    const ref = this.dialog.open(AssignStudentDialogComponent, {
      data: { route: this.route, stops: this.route.stops || [] },
      width: '560px', maxWidth: '95vw'
    });
    ref.afterClosed().subscribe((done: boolean) => { if (done) { this.loadStudents(); } });
  }

  removeAssignment(s: StudentTransport): void {
    if (!confirm(`Remove ${s.student_name || 'this student'} from the route?`)) { return; }
    this.transport.removeAssignment(s.id).subscribe({
      next: (res) => { if (res.success) { this.errorHandler.showSuccess('Assignment removed'); this.loadStudents(); } },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  onEdit(): void { if (this.route) { this.router.navigate(['/transport/routes/edit', this.route.id]); } }
  onBack(): void { this.router.navigate(['/transport/routes']); }
}
