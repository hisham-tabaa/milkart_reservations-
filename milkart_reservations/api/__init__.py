"""
Milkart Reservations API Module
Organized into sub-modules for clarity:
- utils: Common utility functions
- availability: Availability checking and validation
- debug: Debug and admin functions
- search: Dropdown and search functions
- maintenance: Maintenance and scheduler functions
"""

import frappe

# Import all functions from organized modules
from .utils import (
	get_service_unit_doc,
	safe_time_parse,
	get_service_unit_schedule_slots,
	generate_time_slots_from_schedule,
	mark_occupied_slots_strict,
)

from .availability import (
	get_service_unit_availability,
	check_service_unit_availability,
	validate_service_unit_availability_strict,
	validate_service_unit_availability,
)

from .debug import (
	get_service_unit_appointment_count,
	get_service_unit_appointment_count_strict,
	force_release_time_slot,
)

from .search import (
	get_service_units_for_appointment,
)

from .maintenance import (
	cleanup_old_reservations,
)

__all__ = [
	'get_service_unit_doc',
	'safe_time_parse',
	'get_service_unit_schedule_slots',
	'generate_time_slots_from_schedule',
	'mark_occupied_slots_strict',
	'get_service_unit_availability',
	'check_service_unit_availability',
	'validate_service_unit_availability_strict',
	'validate_service_unit_availability',
	'get_service_unit_appointment_count',
	'get_service_unit_appointment_count_strict',
	'force_release_time_slot',
	'get_service_units_for_appointment',
	'cleanup_old_reservations',
]

# Backward compatibility wrappers
@frappe.whitelist()
def check_availability(service_unit, date):
	"""Main availability check function"""
	return check_service_unit_availability(service_unit, date)

@frappe.whitelist()
def get_available_slots(service_unit, date):
	"""Get available slots"""
	return get_service_unit_availability(service_unit, date)
