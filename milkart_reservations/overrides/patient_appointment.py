"""
Patient Appointment Document Override
Adds service unit availability validation as part of the document class
"""
import frappe
from frappe import _
from frappe.model.document import Document
from milkart_reservations.api.availability import validate_service_unit_availability_strict


class InsightCorePatientAppointment(Document):
	"""Custom Patient Appointment class with service unit validation"""

	def validate(self):
		"""Override the validate method to check service unit availability"""
		super().validate()
		self.validate_service_unit_availability()

	def validate_service_unit_availability(self):
		"""
		Validate service unit availability before saving
		This is an additional validation layer to the doc_events hook
		"""
		if (self.service_unit and self.appointment_date and self.appointment_time
			and self.docstatus == 0):  # Only validate for draft documents

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
