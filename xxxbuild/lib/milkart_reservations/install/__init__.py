
import frappe

def after_install():
    setup_custom_doctypes()
    setup_service_unit_field()
    frappe.db.commit()

def setup_custom_doctypes():
    """Create Service Unit Schedule Item child table doctype"""
    if not frappe.db.exists("DocType", "Service Unit Schedule Item"):
        child_doctype = frappe.new_doc("DocType")
        child_doctype.name = "Service Unit Schedule Item"
        child_doctype.module = "Milkart Reservations"
        child_doctype.custom = 1
        child_doctype.istable = 1
        
        fields = [
            {"fieldname": "day", "fieldtype": "Select", "label": "Day", 
             "options": "Monday\nTuesday\nWednesday\nThursday\nFriday\nSaturday\nSunday", "reqd": 1},
            {"fieldname": "from_time", "fieldtype": "Time", "label": "From Time", "reqd": 1},
            {"fieldname": "to_time", "fieldtype": "Time", "label": "To Time", "reqd": 1},
            {"fieldname": "duration", "fieldtype": "Int", "label": "Slot Duration (minutes)", "default": 30},
        ]
        
        for field_info in fields:
            child_doctype.append("fields", field_info)
        
        child_doctype.insert()
        frappe.db.commit()
        print("✅ Created Service Unit Schedule Item doctype")

def setup_service_unit_field():
    """Add Service Unit Schedule to Healthcare Service Unit"""
    if frappe.db.exists("DocType", "Healthcare Service Unit"):
        doctype = frappe.get_doc("DocType", "Healthcare Service Unit")
        
        # Remove if exists and add fresh
        doctype.fields = [f for f in doctype.fields if f.fieldname != "service_unit_schedule"]
        
        doctype.append("fields", {
            "fieldname": "service_unit_schedule",
            "fieldtype": "Table",
            "label": "Service Unit Schedule",
            "options": "Service Unit Schedule Item",
            "insert_after": "service_unit_type"
        })
        
        doctype.save()
        print("✅ Added Service Unit Schedule to Healthcare Service Unit")
