"""
Availability checking and validation functions for Service Units and Appointments
"""
import frappe
from frappe import _
from datetime import datetime, timedelta
from .utils import (
	get_service_unit_doc,
	safe_time_parse,
	get_service_unit_schedule_slots,
	generate_time_slots_from_schedule,
	mark_occupied_slots_strict
)


@frappe.whitelist()
def get_service_unit_availability(service_unit, date):
	"""Get available slots for service unit based on its child table schedule - ENHANCED CONFLICT PREVENTION"""
	try:
		# Get service unit document
		service_unit_doc = get_service_unit_doc(service_unit)
		if not service_unit_doc:
			return {"slots": [], "message": f"Service Unit '{service_unit}' not found"}

		# Get service unit schedule from child table
		schedule_slots = get_service_unit_schedule_slots(service_unit_doc.name, date)

		if not schedule_slots:
			return {"slots": [], "message": "No schedule found for this service unit on selected date"}

		# Get ALL existing appointments (including drafts) for strict conflict checking
		existing_appointments = frappe.get_all(
			'Patient Appointment',
			filters={
				'service_unit': service_unit_doc.name,
				'appointment_date': date,
				'docstatus': ['!=', 2]  # Exclude cancelled only
			},
			fields=['name', 'appointment_time', 'duration', 'status', 'docstatus']
		)

		# Generate available slots with strict conflict checking
		available_slots = []
		for schedule_slot in schedule_slots:
			slot_duration = schedule_slot.get('duration', 30)
			slots = generate_time_slots_from_schedule(
				schedule_slot['from_time'],
				schedule_slot['to_time'],
				slot_duration
			)
			filtered_slots = mark_occupied_slots_strict(slots, existing_appointments, slot_duration)
			available_slots.extend(filtered_slots)

		return {
			"slots": available_slots,
			"schedule_found": True,
			"service_unit_name": service_unit_doc.healthcare_service_unit_name,
			"total_existing_appointments": len(existing_appointments),
			"message": f"Available time slots based on service unit schedule"
		}

	except Exception as e:
		frappe.log_error(f"Error in get_service_unit_availability: {str(e)}")
		return {"slots": [], "message": f"Error checking availability: {str(e)}"}


@frappe.whitelist()
def check_service_unit_availability(service_unit, date, duration=None):
	"""Check availability for frontend - returns HTML with enhanced conflict info"""
	# USE PROVIDED DURATION OR GET FROM SERVICE UNIT
	if not duration:
		service_unit_doc = get_service_unit_doc(service_unit)
		if service_unit_doc and service_unit_doc.service_unit_schedule:
			appointment_date = frappe.utils.getdate(date)
			day_of_week = appointment_date.strftime('%A')
			for schedule in service_unit_doc.service_unit_schedule:
				if schedule.day == day_of_week:
					duration = schedule.duration or 30
					break

	result = get_service_unit_availability(service_unit, date)

	if not result["slots"]:
		no_slots_message = result.get('message', 'No available slots')
		if result.get('total_existing_appointments', 0) > 0:
			no_slots_message += f" - {result['total_existing_appointments']} existing appointment(s)"
		return f"<p>{no_slots_message}</p>"

	html = f'''
	<div style="max-height: 400px; overflow-y: auto;">
		<h4>Available Time Slots for {result.get('service_unit_name', service_unit)}:</h4>
		<div style="margin: 10px 0; padding: 8px; background: #e8f5e8; border-radius: 4px; border: 1px solid #4caf50;">
			<strong>Note:</strong> Time slots already booked (including draft appointments) are automatically excluded.
			{f"<br><strong>Slot Duration:</strong> {duration} minutes" if duration else ""}
		</div>
		<div class="row" style="margin-top: 15px;">
	'''

	for slot in result["slots"]:
		html += f'''
			<div class="col-sm-4" style="margin-bottom: 10px;">
				<button class="btn btn-sm btn-success" style="width: 100%;"
						onclick="frappe.ui.form.get_cur_frm().set_value('appointment_time', '{slot['time']}');">
					{slot['display_time']}
				</button>
			</div>
		'''

	html += '</div></div>'
	return html


