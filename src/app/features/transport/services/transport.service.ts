import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Vehicle, TransportDriver, TransportRoute, RouteStop, StudentTransport } from '../../../core/models/transport.model';

@Injectable({ providedIn: 'root' })
export class TransportService {
  constructor(private api: ApiService) {}

  // Vehicles
  getVehicles(params?: Record<string, unknown>): Observable<ApiResponse<Vehicle[]>> { return this.api.get<Vehicle[]>('/vehicles', params); }
  getVehicle(id: string | number): Observable<ApiResponse<Vehicle>> { return this.api.get<Vehicle>(`/vehicles/${id}`); }
  createVehicle(data: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> { return this.api.post<Vehicle>('/vehicles', data); }
  updateVehicle(id: string | number, data: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> { return this.api.put<Vehicle>(`/vehicles/${id}`, data); }
  deleteVehicle(id: string | number): Observable<ApiResponse> { return this.api.delete(`/vehicles/${id}`); }

  // Drivers
  getDrivers(params?: Record<string, unknown>): Observable<ApiResponse<TransportDriver[]>> { return this.api.get<TransportDriver[]>('/transport-drivers', params); }
  getDriver(id: string | number): Observable<ApiResponse<TransportDriver>> { return this.api.get<TransportDriver>(`/transport-drivers/${id}`); }
  createDriver(data: Partial<TransportDriver>): Observable<ApiResponse<TransportDriver>> { return this.api.post<TransportDriver>('/transport-drivers', data); }
  updateDriver(id: string | number, data: Partial<TransportDriver>): Observable<ApiResponse<TransportDriver>> { return this.api.put<TransportDriver>(`/transport-drivers/${id}`, data); }
  deleteDriver(id: string | number): Observable<ApiResponse> { return this.api.delete(`/transport-drivers/${id}`); }

  // Routes (+ stops)
  getRoutes(params?: Record<string, unknown>): Observable<ApiResponse<TransportRoute[]>> { return this.api.get<TransportRoute[]>('/transport-routes', params); }
  getRoute(id: string | number): Observable<ApiResponse<TransportRoute & { stops?: RouteStop[] }>> { return this.api.get(`/transport-routes/${id}`); }
  createRoute(data: Partial<TransportRoute> & { stops?: RouteStop[] }): Observable<ApiResponse<TransportRoute>> { return this.api.post<TransportRoute>('/transport-routes', data); }
  updateRoute(id: string | number, data: Partial<TransportRoute> & { stops?: RouteStop[] }): Observable<ApiResponse<TransportRoute>> { return this.api.put<TransportRoute>(`/transport-routes/${id}`, data); }
  deleteRoute(id: string | number): Observable<ApiResponse> { return this.api.delete(`/transport-routes/${id}`); }
  getRouteStops(id: string | number): Observable<ApiResponse<RouteStop[]>> { return this.api.get<RouteStop[]>(`/transport-routes/${id}/stops`); }
  getRouteStudents(id: string | number): Observable<ApiResponse<StudentTransport[]>> { return this.api.get<StudentTransport[]>(`/transport-routes/${id}/students`); }

  // Student assignments
  assignStudent(data: Partial<StudentTransport>): Observable<ApiResponse<StudentTransport>> { return this.api.post<StudentTransport>('/student-transport', data); }
  updateAssignment(id: string | number, data: Partial<StudentTransport>): Observable<ApiResponse<StudentTransport>> { return this.api.put<StudentTransport>(`/student-transport/${id}`, data); }
  removeAssignment(id: string | number): Observable<ApiResponse> { return this.api.delete(`/student-transport/${id}`); }
}
