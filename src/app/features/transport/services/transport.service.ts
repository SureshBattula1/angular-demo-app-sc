import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import {
  Vehicle,
  TransportDriver,
  TransportRoute,
  RouteStop,
  StudentTransport,
  TransportStopMaster,
  TransportTrip,
  TripBoardingLog,
  TransportExpense,
  TransportFuelEntry,
  TransportMaintenanceLog,
  TransportFeeSummary,
  TransportDashboardSummary,
  DriverDashboardData,
  DriverAttendanceLog
} from '../../../core/models/transport.model';

@Injectable({ providedIn: 'root' })
export class TransportService {
  constructor(private api: ApiService) {}

  // =========================================================================
  // 1. Dashboard
  // =========================================================================
  getDashboard(params?: Record<string, unknown>): Observable<ApiResponse<TransportDashboardSummary>> {
    return this.api.get<TransportDashboardSummary>('/transport/dashboard', params);
  }

  // =========================================================================
  // 2. Vehicles
  // =========================================================================
  getVehicles(params?: Record<string, unknown>): Observable<ApiResponse<Vehicle[]>> {
    return this.api.get<Vehicle[]>('/vehicles', params);
  }
  getVehicle(id: string | number): Observable<ApiResponse<Vehicle>> {
    return this.api.get<Vehicle>(`/vehicles/${id}`);
  }
  createVehicle(data: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> {
    return this.api.post<Vehicle>('/vehicles', data);
  }
  updateVehicle(id: string | number, data: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> {
    return this.api.put<Vehicle>(`/vehicles/${id}`, data);
  }
  deleteVehicle(id: string | number): Observable<ApiResponse> {
    return this.api.delete(`/vehicles/${id}`);
  }

  // =========================================================================
  // 3. Drivers
  // =========================================================================
  getDrivers(params?: Record<string, unknown>): Observable<ApiResponse<TransportDriver[]>> {
    return this.api.get<TransportDriver[]>('/transport-drivers', params);
  }
  getDriver(id: string | number): Observable<ApiResponse<TransportDriver>> {
    return this.api.get<TransportDriver>(`/transport-drivers/${id}`);
  }
  createDriver(data: Partial<TransportDriver>): Observable<ApiResponse<TransportDriver>> {
    return this.api.post<TransportDriver>('/transport-drivers', data);
  }
  updateDriver(id: string | number, data: Partial<TransportDriver>): Observable<ApiResponse<TransportDriver>> {
    return this.api.put<TransportDriver>(`/transport-drivers/${id}`, data);
  }
  deleteDriver(id: string | number): Observable<ApiResponse> {
    return this.api.delete(`/transport-drivers/${id}`);
  }

  // =========================================================================
  // 4. Routes
  // =========================================================================
  getRoutes(params?: Record<string, unknown>): Observable<ApiResponse<TransportRoute[]>> {
    return this.api.get<TransportRoute[]>('/transport-routes', params);
  }
  getRoute(id: string | number): Observable<ApiResponse<TransportRoute & { stops?: RouteStop[] }>> {
    return this.api.get(`/transport-routes/${id}`);
  }
  createRoute(data: Partial<TransportRoute> & { stops?: RouteStop[] }): Observable<ApiResponse<TransportRoute>> {
    return this.api.post<TransportRoute>('/transport-routes', data);
  }
  updateRoute(id: string | number, data: Partial<TransportRoute> & { stops?: RouteStop[] }): Observable<ApiResponse<TransportRoute>> {
    return this.api.put<TransportRoute>(`/transport-routes/${id}`, data);
  }
  deleteRoute(id: string | number): Observable<ApiResponse> {
    return this.api.delete(`/transport-routes/${id}`);
  }
  getRouteStops(id: string | number): Observable<ApiResponse<RouteStop[]>> {
    return this.api.get<RouteStop[]>(`/transport-routes/${id}/stops`);
  }
  getRouteStudents(id: string | number): Observable<ApiResponse<StudentTransport[]>> {
    return this.api.get<StudentTransport[]>(`/transport-routes/${id}/students`);
  }

  // =========================================================================
  // 5. Stops Master
  // =========================================================================
  getStops(params?: Record<string, unknown>): Observable<ApiResponse<TransportStopMaster[]>> {
    return this.api.get<TransportStopMaster[]>('/transport-stops', params);
  }
  createStop(data: Partial<TransportStopMaster>): Observable<ApiResponse<TransportStopMaster>> {
    return this.api.post<TransportStopMaster>('/transport-stops', data);
  }
  updateStop(id: string | number, data: Partial<TransportStopMaster>): Observable<ApiResponse<TransportStopMaster>> {
    return this.api.put<TransportStopMaster>(`/transport-stops/${id}`, data);
  }
  deleteStop(id: string | number): Observable<ApiResponse> {
    return this.api.delete(`/transport-stops/${id}`);
  }

  // =========================================================================
  // 6. Student Assignments & Roster
  // =========================================================================
  getAssignments(params?: Record<string, unknown>): Observable<ApiResponse<StudentTransport[]>> {
    return this.api.get<StudentTransport[]>('/transport-assignments', params);
  }
  assignStudent(data: Partial<StudentTransport>): Observable<ApiResponse<StudentTransport>> {
    return this.api.post<StudentTransport>('/transport-assignments', data);
  }
  bulkAssign(data: {
    student_ids: (string | number)[];
    route_id: string | number;
    pickup_stop_id?: string | number | null;
    drop_stop_id?: string | number | null;
    annual_fee?: number;
    monthly_fee?: number;
  }): Observable<ApiResponse> {
    return this.api.post('/transport-assignments/bulk', data);
  }
  updateAssignment(id: string | number, data: Partial<StudentTransport>): Observable<ApiResponse<StudentTransport>> {
    return this.api.put<StudentTransport>(`/transport-assignments/${id}`, data);
  }
  removeAssignment(id: string | number): Observable<ApiResponse> {
    return this.api.delete(`/transport-assignments/${id}`);
  }

  // =========================================================================
  // 7. Trips
  // =========================================================================
  getTrips(params?: Record<string, unknown>): Observable<ApiResponse<TransportTrip[]>> {
    return this.api.get<TransportTrip[]>('/transport-trips', params);
  }
  getTrip(id: string | number): Observable<ApiResponse<TransportTrip>> {
    return this.api.get<TransportTrip>(`/transport-trips/${id}`);
  }
  createTrip(data: Partial<TransportTrip>): Observable<ApiResponse<TransportTrip>> {
    return this.api.post<TransportTrip>('/transport-trips', data);
  }
  deleteTrip(id: string | number): Observable<ApiResponse> {
    return this.api.delete(`/transport-trips/${id}`);
  }
  startTrip(id: string | number): Observable<ApiResponse<TransportTrip>> {
    return this.api.post<TransportTrip>(`/transport-trips/${id}/start`, {});
  }
  completeTrip(id: string | number): Observable<ApiResponse<TransportTrip>> {
    return this.api.post<TransportTrip>(`/transport-trips/${id}/complete`, {});
  }
  changeTripDriver(id: string | number, driverId: string | number): Observable<ApiResponse<TransportTrip>> {
    return this.api.put<TransportTrip>(`/transport-trips/${id}/change-driver`, { transport_driver_id: driverId });
  }
  changeTripVehicle(id: string | number, vehicleId: string | number): Observable<ApiResponse<TransportTrip>> {
    return this.api.put<TransportTrip>(`/transport-trips/${id}/change-vehicle`, { vehicle_id: vehicleId });
  }

  // =========================================================================
  // 8. Boarding & Drop Operations
  // =========================================================================
  getTripRoster(tripId: string | number): Observable<ApiResponse<TripBoardingLog[]>> {
    return this.api.get<TripBoardingLog[]>(`/transport-trips/${tripId}/roster`);
  }
  markBoarded(tripId: string | number, studentId: string | number): Observable<ApiResponse<TripBoardingLog>> {
    return this.api.post<TripBoardingLog>(`/transport-trips/${tripId}/board`, { student_id: studentId });
  }
  unmarkBoarded(tripId: string | number, studentId: string | number): Observable<ApiResponse<TripBoardingLog>> {
    return this.api.post<TripBoardingLog>(`/transport-trips/${tripId}/unboard`, { student_id: studentId });
  }
  markDropped(tripId: string | number, studentId: string | number): Observable<ApiResponse<TripBoardingLog>> {
    return this.api.post<TripBoardingLog>(`/transport-trips/${tripId}/drop`, { student_id: studentId });
  }
  reachStop(tripId: string | number, data?: { stop_id?: string | number; auto_verify?: boolean }): Observable<ApiResponse<any>> {
    return this.api.post(`/transport-trips/${tripId}/reach-stop`, data || {});
  }

  // =========================================================================
  // 9. Live Tracking (GPS & ETA)
  // =========================================================================
  updateTripGps(tripId: string | number, data: { latitude: number; longitude: number; speed?: number }): Observable<ApiResponse> {
    return this.api.post(`/transport-trips/${tripId}/gps`, data);
  }
  getLiveTracking(tripId: string | number): Observable<ApiResponse<any>> {
    return this.api.get(`/transport-trips/${tripId}/live-tracking`);
  }
  getStudentTracking(studentUserId: string | number): Observable<ApiResponse<any>> {
    return this.api.get(`/transport/student/${studentUserId}/tracking`);
  }

  // =========================================================================
  // 10. Finance (Fees, Expenses, Fuel, Maintenance)
  // =========================================================================
  getFeesSummary(params?: Record<string, unknown>): Observable<ApiResponse<TransportFeeSummary>> {
    return this.api.get<TransportFeeSummary>('/transport-fees/summary', params);
  }
  getExpenses(params?: Record<string, unknown>): Observable<ApiResponse<TransportExpense[]>> {
    return this.api.get<TransportExpense[]>('/transport-expenses', params);
  }
  createExpense(data: Partial<TransportExpense>): Observable<ApiResponse<TransportExpense>> {
    return this.api.post<TransportExpense>('/transport-expenses', data);
  }
  deleteExpense(id: string | number): Observable<ApiResponse> {
    return this.api.delete(`/transport-expenses/${id}`);
  }
  getFuelEntries(params?: Record<string, unknown>): Observable<ApiResponse<TransportFuelEntry[]>> {
    return this.api.get<TransportFuelEntry[]>('/transport-fuel', params);
  }
  createFuelEntry(data: Partial<TransportFuelEntry>): Observable<ApiResponse<TransportFuelEntry>> {
    return this.api.post<TransportFuelEntry>('/transport-fuel', data);
  }
  deleteFuelEntry(id: string | number): Observable<ApiResponse> {
    return this.api.delete(`/transport-fuel/${id}`);
  }
  getMaintenanceLogs(params?: Record<string, unknown>): Observable<ApiResponse<TransportMaintenanceLog[]>> {
    return this.api.get<TransportMaintenanceLog[]>('/transport-maintenance', params);
  }
  createMaintenanceLog(data: Partial<TransportMaintenanceLog>): Observable<ApiResponse<TransportMaintenanceLog>> {
    return this.api.post<TransportMaintenanceLog>('/transport-maintenance', data);
  }
  deleteMaintenanceLog(id: string | number): Observable<ApiResponse> {
    return this.api.delete(`/transport-maintenance/${id}`);
  }

  // =========================================================================
  // 12. Driver Portal (Scoped Endpoints for Driver Role)
  // =========================================================================
  getDriverDashboard(): Observable<ApiResponse<DriverDashboardData>> {
    return this.api.get<DriverDashboardData>('/driver/dashboard');
  }

  driverClockIn(payload?: { remarks?: string }): Observable<ApiResponse> {
    return this.api.post('/driver/clock-in', payload || {});
  }

  driverClockOut(payload?: { remarks?: string }): Observable<ApiResponse> {
    return this.api.post('/driver/clock-out', payload || {});
  }

  getDriverAttendanceHistory(): Observable<ApiResponse<DriverAttendanceLog[]>> {
    return this.api.get<DriverAttendanceLog[]>('/driver/attendance-history');
  }

  updateDriverTripLocation(tripId: string | number, payload: { latitude: number; longitude: number; speed?: number }): Observable<ApiResponse> {
    return this.api.post(`/driver/trips/${tripId}/location`, payload);
  }
}
