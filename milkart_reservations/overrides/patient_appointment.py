
import frappe
from frappe import _
from frappe.model.document import Document

class PatientAppointment(Document):
    def validate(self):
        """Override the validate method to check service unit availability"""
        super(PatientAppointment, self).validate()
        self.validate_service_unit_availability()
    
    def validate_service_unit_availability(self):
        """Validate service unit availability before saving"""
        if (self.service_unit and self.appointment_date and self.appointment_time 
            and self.docstatus == 0):  # Only validate for draft documents
            
            from milkart_reservations.api.service_unit_appointment import validate_service_unit_availability
            
            result = validate_service_unit_availability(
                self.service_unit,
                self.appointment_date,
                self.appointment_time,
                self.name
            )
            
            if not result.get('available'):
                frappe.throw(_("Service Unit Not Available: {0}").format(
                    result.get('message', 'Time slot is not available')
                ))

# Alternative approach using doc_events if class override doesn't work
def validate_service_unit_availability(doc, method=None):
    """Validate service unit availability - called via doc_events"""
    if (doc.service_unit and doc.appointment_date and doc.appointment_time 
        and doc.docstatus == 0):
        
        from milkart_reservations.api.service_unit_appointment import validate_service_unit_availability as validate_slot
        
        result = validate_slot(
            doc.service_unit,
            doc.appointment_date,
            doc.appointment_time,
            doc.name
        )
        
        if not result.get('available'):
            frappe.throw(_("Service Unit Not Available: {0}").format(
                result.get('message', 'Time slot is not available')
            ))
            
@frappe.whitelist()
def reschedule_via_calendar(docname, new_date, new_time):
    doc = frappe.get_doc("Patient Appointment", docname)
    doc.appointment_date = new_date
    doc.appointment_time = new_time
    doc.set_appointment_datetime()
    doc.validate()  # runs overlap checks
    doc.save()
    return {"success": True}            
