export enum DriverStatus {
  AVAILABLE = 'available', // Ready for assignments
  ASSIGNED = 'assigned', // Has upcoming shipments
  IN_TRANSIT = 'in_transit', // Actively transporting
  OFF_DUTY = 'off_duty', // Not available (vacation, sick)
}
