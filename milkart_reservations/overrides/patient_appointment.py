"""
Patient Appointment Document Override
Adds service unit availability validation as part of the document class
"""
import frappe
from frappe import _
from frappe.model.document import Document
from milkart_reservations.api.availability import validate_service_unit_availability_strict
from healthcare.healthcare.doctype.patient_appointment.patient_appointment import PatientAppointment


class InsightCorePatientAppointment(PatientAppointment):
	"""Custom Patient Appointment class with service unit validation"""

	def validate(self):
		"""Override the validate method to check service unit availability"""
		super().validate()
		self.validate_service_unit_availability()

	def validate_service_unit_availability(self):
		"""
		Validate service unit availability only when the appointment is for a Service Unit.
		"""
		# Skip validation if this is NOT a Service Unit appointment
		if self.appointment_for != 'Service Unit':
			return

		if self.service_unit and self.appointment_date and self.appointment_time and self.docstatus == 0:
			result = validate_service_unit_availability_strict(
				service_unit=self.service_unit,
				appointment_date=self.appointment_date,
				appointment_time=self.appointment_time,
				duration=self.duration or 30,
				appointment_id=self.name
			)

			if not result.get('available'):
				frappe.throw(_("Service Unit Not Available: {0}").format(
					result.get('message', 'Time slot is not available')
				))

				
@frappe.whitelist()
def reschedule_via_calendar(docname: str, new_date: str, new_time: str):
    """
    Reschedule an appointment to `new_date` + `new_time`.
    This is a simple, permissive reschedule used by the calendar drag-drop.
    Add any extra validations you need here.
    """
    try:
        doc = frappe.get_doc("Patient Appointment", docname)
        # Update fields
        doc.appointment_date = new_date
        doc.appointment_time = new_time
        # Save
        doc.save(ignore_permissions=True)
        # Optionally submit or do other workflow steps as needed
        return {"success": True, "name": doc.name}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "reschedule_via_calendar error")
        return {"success": False, "error": str(e)}