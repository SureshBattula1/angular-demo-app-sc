import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import {
  TransportExpense,
  TransportFuelEntry,
  TransportMaintenanceLog,
  TransportFeeSummary,
  Vehicle
} from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-transport-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './transport-finance.component.html',
  styleUrls: ['./transport-finance.component.scss']
})
export class TransportFinanceComponent implements OnInit {
  vehicles: Vehicle[] = [];

  // Fees
  feesSummary: TransportFeeSummary | null = null;

  // Expenses
  expenses: TransportExpense[] = [];
  filteredExpenses: TransportExpense[] = [];
  expenseSearch = '';
  expenseModalVisible = false;
  newExpense: Partial<TransportExpense> = {
    vehicle_id: '',
    expense_category: 'Repair',
    amount: 0,
    expense_date: new Date().toISOString().substring(0, 10),
    invoice_no: '',
    description: ''
  };

  // Fuel
  fuelEntries: TransportFuelEntry[] = [];
  filteredFuel: TransportFuelEntry[] = [];
  fuelSearch = '';
  fuelModalVisible = false;
  newFuel: Partial<TransportFuelEntry> = {
    vehicle_id: '',
    entry_date: new Date().toISOString().substring(0, 10),
    liters: 0,
    price_per_liter: 0,
    total_cost: 0,
    odometer_reading: 0,
    fuel_station: ''
  };

  // Maintenance
  maintenanceLogs: TransportMaintenanceLog[] = [];
  filteredMaintenance: TransportMaintenanceLog[] = [];
  maintSearch = '';
  maintModalVisible = false;
  newMaint: Partial<TransportMaintenanceLog> = {
    vehicle_id: '',
    maintenance_type: 'Scheduled',
    amount: 0,
    service_date: new Date().toISOString().substring(0, 10),
    service_center: '',
    notes: '',
    next_service_due_date: '',
    next_service_due_odometer: null
  };

  constructor(
    private transport: TransportService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
    this.loadFeesSummary();
    this.loadExpenses();
    this.loadFuel();
    this.loadMaintenance();
  }

  loadVehicles(): void {
    this.transport.getVehicles({ per_page: 100 }).subscribe({
      next: (res) => {
        this.vehicles = res.data || [];
      },
      error: () => {}
    });
  }

  onTabChange(tabIndex: number): void {
    if (tabIndex === 0) this.loadFeesSummary();
    else if (tabIndex === 1) this.loadExpenses();
    else if (tabIndex === 2) this.loadFuel();
    else if (tabIndex === 3) this.loadMaintenance();
  }

  // Fees
  loadFeesSummary(): void {
    this.transport.getFeesSummary().subscribe({
      next: (res) => {
        this.feesSummary = res.data ?? null;
      },
      error: () => {}
    });
  }

  // Expenses
  loadExpenses(): void {
    this.transport.getExpenses({ per_page: 200 }).subscribe({
      next: (res) => {
        this.expenses = res.data || [];
        this.filterExpenses();
      },
      error: () => {}
    });
  }

  filterExpenses(): void {
    const q = this.expenseSearch.trim().toLowerCase();
    if (!q) {
      this.filteredExpenses = [...this.expenses];
      return;
    }
    this.filteredExpenses = this.expenses.filter((e) =>
      (e.vehicle_number && e.vehicle_number.toLowerCase().includes(q)) ||
      (e.expense_category && e.expense_category.toLowerCase().includes(q)) ||
      (e.invoice_no && e.invoice_no.toLowerCase().includes(q))
    );
  }

  openAddExpenseModal(): void {
    this.newExpense = {
      vehicle_id: this.vehicles[0]?.id || '',
      expense_category: 'Repair',
      amount: 0,
      expense_date: new Date().toISOString().substring(0, 10),
      invoice_no: '',
      description: ''
    };
    this.expenseModalVisible = true;
  }