@frappe.whitelist()
def validate_service_unit_availability_strict(service_unit, appointment_date, appointment_time, duration=None, appointment_id=None):
	"""STRICT VALIDATION: Prevents ALL overlaps including draft appointments"""
	try:
		if not all([service_unit, appointment_date, appointment_time]):
			return {"available": False, "message": "Service unit, date and time are required"}

		# Get service unit document
		service_unit_doc = get_service_unit_doc(service_unit)
		if not service_unit_doc:
			return {"available": False, "message": "Service unit not found"}

		# ENHANCED DURATION HANDLING
		if not duration:
			schedule_slots = get_service_unit_schedule_slots(service_unit_doc.name, appointment_date)
			if schedule_slots:
				appointment_duration = schedule_slots[0].get('duration', 30)
			else:
				appointment_duration = 30
		else:
			appointment_duration = int(duration)

		appointment_name = appointment_id

		# Convert appointment time to datetime objects for comparison
		appointment_start = safe_time_parse(appointment_time)
		if not appointment_start:
			return {"available": False, "message": "Invalid appointment time format"}

		appointment_end = appointment_start + timedelta(minutes=appointment_duration)

		appointment_start_time = appointment_start.time()
		appointment_end_time = appointment_end.time()

		# Get schedule for the day
		schedule_slots = get_service_unit_schedule_slots(service_unit_doc.name, appointment_date)
		if not schedule_slots:
			return {"available": False, "message": "No schedule found for selected date3"}

		# Check if appointment time falls within any schedule slot
		in_schedule = False
		for schedule_slot in schedule_slots:
			from_time_obj = safe_time_parse(schedule_slot['from_time'])
			to_time_obj = safe_time_parse(schedule_slot['to_time'])

			if not from_time_obj or not to_time_obj:
				continue

			from_time = from_time_obj.time()
			to_time = to_time_obj.time()

			if (from_time <= appointment_start_time and
				appointment_end_time <= to_time):
				in_schedule = True
				break

		if not in_schedule:
			return {"available": False, "message": "Selected time is outside service unit schedule or doesn't fit in any slot"}

		# STRICT: Check for ANY overlapping appointments (including drafts)
		filters = {
			'service_unit': service_unit_doc.name,
			'appointment_date': appointment_date,
			'docstatus': ['!=', 2]  # Exclude cancelled only
		}

		if appointment_name:
			filters['name'] = ['!=', appointment_name]

		all_appointments = frappe.get_all(
			'Patient Appointment',
			filters=filters,
			fields=['name', 'appointment_time', 'duration', 'status', 'docstatus', 'patient_name']
		)

		# Check for overlaps with ALL existing appointments
		overlapping_appointments = []
		for appointment in all_appointments:
			existing_start = safe_time_parse(appointment.appointment_time)
			if not existing_start:
				continue

			existing_duration = int(appointment.duration) if appointment.duration else appointment_duration
			existing_end = existing_start + timedelta(minutes=existing_duration)

			existing_start_time = existing_start.time()
			existing_end_time = existing_end.time()

			overlap_found = (appointment_start_time < existing_end_time and
						   appointment_end_time > existing_start_time)

			if overlap_found:
				overlapping_appointments.append(appointment)

		if overlapping_appointments:
			conflict_details = []
			for app in overlapping_appointments[:3]:
				status_info = f"{app.status}"
				if app.docstatus == 0:
					status_info = f"DRAFT - {app.status}"
				conflict_details.append(f"{app.patient_name} at {app.appointment_time} ({status_info})")

			conflict_message = f"⛔ Time slot overlaps with: {', '.join(conflict_details)}"
			if len(overlapping_appointments) > 3:
				conflict_message += f" and {len(overlapping_appointments) - 3} more"

			return {
				"available": False,
				"message": conflict_message,
				"conflicts": overlapping_appointments
			}

		return {"available": True, "message": "✅ Time slot is available"}

	except Exception as e:
		frappe.log_error(f"Error in validate_service_unit_availability_strict: {str(e)}")
		return {"available": False, "message": f"Error checking availability: {str(e)}"}


@frappe.whitelist()
def validate_service_unit_availability(service_unit, appointment_date, appointment_time, appointment_name=None, duration=30):
	"""Public interface - uses strict validation with duration"""
	return validate_service_unit_availability_strict(
		service_unit=service_unit,
		appointment_date=appointment_date,
		appointment_time=appointment_time,
		duration=duration,
		appointment_id=appointment_name
	)
