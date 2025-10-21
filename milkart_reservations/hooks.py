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

# Document Events - Use doc_events for reliable validation
doc_events = {
    "Patient Appointment": {
        "before_save": "milkart_reservations.api.service_unit_appointment.validate_appointment_before_save"
    }
}

# Installation
after_install = "milkart_reservations.install.after_install"

# Fixtures for custom fields
fixtures = [
    {
        "dt": "Custom Field", 
        "filters": [
            ["module", "=", "Milkart Reservations"]
        ]
    }
]

# Scheduled Tasks
scheduler_events = {
    "cron": {
        "0 0 * * *": [
            "milkart_reservations.api.service_unit_appointment.cleanup_old_reservations"
        ]
    }
}

# Testing
# ----