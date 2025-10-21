import frappe
from frappe import _

def validate_appointment_time(doc, method):
    """
    Validate that the appointment time slot is available
    """
    if doc.service_unit and doc.appointment_date and doc.appointment_time:
        # Check for conflicts
        has_conflict, existing_appointments = frappe.get_value(
            'Patient Appointment',
            filters={
                'service_unit': doc.service_unit,
                'appointment_date': doc.appointment_date,
                'appointment_time': doc.appointment_time,
                'docstatus': ['!=', 2],  # Not cancelled
                'name': ['!=', doc.name]  # Exclude current appointment
            },
            fieldname=['name', 'patient']
        )
        
        if has_conflict:
            frappe.throw(_(
                f"Time slot {doc.appointment_time} on {doc.appointment_date} is already booked. "
                f"Please choose a different time slot."
            ))