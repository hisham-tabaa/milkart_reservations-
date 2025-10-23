"""
Utility functions for the Milkart Reservations application
"""
import frappe
from datetime import datetime, timedelta


def get_service_unit_doc(service_unit):
	"""Get service unit document by name or healthcare_service_unit_name"""
	try:
		# First try direct lookup by name
		if frappe.db.exists("Healthcare Service Unit", service_unit):
			return frappe.get_doc("Healthcare Service Unit", service_unit)

		# If not found, try lookup by healthcare_service_unit_name
		units = frappe.get_all("Healthcare Service Unit",
							  filters={"healthcare_service_unit_name": service_unit},
							  fields=["name"])
		if units:
			return frappe.get_doc("Healthcare Service Unit", units[0].name)

		# If still not found, return None
		return None

	except Exception as e:
		frappe.log_error(f"Error in get_service_unit_doc: {str(e)}")
		return None


def safe_time_parse(time_str):
	"""Safely parse time strings with microsecond support"""
	if not time_str:
		return None
	try:
		# Handle full time format with microseconds
		if '.' in str(time_str):
			return datetime.strptime(str(time_str), '%H:%M:%S.%f')
		else:
			return datetime.strptime(str(time_str), '%H:%M:%S')
	except ValueError as e:
		frappe.log_error(f"Time parsing failed for: {time_str}, Error: {str(e)}")
		return None


def get_service_unit_schedule_slots(service_unit_name, date):
	"""Get schedule slots for service unit on specific date from child table"""
	try:
		appointment_date = frappe.utils.getdate(date)
		day_of_week = appointment_date.strftime('%A')

		# Get service unit with child table data
		service_unit_doc = frappe.get_doc("Healthcare Service Unit", service_unit_name)

		time_slots = []
		for slot in service_unit_doc.service_unit_schedule:
			if slot.day == day_of_week:
				time_slots.append({
					'from_time': slot.from_time,
					'to_time': slot.to_time,
					'duration': slot.duration or 30
				})

		return time_slots

	except Exception as e:
		frappe.log_error(f"Error in get_service_unit_schedule_slots: {str(e)}")
		return []


def generate_time_slots_from_schedule(from_time, to_time, duration=30):
	"""Generate time slots based on schedule times - WITH MICROSECOND SUPPORT"""
	slots = []

	# ENHANCED TIME PARSING - Handle microseconds
	start_time_obj = safe_time_parse(from_time)
	end_time_obj = safe_time_parse(to_time)

	if not start_time_obj or not end_time_obj:
		return slots

	start_time = datetime.combine(datetime.today(), start_time_obj.time())
	end_time = datetime.combine(datetime.today(), end_time_obj.time())

	current_time = start_time
	while current_time < end_time:
		slot_end = current_time + timedelta(minutes=duration)
		if slot_end <= end_time:
			slots.append({
				'time': current_time.strftime('%H:%M:%S'),
				'display_time': current_time.strftime('%I:%M %p'),
				'available': True,
				'slot_start': current_time.time(),
				'slot_end': slot_end.time(),
				'conflict_reason': None
			})
		current_time += timedelta(minutes=duration)

	return slots


def mark_occupied_slots_strict(slots, appointments, slot_duration=30):
	"""STRICT VERSION: Mark slots as occupied based on ALL existing appointments (including drafts) - WITH MICROSECOND SUPPORT"""

	for appointment in appointments:
		# Include ALL appointments except cancelled (draft, submitted, scheduled, open, etc.)
		if appointment.docstatus != 2:  # Not cancelled
			appointment_time_obj = safe_time_parse(appointment.appointment_time)
			if not appointment_time_obj:
				continue

			appointment_duration = appointment.duration or slot_duration
			appointment_end_time = (datetime.combine(datetime.today(), appointment_time_obj.time()) +
								  timedelta(minutes=appointment_duration)).time()

			for slot in slots:
				if slot['available']:
					slot_start = slot['slot_start']
					slot_end = slot['slot_end']

					# Check for ANY overlap
					overlap_found = (slot_start < appointment_end_time and slot_end > appointment_time_obj.time())

					if overlap_found:
						slot['available'] = False
						slot['conflict_reason'] = f"Booked by appointment {appointment.name} ({appointment.status})"

	return [slot for slot in slots if slot['available']]