  saveExpense(): void {
    if (!this.newExpense.vehicle_id || !this.newExpense.amount) return;
    this.transport.createExpense(this.newExpense).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Expense recorded successfully');
          this.expenseModalVisible = false;
          this.loadExpenses();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  deleteExpense(ex: TransportExpense): void {
    if (!confirm(`Delete expense of ₹${ex.amount}?`)) return;
    this.transport.deleteExpense(ex.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Expense deleted');
          this.loadExpenses();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  // Fuel
  loadFuel(): void {
    this.transport.getFuelEntries({ per_page: 200 }).subscribe({
      next: (res) => {
        this.fuelEntries = res.data || [];
        this.filterFuel();
      },
      error: () => {}
    });
  }

  filterFuel(): void {
    const q = this.fuelSearch.trim().toLowerCase();
    if (!q) {
      this.filteredFuel = [...this.fuelEntries];
      return;
    }
    this.filteredFuel = this.fuelEntries.filter((f) =>
      (f.vehicle_number && f.vehicle_number.toLowerCase().includes(q)) ||
      (f.fuel_station && f.fuel_station.toLowerCase().includes(q))
    );
  }

  calcFuelTotal(): void {
    const l = Number(this.newFuel.liters) || 0;
    const p = Number(this.newFuel.price_per_liter) || 0;
    this.newFuel.total_cost = Number((l * p).toFixed(2));
  }

  openAddFuelModal(): void {
    this.newFuel = {
      vehicle_id: this.vehicles[0]?.id || '',
      entry_date: new Date().toISOString().substring(0, 10),
      liters: 0,
      price_per_liter: 0,
      total_cost: 0,
      odometer_reading: 0,
      fuel_station: ''
    };
    this.fuelModalVisible = true;
  }

  saveFuel(): void {
    if (!this.newFuel.vehicle_id || !this.newFuel.liters || !this.newFuel.odometer_reading) return;
    this.transport.createFuelEntry(this.newFuel).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Fuel refill logged with mileage calculation');
          this.fuelModalVisible = false;
          this.loadFuel();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  deleteFuelEntry(fe: TransportFuelEntry): void {
    if (!confirm('Delete fuel entry?')) return;
    this.transport.deleteFuelEntry(fe.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Fuel entry deleted');
          this.loadFuel();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  // Maintenance
  loadMaintenance(): void {
    this.transport.getMaintenanceLogs({ per_page: 200 }).subscribe({
      next: (res) => {
        this.maintenanceLogs = res.data || [];
        this.filterMaintenance();
      },
      error: () => {}
    });
  }

  filterMaintenance(): void {
    const q = this.maintSearch.trim().toLowerCase();
    if (!q) {
      this.filteredMaintenance = [...this.maintenanceLogs];
      return;
    }
    this.filteredMaintenance = this.maintenanceLogs.filter((m) =>
      (m.vehicle_number && m.vehicle_number.toLowerCase().includes(q)) ||
      (m.maintenance_type && m.maintenance_type.toLowerCase().includes(q)) ||
      (m.service_center && m.service_center.toLowerCase().includes(q))
    );
  }

  openAddMaintenanceModal(): void {
    this.newMaint = {
      vehicle_id: this.vehicles[0]?.id || '',
      maintenance_type: 'Scheduled',
      amount: 0,
      service_date: new Date().toISOString().substring(0, 10),
      service_center: '',
      notes: '',
      next_service_due_date: '',
      next_service_due_odometer: null
    };
    this.maintModalVisible = true;
  }

  saveMaintenance(): void {
    if (!this.newMaint.vehicle_id || !this.newMaint.amount) return;
    this.transport.createMaintenanceLog(this.newMaint).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Maintenance record saved');
          this.maintModalVisible = false;
          this.loadMaintenance();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  deleteMaintenance(m: TransportMaintenanceLog): void {
    if (!confirm('Delete maintenance record?')) return;
    this.transport.deleteMaintenanceLog(m.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Record deleted');
          this.loadMaintenance();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
