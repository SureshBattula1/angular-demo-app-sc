import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { CompanySchoolService } from '../../services/school.service';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats = {
    totalSchools: 0,
    activeSchools: 0,
    totalBranches: 0,
    totalStudents: 0,
    totalTeachers: 0
  };

  constructor(
    private schoolService: CompanySchoolService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.schoolService.getSchools().subscribe(response => {
      if (response.success && response.data) {
        const schools = response.data;
        this.stats.totalSchools = schools.length;
        this.stats.activeSchools = schools.filter(s => s.status === 'Active').length;
        this.stats.totalBranches = schools.reduce((sum, s) => sum + (s.branches_count || 0), 0);
        this.stats.totalStudents = schools.reduce((sum, s) => sum + (s.total_students || 0), 0);
        this.stats.totalTeachers = schools.reduce((sum, s) => sum + (s.total_teachers || 0), 0);
      }
    });
  }
}

