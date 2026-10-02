import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';

export interface StaffPersonOption {
  user_id: number;
  name: string;
  subtitle: string;
}

@Component({
  selector: 'app-staff-group-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './staff-group-picker.component.html',
  styleUrls: ['./staff-group-picker.component.scss']
})
export class StaffGroupPickerComponent {
  @Input() label = '';
  @Input() people: StaffPersonOption[] = [];
  @Input() selectedIds: number[] = [];
  @Output() selectedIdsChange = new EventEmitter<number[]>();

  search = '';

  get filteredPeople(): StaffPersonOption[] {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return this.people;
    }
    return this.people.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        String(p.user_id).includes(q)
    );
  }

  get allFilteredSelected(): boolean {
    const list = this.filteredPeople;
    return list.length > 0 && list.every(p => this.selectedIds.includes(p.user_id));
  }

  get someFilteredSelected(): boolean {
    const list = this.filteredPeople;
    const count = list.filter(p => this.selectedIds.includes(p.user_id)).length;
    return count > 0 && count < list.length;
  }

  isSelected(userId: number): boolean {
    return this.selectedIds.includes(userId);
  }

  togglePerson(userId: number, checked: boolean): void {
    const next = new Set(this.selectedIds);
    if (checked) {
      next.add(userId);
    } else {
      next.delete(userId);
    }
    this.selectedIdsChange.emit([...next]);
  }

  toggleSelectAllFiltered(checked: boolean): void {
    const next = new Set(this.selectedIds);
    for (const p of this.filteredPeople) {
      if (checked) {
        next.add(p.user_id);
      } else {
        next.delete(p.user_id);
      }
    }
    this.selectedIdsChange.emit([...next]);
  }
}
