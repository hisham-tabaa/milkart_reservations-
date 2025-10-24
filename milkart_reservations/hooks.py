from . import __version__ as app_version

# ============================================
# App Information
# ============================================
app_name = "milkart_reservations"
app_title = "Milkart Reservations"
app_publisher = "Healthcare"
app_description = "Service Unit Reservation System for Healthcare in ERPNext"
app_email = "contact@example.com"
app_license = "MIT"
app_version = '1.0.0'


# ============================================
# App Includes (CSS/JS)
# ============================================
# Global CSS and JS files included in all pages
app_include_css = [
	"/assets/milkart_reservations/css/healthcare_service_unit.css",
	"/assets/milkart_reservations/css/patient_appointment_calendar_enhanced.css"
]
app_include_js = [
	"/assets/milkart_reservations/js/common.js",
	"/assets/milkart_reservations/js/healthcare_service_unit.js"
]


# ============================================
# Page JS (for specific pages)
# ============================================
page_js = {
	"patient-appointment-calendar": "public/js/patient_appointment_calendar_enhanced.js"
}


# ============================================
# DocType JS (form-level controllers)
# ============================================
doctype_js = {
	"Healthcare Service Unit": "public/js/healthcare_service_unit.js",
	"Service Unit Reservation": "public/js/service_unit_reservation.js",
	"Patient Appointment": "public/js/patient_appointment.js"
}


# ============================================
# Document Events (server-side validation)
# ============================================
doc_events = {
	"Patient Appointment": {
		"before_save": "milkart_reservations.events.patient_appointment.validate_appointment_before_save"
	},
	"Service Unit Reservation": {
		"validate": "milkart_reservations.events.service_unit_reservation.validate_availability"
	}
}


# ============================================
# Document Class Override (advanced override)
# ============================================
override_doctype_class = {
	"Patient Appointment": "milkart_reservations.overrides.patient_appointment.InsightCorePatientAppointment"
}


# ============================================
# Installation & Setup
# ============================================
after_install = "milkart_reservations.install.after_install"


# ============================================
# Fixtures (Custom Fields, Doctypes, etc.)
# ============================================
fixtures = [
	{
		"dt": "Custom Field",
		"filters": [
			["module", "=", "Milkart Reservations"]
		]
	}
]


# ============================================
# Scheduled Tasks (Cron Jobs)
# ============================================
scheduler_events = {
	"cron": {
		# Run daily at midnight to clean up old reservations
		"0 0 * * *": [
			"milkart_reservations.api.maintenance.cleanup_old_reservations"
		]
	}
}


# ============================================
# Testing
# ============================================
# pytest test configuration (optional)
