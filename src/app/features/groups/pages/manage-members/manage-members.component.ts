import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { GroupService } from '../../services/group.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { StudentGroup, GroupMember } from '../../../../core/models/class-section.model';
import { Student } from '../../../../core/models/student.model';

@Component({
  selector: 'app-manage-members',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './manage-members.component.html',
  styleUrls: ['./manage-members.component.scss']
})
export class ManageMembersComponent implements OnInit {
  group: StudentGroup | null = null;
  members: GroupMember[] = [];
  studentsAvailable: Student[] = [];
  loading = false;
  loadingStudents = false;
  adding = false;
  removingId: number | null = null;
  groupId!: number;
  selectedStudentId: number | null = null;
  selectedRole: 'Member' | 'Leader' = 'Member';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private studentCrudService: StudentCrudService,
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
    this.loading = true;
    this.groupService.getGroup(this.groupId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.group = response.data;
          this.members = response.data.members || [];
          if (this.group?.branch_id) {
            this.loadStudentsForBranch();
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.router.navigate(['/groups']);
      }
    });
  }

  loadStudentsForBranch(): void {
    if (!this.group?.branch_id) return;
    this.loadingStudents = true;
    this.studentCrudService.getStudents({
      branch_id: this.group.branch_id,
      per_page: 500,
      is_active: true
    }).subscribe({
      next: (response: any) => {
        const data = response.data || [];
        this.studentsAvailable = Array.isArray(data) ? data : (data.data || []);
        this.loadingStudents = false;
      },
      error: () => {
        this.studentsAvailable = [];
        this.loadingStudents = false;
      }
    });
  }

  get studentsToAdd(): Student[] {
    if (!this.studentsAvailable.length) return [];
    const memberStudentIds = this.members.map(m => m.student_id);
    return this.studentsAvailable.filter(s => !memberStudentIds.includes(s.id));
  }

  getMemberDisplayName(member: GroupMember): string {
    if (member.student) {
      return `${(member.student as any).first_name || ''} ${(member.student as any).last_name || ''}`.trim();
    }
    return `Student #${member.student_id}`;
  }

  getMemberMeta(member: GroupMember): string {
    if (member.student && (member.student as any).grade) {
      const s = member.student as any;
      return `Grade: ${s.grade || ''} ${s.section || ''} | Joined: ${member.joined_date ? new Date(member.joined_date).toLocaleDateString() : ''}`;
    }
    return member.joined_date ? `Joined: ${new Date(member.joined_date).toLocaleDateString()}` : '';
  }

  addMember(): void {
    if (!this.selectedStudentId || this.adding) return;
    this.adding = true;
    this.groupService.addMember(this.groupId, this.selectedStudentId, this.selectedRole).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Member added successfully');
          this.selectedStudentId = null;
          this.selectedRole = 'Member';
          this.loadGroup();
          this.loadStudentsForBranch();
        }
        this.adding = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.adding = false;
      }
    });
  }

  removeMember(member: GroupMember): void {
    if (this.removingId !== null) return;
    if (!confirm(`Remove ${this.getMemberDisplayName(member)} from this group?`)) return;
    this.removingId = member.student_id;
    this.groupService.removeMember(this.groupId, member.student_id).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Member removed successfully');
          this.loadGroup();
          this.loadStudentsForBranch();
        }
        this.removingId = null;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.removingId = null;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/groups/view', this.groupId]);
  }

  onBackToList(): void {
    this.router.navigate(['/groups']);
  }

  getStudentLabel(student: Student): string {
    const name = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const extra = student.admission_number ? ` (${student.admission_number})` : '';
    return name ? `${name}${extra}` : `Student #${student.id}`;
  }
}
