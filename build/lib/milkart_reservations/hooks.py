
from . import __version__ as app_version

app_name = "milkart_reservations"
app_title = "Milkart Reservations"
app_publisher = "Your Company"
app_description = "Service Unit Reservation System for Healthcare"
app_email = "your-email@example.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/milkart_reservations/css/healthcare_service_unit.css"
app_include_js = "/assets/milkart_reservations/js/healthcare_service_unit.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "milkart_reservations/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Healthcare Service Unit": "public/js/healthcare_service_unit.js",
    "Service Unit Reservation": "public/js/service_unit_reservation.js",
    "Patient Appointment": "public/js/patient_appointment.js"
}

# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#   "Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
#   "methods": "milkart_reservations.utils.jinja_methods",
#   "filters": "milkart_reservations.utils.jinja_filters"
# }

# Installation
# ------------

after_install = "milkart_reservations.install.after_install"
# ------------

# before_install = "milkart_reservations.install.before_install"
# after_install = "milkart_reservations.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "milkart_reservations.uninstall.before_uninstall"
# after_uninstall = "milkart_reservations.uninstall.after_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "milkart_reservations.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
#   "Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
#   "Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# from milkart_reservations.milkart_reservations.doctype.service_unit_reservation.service_unit_reservation import ServiceUnitReservation

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
    "Healthcare Service Unit": {
        "on_update": "milkart_reservations.milkart_reservations.events.healthcare_service_unit.on_update"
    }
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
#   "all": [
#       "milkart_reservations.tasks.all"
#   ],
#   "daily": [
#       "milkart_reservations.tasks.daily"
#   ],
#   "hourly": [
#       "milkart_reservations.tasks.hourly"
#   ],
#   "weekly": [
#       "milkart_reservations.tasks.weekly"
#   ],
#   "monthly": [
#       "milkart_reservations.tasks.monthly"
#   ],
# }

# Testing
# -------

# before_tests = "milkart_reservations.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
#   "frappe.desk.doctype.event.event.get_events": "milkart_reservations.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
#   "Task": "milkart_reservations.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["milkart_reservations.utils.before_request"]
# after_request = ["milkart_reservations.utils.after_request"]

# Job Events
# ----------
# before_job = ["milkart_reservations.utils.before_job"]
# after_job = ["milkart_reservations.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
#   {
#       "doctype": "{doctype_1}",
#       "filter_by": "{filter_by}",
#       "redact_fields": ["{field_1}", "{field_2}"],
#       "partial": 1,
#   },
#   {
#       "doctype": "{doctype_2}",
#       "filter_by": "{filter_by}",
#       "partial": 1,
#   },
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
#   "milkart_reservations.auth.validate"
# ]
