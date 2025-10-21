import frappe
from frappe import _

@frappe.whitelist()
def get_service_units_for_appointment(doctype, txt, searchfield, start, page_len, filters):
    """Get service units available for appointment booking"""
    
    conditions = []
    if txt:
        conditions.append(f"name LIKE '%{txt}%' OR service_unit_name LIKE '%{txt}%'")
    
    # Filter by allow_appointments if the field exists
    if frappe.db.has_column('Healthcare Service Unit', 'allow_appointments'):
        conditions.append("allow_appointments = 1")
    
    where_condition = " AND ".join(conditions) if conditions else "1=1"
    
    query = f"""
        SELECT name, service_unit_name 
        FROM `tabHealthcare Service Unit` 
        WHERE {where_condition}
        AND is_group = 0
        AND disabled = 0
        ORDER BY name
        LIMIT {start}, {page_len}
    """
    
    return frappe.db.sql(query)
