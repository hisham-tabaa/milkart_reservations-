
import frappe
from frappe import _
from datetime import datetime, timedelta

def get_service_unit_doc(service_unit):
    """Get service unit document by name or healthcare_service_unit_name"""
    try:
        # First try direct lookup by name
        if frappe.db.exists("Healthcare Service Unit", service_unit):
            return frappe.get_doc("Healthcare Service Unit", service_unit)
        
        # If not found, try lookup by healthcare_service_unit_name
        units = frappe.get_all("Healthcare Service Unit",
                              filters={"healthcare_service_unit_name": service_unit},
                              fields=["name"])
        if units:
            return frappe.get_doc("Healthcare Service Unit", units[0].name)
        
        # If still not found, return None
        return None
        
    except Exception as e:
        frappe.log_error(f"Error in get_service_unit_doc: {str(e)}")
        return None

@frappe.whitelist()
def get_service_unit_availability(service_unit, date):
    """Get available slots for service unit based on its child table schedule"""
    try:
        # Get service unit document
        service_unit_doc = get_service_unit_doc(service_unit)
        if not service_unit_doc:
            return {"slots": [], "message": f"Service Unit '{service_unit}' not found"}
        
        # Get service unit schedule from child table
        schedule_slots = get_service_unit_schedule_slots(service_unit_doc.name, date)
        
        if not schedule_slots:
            return {"slots": [], "message": "No schedule found for this service unit on selected date"}
        
        # Get existing appointments
        existing_appointments = frappe.get_all(
            'Patient Appointment',
            filters={
                'service_unit': service_unit_doc.healthcare_service_unit_name,
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
            "schedule_found": True,
            "service_unit_name": service_unit_doc.healthcare_service_unit_name,
            "message": f"Available time slots based on service unit schedule"
        }
        
    except Exception as e:
        frappe.log_error(f"Error in get_service_unit_availability: {str(e)}")
        return {"slots": [], "message": f"Error checking availability: {str(e)}"}

def get_service_unit_schedule_slots(service_unit_name, date):
    """Get schedule slots for service unit on specific date from child table"""
    try:
        appointment_date = frappe.utils.getdate(date)
        day_of_week = appointment_date.strftime('%A')
        
        # Get service unit with child table data
        service_unit_doc = frappe.get_doc("Healthcare Service Unit", service_unit_name)
        
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
            slots.append({
                'time': current_time.strftime('%H:%M:%S'),
                'display_time': current_time.strftime('%I:%M %p'),
                'available': True
            })
        current_time += timedelta(minutes=duration)
    
    return slots

def mark_occupied_slots(slots, appointments):
    """Mark slots as occupied based on existing appointments"""
    for appointment in appointments:
        if appointment.status == 'Scheduled':
            appointment_time = appointment.appointment_time
            duration = appointment.duration or 30
            
            for slot in slots:
                slot_time = slot['time']
                if is_time_overlap(slot_time, appointment_time, duration):
                    slot['available'] = False
    
    return [slot for slot in slots if slot['available']]

def is_time_overlap(slot_time, appointment_time, duration_minutes):
    """Check if time slots overlap"""
    slot_dt = datetime.strptime(slot_time, '%H:%M:%S')
    appointment_dt = datetime.strptime(str(appointment_time), '%H:%M:%S')
    
    time_diff = abs((slot_dt - appointment_dt).total_seconds() / 60)
    return time_diff < duration_minutes

@frappe.whitelist()
def check_service_unit_availability(service_unit, date):
    """Check availability for frontend - returns HTML"""
    result = get_service_unit_availability(service_unit, date)
    
    if not result["slots"]:
        return f"<p>{result['message']}</p>"
    
    html = f'''
    <div style="max-height: 400px; overflow-y: auto;">
        <h4>Available Time Slots for {result.get('service_unit_name', service_unit)}:</h4>
        <div class="row" style="margin-top: 15px;">
    '''
    
    for slot in result["slots"]:
        html += f'''
            <div class="col-sm-4" style="margin-bottom: 10px;">
                <button class="btn btn-sm btn-success" style="width: 100%;" 
                        onclick="frappe.ui.form.get_cur_frm().set_value('appointment_time', '{slot['time']}');">
                    {slot['display_time']}
                </button>
            </div>
        '''
    
    html += '</div></div>'
    return html

@frappe.whitelist()
def get_service_units_for_appointment(txt, searchfield, start, page_len, filters):
    """Get service units for appointment dropdown - shows display names but returns document names"""
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
