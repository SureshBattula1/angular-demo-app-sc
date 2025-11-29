import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface TransportRoute {
  id: number;
  branch_id: number;
  route_name: string;
  route_number?: string;
  start_location: string;
  end_location: string;
  distance_km?: number;
  estimated_time?: string;
  fare_amount?: number;
  vehicle_id?: number;
  driver_id?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  vehicle?: Vehicle;
  driver?: any;
  branch?: any;
  students?: any[];
}

export interface Vehicle {
  id: number;
  branch_id: number;
  vehicle_number: string;
  vehicle_type: string;
  make?: string;
  model?: string;
  year?: number;
  capacity: number;
  driver_id?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  driver?: any;
  branch?: any;
}

@Injectable({
  providedIn: 'root'
})
export class TransportService {
  private readonly ROUTES_ENDPOINT = '/transport-routes';
  private readonly VEHICLES_ENDPOINT = '/vehicles';

  constructor(private apiService: ApiService) {}

  // Transport Routes Methods
  getRoutes(params?: Record<string, unknown>): Observable<ApiResponse<TransportRoute[]>> {
    return this.apiService.get<TransportRoute[]>(this.ROUTES_ENDPOINT, params);
  }

  getRoute(id: number): Observable<ApiResponse<TransportRoute>> {
    return this.apiService.get<TransportRoute>(`${this.ROUTES_ENDPOINT}/${id}`);
  }

  createRoute(routeData: Partial<TransportRoute>): Observable<ApiResponse<TransportRoute>> {
    return this.apiService.post<TransportRoute>(this.ROUTES_ENDPOINT, routeData);
  }

  updateRoute(id: number, routeData: Partial<TransportRoute>): Observable<ApiResponse<TransportRoute>> {
    return this.apiService.put<TransportRoute>(`${this.ROUTES_ENDPOINT}/${id}`, routeData);
  }

  deleteRoute(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ROUTES_ENDPOINT}/${id}`);
  }

  getRouteStudents(routeId: number): Observable<ApiResponse<any[]>> {
    return this.apiService.get<any[]>(`${this.ROUTES_ENDPOINT}/${routeId}/students`);
  }

  // Vehicle Methods
  getVehicles(params?: Record<string, unknown>): Observable<ApiResponse<Vehicle[]>> {
    return this.apiService.get<Vehicle[]>(this.VEHICLES_ENDPOINT, params);
  }

  getVehicle(id: number): Observable<ApiResponse<Vehicle>> {
    return this.apiService.get<Vehicle>(`${this.VEHICLES_ENDPOINT}/${id}`);
  }

  createVehicle(vehicleData: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> {
    return this.apiService.post<Vehicle>(this.VEHICLES_ENDPOINT, vehicleData);
  }

  updateVehicle(id: number, vehicleData: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> {
    return this.apiService.put<Vehicle>(`${this.VEHICLES_ENDPOINT}/${id}`, vehicleData);
  }

  deleteVehicle(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.VEHICLES_ENDPOINT}/${id}`);
  }
}

