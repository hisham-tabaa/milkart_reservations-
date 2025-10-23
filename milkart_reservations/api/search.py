"""
Search and dropdown functions for autocomplete fields
"""
import frappe


@frappe.whitelist()
def get_service_units_for_appointment(txt, searchfield, start, page_len, filters):
	"""Get service units for appointment dropdown - shows display names but returns document names"""
	try:
		units = frappe.get_all("Healthcare Service Unit",
							  filters={
								  "allow_appointments": 1,
								  "is_group": 0,
								  "healthcare_service_unit_name": ["like", f"%{txt}%"]
							  },
							  fields=["name", "healthcare_service_unit_name", "service_unit_type"],
							  limit_start=start,
							  limit_page_length=page_len)

		results = []
		for unit in units:
			# Return document name but show display name
			results.append([unit.name, unit.healthcare_service_unit_name, unit.service_unit_type])

		return results

	except Exception as e:
		frappe.log_error(f"Error in get_service_units_for_appointment: {str(e)}")
		return []
