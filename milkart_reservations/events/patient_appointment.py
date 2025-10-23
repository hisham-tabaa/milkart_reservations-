"""
Patient Appointment event handlers for validation
Consolidated to avoid duplication
"""
import frappe
from frappe import _
from milkart_reservations.api.availability import validate_service_unit_availability_strict


def validate_appointment_before_save(doc, method=None):
	"""
	STRICT VALIDATION: Validate service unit availability before saving Patient Appointment
	Called via doc_events hook
	"""
	try:
		# Only validate if it has service unit and time details
		if doc.service_unit and doc.appointment_date and doc.appointment_time:
			frappe.logger().info(f"🔍 [DOUBLE-BOOKING-CHECK] Validating appointment: {doc.name} at {doc.appointment_time}")

			# Use the STRICT validation with actual duration parameter
			appointment_duration = doc.duration or 30

			result = validate_service_unit_availability_strict(
				service_unit=doc.service_unit,
				appointment_date=doc.appointment_date,
				appointment_time=doc.appointment_time,
				duration=appointment_duration,
				appointment_id=doc.name
			)

			frappe.logger().info(f"🔍 [DOUBLE-BOOKING-CHECK] Validation result: {result}")

			if not result.get('available'):
				error_msg = f"⛔ Double Booking Prevention: {result.get('message', 'This time slot is already booked')}"
				frappe.logger().info(f"🔍 [DOUBLE-BOOKING-CHECK] BLOCKING SAVE: {error_msg}")
				frappe.throw(_(error_msg))
			else:
				frappe.logger().info(f"🔍 [DOUBLE-BOOKING-CHECK] Validation PASSED - allowing save")
		else:
			frappe.logger().info(f"🔍 [DOUBLE-BOOKING-CHECK] Skipping validation - missing required fields")

	except Exception as e:
		frappe.logger().error(f"🔍 [DOUBLE-BOOKING-CHECK] Error in validate_appointment_before_save: {str(e)}")
		# Re-raise the exception to prevent saving
		raise


@frappe.whitelist()
def reschedule_via_calendar(docname, new_date, new_time):
	"""Allow rescheduling appointments from calendar view"""
	doc = frappe.get_doc("Patient Appointment", docname)
	doc.appointment_date = new_date
	doc.appointment_time = new_time
	doc.set_appointment_datetime()
	doc.validate()  # runs overlap checks
	doc.save()
	return {"success": True}
