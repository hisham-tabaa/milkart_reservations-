import frappe
from .service_unit_appointment import check_service_unit_availability, get_service_unit_availability

# For backward compatibility111
@frappe.whitelist()
def check_availability(service_unit, date):
    """Main availability check function"""
    return check_service_unit_availability(service_unit, date)

@frappe.whitelist()
def get_available_slots(service_unit, date):
    """Get available slots"""
    return get_service_unit_availability(service_unit, date)
