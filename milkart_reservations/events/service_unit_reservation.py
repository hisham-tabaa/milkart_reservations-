"""
Service Unit Reservation event handlers
"""
import frappe
from frappe import _


def validate_availability(doc, method=None):
	"""Validate that the time slot is available for Service Unit Reservation"""
	if doc.docstatus == 0:  # Only for draft documents
		# Check for overlapping reservations
		overlapping = frappe.get_all(
			'Service Unit Reservation',
			filters={
				'service_unit': doc.service_unit,
				'reservation_date': doc.reservation_date,
				'reservation_time': doc.reservation_time,
				'name': ['!=', doc.name],
				'docstatus': ['!=', 2]  # Not cancelled
			}
		)

		if overlapping:
			frappe.throw(_('This time slot is already booked. Please choose a different time.'))
