/** Transport module models. IDs are opaque hashids — never Number() them. */

export interface TransportDriver {
  id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  user_id?: string | number | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  has_account?: boolean;
  license_number?: string | null;
  license_expiry?: string | null;
  address?: string | null;
  is_active?: boolean;
  branch?: { id: string | number | null; name: string | null; code?: string | null };
  user?: { id: number; first_name: string; last_name: string; email: string; phone?: string; is_active: boolean };
}

export interface DriverDutyStatus {
  clocked_in: boolean;
  clock_in_time?: string | null;
  clocked_out: boolean;
  clock_out_time?: string | null;
  total_hours: number;
  status: string;
}

export interface DriverAttendanceLog {
  id: string | number;
  duty_type?: string;
  date: string;
  formatted_date?: string;
  day?: string;
  status: string;
  check_in?: string | null;
  check_out?: string | null;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  total_hours?: number;
  odometer_start?: number | null;
  odometer_end?: number | null;
  km_driven?: number | null;
  vehicle_number?: string | null;
  remarks?: string | null;
}

export interface DriverShift {
  id: string | number;
  duty_type: string;
  status: 'In Progress' | 'Completed' | 'Pending' | string;
  check_in_time: string;
  check_in_time_formatted?: string;
  check_out_time?: string | null;
  check_out_time_formatted?: string;
  odometer_start?: number | null;
  odometer_end?: number | null;
  km_driven?: number | null;
  total_hours?: number;
  remarks?: string | null;
}

export interface DriverShiftStatusData {
  active_shift: DriverShift | null;
  today_shifts: DriverShift[];
  total_km_today: number;
  total_hours_today: number;
}

export interface DriverDashboardData {
  driver: TransportDriver;
  vehicle: Vehicle | null;
  route: TransportRoute | null;
  stops: RouteStop[];
  today_trips: TransportTrip[];
  duty: DriverDutyStatus;
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
  landmark?: string | null;
  pickup_time?: string | null;
  drop_time?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius?: number | null;
}

export interface TransportStopMaster {
  id: string | number;
  branch_id: string | number;
  stop_name: string;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius?: number;
  is_active?: boolean;
  branch_name?: string;
  created_at?: string;
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
  total_distance_km?: number | null;
  estimated_time?: number | null;
  estimated_duration_minutes?: number | null;
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
  annual_fee?: number;
  monthly_fee?: number;
  due_date?: string | null;
  status?: 'Active' | 'Inactive';
  student_name?: string;
  student_email?: string;
  admission_no?: string;
  class_name?: string;
  section_name?: string;
  route_name?: string;
  route_number?: string;
  pickup_stop_name?: string;
  drop_stop_name?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
}

export type TripType = 'Pickup' | 'Drop';
export type TripStatus = 'Scheduled' | 'Started' | 'In Progress' | 'Completed' | 'Cancelled';

export interface TransportTrip {
  id: string | number;
  school_id?: string | number | null;
  branch_id: string | number;
  route_id: string | number;
  vehicle_id?: string | number | null;
  transport_driver_id?: string | number | null;
  trip_type: TripType;
  trip_date?: string | null;
  scheduled_start_time?: string | null;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  status: TripStatus;
  current_latitude?: number | null;
  current_longitude?: number | null;
  current_speed?: number | null;
  current_stop_id?: string | number | null;
  last_gps_updated_at?: string | null;
  total_students?: number;
  boarded_students?: number;
  dropped_students?: number;
  route_name?: string;
  route_number?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  branch_name?: string;
}

export type BoardingStatus = 'Pending' | 'Boarded' | 'Dropped' | 'Absent';

export interface TripBoardingLog {
  id: string | number;
  trip_id: string | number;
  student_id: string | number;
  student_transport_id?: string | number | null;
  pickup_stop_id?: string | number | null;
  drop_stop_id?: string | number | null;
  boarded_at?: string | null;
  dropped_at?: string | null;
  status: BoardingStatus;
  student_name?: string;
  admission_no?: string;
  admission_number?: string;
  class_name?: string;
  section_name?: string;
  pickup_stop_name?: string;
  drop_stop_name?: string;
  scheduled_pickup_time?: string;
  scheduled_drop_time?: string;
  pickup_time?: string;
  drop_time?: string;
  boarding_status?: string | null;
  drop_status?: string | null;
  student?: { id: string | number; first_name?: string; last_name?: string; admission_number?: string; avatar?: string } | null;
  pickup_stop?: { id: string | number; stop_name?: string } | null;
  drop_stop?: { id: string | number; stop_name?: string } | null;
}

export interface TransportExpense {
  id: string | number;
  school_id?: string | number | null;
  branch_id: string | number;
  vehicle_id: string | number;
  expense_category: 'Repair' | 'Tyre' | 'Battery' | 'Cleaning' | 'Insurance' | 'Other';
  amount: number;
  expense_date: string;
  description?: string | null;
  invoice_no?: string | null;
  vehicle_number?: string;
  branch_name?: string;
  created_at?: string;
}

export interface TransportFuelEntry {
  id: string | number;
  school_id?: string | number | null;
  branch_id: string | number;
  vehicle_id: string | number;
  entry_date: string;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  odometer_reading: number;
  mileage_calculated?: number | null;
  fuel_station?: string | null;
  vehicle_number?: string;
  branch_name?: string;
  created_at?: string;
}

export interface TransportMaintenanceLog {
  id: string | number;
  school_id?: string | number | null;
  branch_id: string | number;
  vehicle_id: string | number;
  maintenance_type: 'Scheduled' | 'Repair' | 'Inspection' | 'Tire Rotation' | 'Emergency';
  service_date: string;
  service_center?: string | null;
  amount: number;
  odometer_at_service?: number | null;
  next_service_due_date?: string | null;
  next_service_due_odometer?: number | null;
  notes?: string | null;
  vehicle_number?: string;
  branch_name?: string;
  created_at?: string;
}

export interface TransportFeeSummary {
  total_demand: number;
  total_collected: number;
  total_due: number;
  collection_percentage: number;
  recent_collections: any[];
}

export interface TransportDashboardSummary {
  students_count: number;
  routes_count: number;
  vehicles_count: number;
  drivers_count: number;
  today_trips_count: number;
  active_trips_count: number;
  today_trips: TransportTrip[];
}
