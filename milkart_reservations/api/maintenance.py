"""
Maintenance and scheduler functions for the app
"""
import frappe


@frappe.whitelist()
def cleanup_old_reservations():
	"""Clean up old reservations - called by scheduler"""
	try:
		# Clean up reservations older than 30 days
		cutoff_date = frappe.utils.add_days(frappe.utils.nowdate(), -30)

		old_reservations = frappe.get_all(
			"Service Unit Reservation",
			filters={
				"creation": ["<", cutoff_date],
				"docstatus": 1
			},
			fields=["name"]
		)

		for reservation in old_reservations:
			frappe.delete_doc("Service Unit Reservation", reservation.name)

		frappe.db.commit()
		return f"Cleaned up {len(old_reservations)} old reservations"

	except Exception as e:
		frappe.log_error(f"Error in cleanup_old_reservations: {str(e)}")
		return f"Error cleaning up reservations: {str(e)}"
