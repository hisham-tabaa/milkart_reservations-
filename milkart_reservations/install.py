
import frappe

def after_install():
    """Run after app is installed"""
    try:
        print("Milkart Reservations installed successfully!")
        
        # Add custom fields if they don't exist
        setup_custom_fields()
        
        # Setup scheduler for cleanup
        setup_scheduler_events()
        
    except Exception as e:
        frappe.log_error(f"Error in Milkart Reservations after_install: {str(e)}")

def setup_custom_fields():
    """Setup custom fields for the app"""
    try:
        # Check if custom fields already exist
        existing_fields = frappe.get_all("Custom Field", 
            filters={"module": "Milkart Reservations"},
            fields=["name"]
        )
        
        if not existing_fields:
            print("Setting up custom fields for Milkart Reservations...")
            # Custom fields will be installed via fixtures
        else:
            print(f"Found {len(existing_fields)} existing custom fields")
            
    except Exception as e:
        frappe.log_error(f"Error setting up custom fields: {str(e)}")

def setup_scheduler_events():
    """Setup scheduled tasks"""
    try:
        # Check if scheduler event already exists
        existing_events = frappe.get_all("Scheduled Job Type",
            filters={"method": "milkart_reservations.api.service_unit_appointment.cleanup_old_reservations"},
            fields=["name"]
        )
        
        if not existing_events:
            print("Setting up scheduler events...")
            # Scheduler events can be added here if needed
        else:
            print("Scheduler events already configured")
            
    except Exception as e:
        frappe.log_error(f"Error setting up scheduler events: {str(e)}")
