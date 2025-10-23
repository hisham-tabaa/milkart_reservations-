"""
Debug and admin functions for troubleshooting appointments
"""
import frappe
from datetime import datetime, timedelta
from .utils import get_service_unit_doc, safe_time_parse


@frappe.whitelist()
def get_service_unit_appointment_count(service_unit, date, time):
	"""Get count of appointments at specific time for debugging"""
	try:
		service_unit_doc = get_service_unit_doc(service_unit)
		if not service_unit_doc:
			return 0

		appointment_time_obj = safe_time_parse(time)
		if not appointment_time_obj:
			return {'count': 0, 'details': [], 'message': 'Invalid time format'}

		appointment_time = appointment_time_obj.time()
		appointment_end_time = (datetime.combine(datetime.today(), appointment_time) +
							  timedelta(minutes=30)).time()

		filters = {
			'service_unit': service_unit_doc.name,
			'appointment_date': date,
			'docstatus': ['!=', 2]
		}

		all_appointments = frappe.get_all(
			'Patient Appointment',
			filters=filters,
			fields=['name', 'appointment_time', 'duration', 'status', 'docstatus']
		)

		overlap_count = 0
		overlap_details = []

		for appointment in all_appointments:
			existing_time_obj = safe_time_parse(appointment.appointment_time)
			if not existing_time_obj:
				continue

			existing_time = existing_time_obj.time()
			existing_duration = appointment.duration or 30
			existing_end_time = (datetime.combine(datetime.today(), existing_time) +
							   timedelta(minutes=existing_duration)).time()

			if (appointment_time < existing_end_time and
				appointment_end_time > existing_time):
				overlap_count += 1
				status_info = f"{appointment.status}"
				if appointment.docstatus == 0:
					status_info = f"DRAFT - {appointment.status}"
				overlap_details.append(f"{existing_time.strftime('%H:%M')} ({status_info})")

		return {
			'count': overlap_count,
			'details': overlap_details,
			'message': f"Found {overlap_count} overlapping appointment(s): {', '.join(overlap_details)}"
		}

	except Exception as e:
		frappe.log_error(f"Error in get_service_unit_appointment_count: {str(e)}")
		return {'count': 0, 'details': [], 'message': f'Error: {str(e)}'}


@frappe.whitelist()
def get_service_unit_appointment_count_strict(service_unit, date, time=None, duration=30, appointment_id=None):
	"""Debug function to count ALL overlapping appointments (including drafts)"""
	try:
		service_unit_doc = get_service_unit_doc(service_unit)
		if not service_unit_doc:
			return {'count': 0, 'appointments': [], 'message': 'Service unit not found'}

		appointment_duration = int(duration) if duration else 30
		appointment_start = safe_time_parse(time) if time else None
		appointment_end = appointment_start + timedelta(minutes=appointment_duration) if appointment_start else None

		filters = {
			'service_unit': service_unit_doc.name,
			'appointment_date': date,
			'docstatus': ['!=', 2]
		}

		if appointment_id:
			filters['name'] = ['!=', appointment_id]

		all_appointments = frappe.get_all(
			'Patient Appointment',
			filters=filters,
			fields=['name', 'appointment_time', 'duration', 'status', 'docstatus', 'patient_name']
		)

		overlapping_appointments = []

		if time and appointment_start:
			appointment_start_time = appointment_start.time()
			appointment_end_time = appointment_end.time()

			for appointment in all_appointments:
				existing_start = safe_time_parse(appointment.appointment_time)
				if not existing_start:
					continue

				existing_duration = int(appointment.duration) if appointment.duration else 30
				existing_end = existing_start + timedelta(minutes=existing_duration)

				existing_start_time = existing_start.time()
				existing_end_time = existing_end.time()

				overlap_found = (appointment_start_time < existing_end_time and
							   appointment_end_time > existing_start_time)

				if overlap_found:
					overlapping_appointments.append(appointment)
		else:
			overlapping_appointments = all_appointments

		debug_info = f"Found {len(overlapping_appointments)} appointment(s) for {date}"
		if time:
			debug_info = f"Found {len(overlapping_appointments)} overlapping appointment(s) for {time}"

		return {
			'count': len(overlapping_appointments),
			'appointments': overlapping_appointments,
			'message': debug_info
		}

	except Exception as e:
		frappe.log_error(f"Error in get_service_unit_appointment_count_strict: {str(e)}")
		return {'count': 0, 'appointments': [], 'message': f'Error: {str(e)}'}


@frappe.whitelist()
def force_release_time_slot(service_unit, date, time):
	"""Admin function to force release a time slot (for emergency use only)"""
	try:
		if not frappe.session.user == "Administrator":
			return {"success": False, "message": "Only Administrator can use this function"}

		service_unit_doc = get_service_unit_doc(service_unit)
		if not service_unit_doc:
			return {"success": False, "message": "Service unit not found"}

		appointment_time_obj = safe_time_parse(time)
		if not appointment_time_obj:
			return {"success": False, "message": "Invalid time format"}

		appointment_time = appointment_time_obj.time()

		filters = {
			'service_unit': service_unit_doc.name,
			'appointment_date': date,
			'docstatus': ['!=', 2]
		}

		overlapping_appointments = frappe.get_all(
			'Patient Appointment',
			filters=filters,
			fields=['name', 'appointment_time', 'status', 'docstatus']
		)

		released_count = 0
		for appointment in overlapping_appointments:
			existing_time_obj = safe_time_parse(appointment.appointment_time)
			if not existing_time_obj:
				continue

			existing_time = existing_time_obj.time()
			if existing_time == appointment_time:
				frappe.db.set_value('Patient Appointment', appointment.name, 'docstatus', 2)
				released_count += 1

		frappe.db.commit()

		return {
			"success": True,
			"message": f"Released {released_count} appointment(s)",
			"count": released_count
		}

	except Exception as e:
		frappe.log_error(f"Error in force_release_time_slot: {str(e)}")
		return {"success": False, "message": f"Error: {str(e)}"}
