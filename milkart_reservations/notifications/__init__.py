
import frappe
from frappe import _

def get_notification_config():
    return {
        "for_doctype": {
            "Patient Appointment": {
                "milestones": {
                    "status": ["Open", "Scheduled", "Closed", "Cancelled"]
                }
            },
            "Service Unit Reservation": {
                "milestones": {
                    "status": ["Scheduled", "In Progress", "Completed", "Cancelled"]
                }
            }
        }
    }
