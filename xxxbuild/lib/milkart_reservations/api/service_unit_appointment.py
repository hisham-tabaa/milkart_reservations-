
import frappe
from frappe import _
from datetime import datetime, timedelta

@frappe.whitelist()
def get_service_unit_availability(service_unit, date):
    """Get available slots for service unit - EXACTLY like practitioner availability"""
    try:
        # Get service unit schedule from child table
        schedule_slots = get_service_unit_schedule_slots(service_unit, date)
        
        if not schedule_slots:
            return {
                "slots": [], 
                "message": "No schedule found for selected date1"
            }
        
        # Get existing appointments (exclude cancelled like practitioner)
        existing_appointments = frappe.get_all(
            'Patient Appointment',
            filters={
                'service_unit': service_unit,
                'appointment_date': date,
                'docstatus': ['!=', 2]  # Exclude cancelled
            },
            fields=['name', 'appointment_time', 'duration', 'status']
        )
        
        # Generate available slots
        available_slots = []
        for schedule_slot in schedule_slots:
            slots = generate_time_slots_from_schedule(
                schedule_slot['from_time'],
                schedule_slot['to_time'],
                schedule_slot.get('duration', 30)
            )
            available_slots.extend(mark_occupied_slots(slots, existing_appointments))
        
        return {
            "slots": available_slots,
            "service_unit": service_unit,
            "date": date,
            "total_slots": len(available_slots)
        }
        
    except Exception as e:
        frappe.log_error(f"Error in get_service_unit_availability: {str(e)}")
        return {"slots": [], "message": f"Error checking availability: {str(e)}"}

def get_service_unit_schedule_slots(service_unit, date):
    """Get schedule slots for service unit on specific date"""
    try:
        appointment_date = frappe.utils.getdate(date)
        day_of_week = appointment_date.strftime('%A')
        
        # Get service unit with child table data
        service_unit_doc = frappe.get_doc("Healthcare Service Unit", service_unit)
        
        time_slots = []
        for slot in service_unit_doc.service_unit_schedule:
            if slot.day == day_of_week:
                time_slots.append({
                    'from_time': slot.from_time,
                    'to_time': slot.to_time,
                    'duration': slot.duration or 30
                })
        
        return time_slots
        
    except Exception as e:
        frappe.log_error(f"Error in get_service_unit_schedule_slots: {str(e)}")
        return []

def generate_time_slots_from_schedule(from_time, to_time, duration=30):
    """Generate time slots based on schedule times"""
    slots = []
    
    start_time = datetime.strptime(str(from_time), '%H:%M:%S')
    end_time = datetime.strptime(str(to_time), '%H:%M:%S')
    
    current_time = start_time
    while current_time < end_time:
        slot_end = current_time + timedelta(minutes=duration)
        if slot_end <= end_time:
            time_str = current_time.strftime('%H:%M:%S')
            display_time = current_time.strftime('%I:%M %p')
            
            slots.append({
                'time': time_str,
                'display_time': display_time,
                'available': True
            })
        current_time += timedelta(minutes=duration)
    
    return slots

def mark_occupied_slots(slots, appointments):
    """Mark slots as occupied based on existing appointments"""
    for appointment in appointments:
        if appointment.status in ['Scheduled', 'Open']:
            appointment_time = appointment.appointment_time
            duration = appointment.duration or 30
            
            for slot in slots:
                if slot['available'] and is_time_overlap(slot['time'], appointment_time, duration):
                    slot['available'] = False
    
    return [slot for slot in slots if slot['available']]

def is_time_overlap(slot_time, appointment_time, duration_minutes):
    """Check if time slots overlap"""
    if not appointment_time:
        return False
        
    slot_dt = datetime.strptime(slot_time, '%H:%M:%S')
    appointment_dt = datetime.strptime(str(appointment_time), '%H:%M:%S')
    
    time_diff = abs((slot_dt - appointment_dt).total_seconds() / 60)
    return time_diff < duration_minutes

@frappe.whitelist()
def check_service_unit_availability(service_unit, date):
    """Legacy function for backward compatibility"""
    return get_service_unit_availability(service_unit, date)
