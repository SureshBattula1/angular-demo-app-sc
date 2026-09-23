/** Transport module models. IDs are opaque hashids — never Number() them. */

export interface TransportDriver {
  id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  name: string;
  phone?: string | null;
  license_number?: string | null;
  license_expiry?: string | null;
  address?: string | null;
  is_active?: boolean;
  branch?: { id: string | number | null; name: string | null; code?: string | null };
}

export type VehicleType = 'Bus' | 'Van' | 'Car';
export type VehicleStatus = 'Active' | 'Maintenance' | 'Inactive';

export interface Vehicle {
  id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  route_id?: string | number | null;
  transport_driver_id?: string | number | null;
  vehicle_number: string;
  vehicle_type: VehicleType;
  make?: string | null;
  model?: string | null;
  capacity: number;
  insurance_expiry?: string | null;
  fitness_expiry?: string | null;
  status: VehicleStatus;
  branch?: { id: string | number | null; name: string | null };
  driver?: { id: string | number; name: string } | null;
  route?: { id: string | number; name: string } | null;
}

export interface RouteStop {
  id?: string | number;
  route_id?: string | number;
  sequence_no?: number;
  stop_name: string;
  pickup_time?: string | null;
  drop_time?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius?: number | null;
}

export interface TransportRoute {
  id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  route_number: string;
  route_name: string;
  description?: string | null;
  stops_count?: number;
  distance?: number | null;
  estimated_time?: number | null;
  fare: number;
  is_active?: boolean;
  branch?: { id: string | number | null; name: string | null };
}

export interface StudentTransport {
  id: string | number;
  student_id: string | number;
  route_id: string | number;
  vehicle_id?: string | number | null;
  branch_id: string | number;
  stop_name?: string;
  pickup_stop_id?: string | number | null;
  drop_stop_id?: string | number | null;
  pickup_time?: string | null;
  drop_time?: string | null;
  monthly_fee: number;
  status?: 'Active' | 'Inactive';
  student_name?: string;
  pickup_stop_name?: string;
  drop_stop_name?: string;
}
