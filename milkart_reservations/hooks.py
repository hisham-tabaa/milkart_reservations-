
from . import __version__ as app_version

app_name = "milkart_reservations"
app_title = "Milkart Reservations"
app_publisher = "Your Company"
app_description = "Service Unit Reservation System for Healthcare"
app_email = "your-email@example.com"
app_license = "MIT"

# Includes in <head>
app_include_css = "/assets/milkart_reservations/css/healthcare_service_unit.css"
app_include_js = "/assets/milkart_reservations/js/healthcare_service_unit.js"

# include js in doctype views
doctype_js = {
    "Healthcare Service Unit": "public/js/healthcare_service_unit.js",
    "Service Unit Reservation": "public/js/service_unit_reservation.js",
    "Patient Appointment": "public/js/patient_appointment.js"
}

# Document Events (commented out until we create the actual modules)
# doc_events = {
#     "Healthcare Service Unit": {
#         "on_update": "milkart_reservations.milkart_reservations.events.healthcare_service_unit.on_update"
#     }
# }

# Installation (commented out until we create the actual modules)
# after_install = "milkart_reservations.install.after_install"
