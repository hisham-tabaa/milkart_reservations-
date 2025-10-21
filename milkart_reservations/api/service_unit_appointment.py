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

def safe_time_parse(time_str):
    """Safely parse time strings with microsecond support"""
    if not time_str:
        return None
    try:
        # Handle full time format with microseconds
        if '.' in str(time_str):
            return datetime.strptime(str(time_str), '%H:%M:%S.%f')
        else:
            return datetime.strptime(str(time_str), '%H:%M:%S')
    except ValueError as e:
        frappe.log_error(f"Time parsing failed for: {time_str}, Error: {str(e)}")
        return None

@frappe.whitelist()
def get_service_unit_availability(service_unit, date):
    """Get available slots for service unit based on its child table schedule - ENHANCED CONFLICT PREVENTION"""
    try:
        # Get service unit document
        service_unit_doc = get_service_unit_doc(service_unit)
        if not service_unit_doc:
            return {"slots": [], "message": f"Service Unit '{service_unit}' not found"}
        
        # Get service unit schedule from child table
        schedule_slots = get_service_unit_schedule_slots(service_unit_doc.name, date)
        
        if not schedule_slots:
            return {"slots": [], "message": "No schedule found for this service unit on selected date"}
        
        # Get ALL existing appointments (including drafts) for strict conflict checking
        existing_appointments = frappe.get_all(
            'Patient Appointment',
            filters={
                'service_unit': service_unit_doc.name,  # ✅ CORRECT - using document name
                'appointment_date': date,
                'docstatus': ['!=', 2]  # Exclude cancelled only
            },
            fields=['name', 'appointment_time', 'duration', 'status', 'docstatus']
        )
        
        # Generate available slots with strict conflict checking
        available_slots = []
        for schedule_slot in schedule_slots:
            # ✅ USE ACTUAL DURATION FROM SCHEDULE
            slot_duration = schedule_slot.get('duration', 30)
            slots = generate_time_slots_from_schedule(
                schedule_slot['from_time'],
                schedule_slot['to_time'],
                slot_duration  # ✅ PASS ACTUAL DURATION
            )
            # Use strict conflict checking with actual duration
            filtered_slots = mark_occupied_slots_strict(slots, existing_appointments, slot_duration)  # ✅ PASS ACTUAL DURATION
            available_slots.extend(filtered_slots)
        
        return {
            "slots": available_slots,
            "schedule_found": True,
            "service_unit_name": service_unit_doc.healthcare_service_unit_name,
            "total_existing_appointments": len(existing_appointments),
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
    """Generate time slots based on schedule times - WITH MICROSECOND SUPPORT"""
    slots = []
    
    # ENHANCED TIME PARSING - Handle microseconds
    start_time_obj = safe_time_parse(from_time)
    end_time_obj = safe_time_parse(to_time)
    
    if not start_time_obj or not end_time_obj:
        return slots
    
    start_time = datetime.combine(datetime.today(), start_time_obj.time())
    end_time = datetime.combine(datetime.today(), end_time_obj.time())
    
    current_time = start_time
    while current_time < end_time:
        slot_end = current_time + timedelta(minutes=duration)
        if slot_end <= end_time:
            slots.append({
                'time': current_time.strftime('%H:%M:%S'),
                'display_time': current_time.strftime('%I:%M %p'),
                'available': True,
                'slot_start': current_time.time(),
                'slot_end': slot_end.time(),
                'conflict_reason': None
            })
        current_time += timedelta(minutes=duration)
    
    return slots

def mark_occupied_slots_strict(slots, appointments, slot_duration=30):
    """STRICT VERSION: Mark slots as occupied based on ALL existing appointments (including drafts) - WITH MICROSECOND SUPPORT"""
    
    for appointment in appointments:
        # Include ALL appointments except cancelled (draft, submitted, scheduled, open, etc.)
        if appointment.docstatus != 2:  # Not cancelled
            appointment_time_obj = safe_time_parse(appointment.appointment_time)
            if not appointment_time_obj:
                continue
                
            appointment_duration = appointment.duration or slot_duration
            appointment_end_time = (datetime.combine(datetime.today(), appointment_time_obj.time()) + 
                                  timedelta(minutes=appointment_duration)).time()
            
            for slot in slots:
                if slot['available']:
                    slot_start = slot['slot_start']
                    slot_end = slot['slot_end']
                    
                    # Check for ANY overlap
                    overlap_found = (slot_start < appointment_end_time and slot_end > appointment_time_obj.time())
                    
                    if overlap_found:
                        slot['available'] = False
                        slot['conflict_reason'] = f"Booked by appointment {appointment.name} ({appointment.status})"
    
    return [slot for slot in slots if slot['available']]

@frappe.whitelist()
def check_service_unit_availability(service_unit, date, duration=None):
    """Check availability for frontend - returns HTML with enhanced conflict info"""
    # ✅ USE PROVIDED DURATION OR GET FROM SERVICE UNIT
    if not duration:
        # Try to get default duration from service unit schedule
        service_unit_doc = get_service_unit_doc(service_unit)
        if service_unit_doc and service_unit_doc.service_unit_schedule:
            # Get duration from first schedule for this day
            appointment_date = frappe.utils.getdate(date)
            day_of_week = appointment_date.strftime('%A')
            for schedule in service_unit_doc.service_unit_schedule:
                if schedule.day == day_of_week:
                    duration = schedule.duration or 30
                    break
    
    result = get_service_unit_availability(service_unit, date)
    
    if not result["slots"]:
        no_slots_message = result.get('message', 'No available slots')
        if result.get('total_existing_appointments', 0) > 0:
            no_slots_message += f" - {result['total_existing_appointments']} existing appointment(s)"
        return f"<p>{no_slots_message}</p>"
    
    html = f'''
    <div style="max-height: 400px; overflow-y: auto;">
        <h4>Available Time Slots for {result.get('service_unit_name', service_unit)}:</h4>
        <div style="margin: 10px 0; padding: 8px; background: #e8f5e8; border-radius: 4px; border: 1px solid #4caf50;">
            <strong>Note:</strong> Time slots already booked (including draft appointments) are automatically excluded.
            {f"<br><strong>Slot Duration:</strong> {duration} minutes" if duration else ""}
        </div>
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

@frappe.whitelist()
def validate_service_unit_availability_strict(service_unit, appointment_date, appointment_time, duration=None, appointment_id=None):
    """STRICT VALIDATION: Prevents ALL overlaps including draft appointments - FIXED VERSION"""
    try:
        if not all([service_unit, appointment_date, appointment_time]):
            return {"available": False, "message": "Service unit, date and time are required"}

        # Get service unit document
        service_unit_doc = get_service_unit_doc(service_unit)
        if not service_unit_doc:
            return {"available": False, "message": "Service unit not found"}

        # ✅ ENHANCED DURATION HANDLING
        # If duration not provided, try to get from service unit schedule or default to 30
        if not duration:
            # Try to get duration from service unit schedule for this day
            schedule_slots = get_service_unit_schedule_slots(service_unit_doc.name, appointment_date)
            if schedule_slots:
                # Use duration from first matching schedule
                appointment_duration = schedule_slots[0].get('duration', 30)
            else:
                appointment_duration = 30
        else:
            appointment_duration = int(duration)

        appointment_name = appointment_id  # Use consistent naming

        # Convert appointment time to datetime objects for comparison
        appointment_start = safe_time_parse(appointment_time)
        if not appointment_start:
            return {"available": False, "message": "Invalid appointment time format"}
            
        appointment_end = appointment_start + timedelta(minutes=appointment_duration)
        
        appointment_start_time = appointment_start.time()
        appointment_end_time = appointment_end.time()

        # Get schedule for the day
        schedule_slots = get_service_unit_schedule_slots(service_unit_doc.name, appointment_date)
        if not schedule_slots:
            return {"available": False, "message": "No schedule found for selected date"}

        # Check if appointment time falls within any schedule slot
        in_schedule = False
        for schedule_slot in schedule_slots:
            from_time_obj = safe_time_parse(schedule_slot['from_time'])
            to_time_obj = safe_time_parse(schedule_slot['to_time'])
            
            if not from_time_obj or not to_time_obj:
                continue
                
            from_time = from_time_obj.time()
            to_time = to_time_obj.time()
            
            # Check if appointment fits within schedule slot
            if (from_time <= appointment_start_time and 
                appointment_end_time <= to_time):
                in_schedule = True
                break

        if not in_schedule:
            return {"available": False, "message": "Selected time is outside service unit schedule or doesn't fit in any slot"}

        # STRICT: Check for ANY overlapping appointments (including drafts)
        filters = {
            'service_unit': service_unit_doc.name,  # ✅ CORRECT - using document name
            'appointment_date': appointment_date,
            'docstatus': ['!=', 2]  # Exclude cancelled only
        }
        
        # Exclude current appointment if editing
        if appointment_name:
            filters['name'] = ['!=', appointment_name]

        all_appointments = frappe.get_all(
            'Patient Appointment',
            filters=filters,
            fields=['name', 'appointment_time', 'duration', 'status', 'docstatus', 'patient_name']
        )

        # Check for overlaps with ALL existing appointments
        overlapping_appointments = []
        for appointment in all_appointments:
            existing_start = safe_time_parse(appointment.appointment_time)
            if not existing_start:
                continue
                
            existing_duration = int(appointment.duration) if appointment.duration else appointment_duration  # ✅ USE ACTUAL APPOINTMENT DURATION
            existing_end = existing_start + timedelta(minutes=existing_duration)
            
            existing_start_time = existing_start.time()
            existing_end_time = existing_end.time()

            # Check for ANY time overlap
            overlap_found = (appointment_start_time < existing_end_time and 
                           appointment_end_time > existing_start_time)
            
            if overlap_found:
                overlapping_appointments.append(appointment)

        if overlapping_appointments:
            conflict_details = []
            for app in overlapping_appointments[:3]:  # Show max 3 conflicts
                status_info = f"{app.status}"
                if app.docstatus == 0:
                    status_info = f"DRAFT - {app.status}"
                conflict_details.append(f"{app.patient_name} at {app.appointment_time} ({status_info})")
            
            conflict_message = f"⛔ Time slot overlaps with: {', '.join(conflict_details)}"
            if len(overlapping_appointments) > 3:
                conflict_message += f" and {len(overlapping_appointments) - 3} more"
                
            return {
                "available": False, 
                "message": conflict_message,
                "conflicts": overlapping_appointments
            }

        return {"available": True, "message": "✅ Time slot is available"}

    except Exception as e:
        frappe.log_error(f"Error in validate_service_unit_availability_strict: {str(e)}")
        return {"available": False, "message": f"Error checking availability: {str(e)}"}

@frappe.whitelist()
def validate_service_unit_availability(service_unit, appointment_date, appointment_time, appointment_name=None, duration=30):
    """Public interface - uses strict validation with duration"""
    return validate_service_unit_availability_strict(
        service_unit=service_unit,
        appointment_date=appointment_date, 
        appointment_time=appointment_time,
        duration=duration,
        appointment_id=appointment_name
    )

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

def validate_appointment_before_save(doc, method=None):
    """STRICT VALIDATION: Validate service unit availability before saving Patient Appointment - ENHANCED DEBUG"""
    try:
        # Only validate if it's a new appointment or time was changed
        if doc.service_unit and doc.appointment_date and doc.appointment_time:
            frappe.logger().info(f"🔍 [DOUBLE-BOOKING-DEBUG] Validating appointment: {doc.name} at {doc.appointment_time}")
            
            # ✅ USE ACTUAL APPOINTMENT DURATION
            appointment_duration = doc.duration or 30
            
            # Use the STRICT validation with actual duration parameter
            result = validate_service_unit_availability_strict(
                service_unit=doc.service_unit,
                appointment_date=doc.appointment_date,
                appointment_time=doc.appointment_time,
                duration=appointment_duration,  # ✅ PASS ACTUAL DURATION
                appointment_id=doc.name
            )
            
            frappe.logger().info(f"🔍 [DOUBLE-BOOKING-DEBUG] Validation result: {result}")
            
            if not result.get('available'):
                error_msg = f"⛔ Double Booking Prevention: {result.get('message', 'This time slot is already booked')}"
                frappe.logger().info(f"🔍 [DOUBLE-BOOKING-DEBUG] BLOCKING SAVE: {error_msg}")
                frappe.throw(_(error_msg))
            else:
                frappe.logger().info(f"🔍 [DOUBLE-BOOKING-DEBUG] Validation PASSED - allowing save")
        else:
            frappe.logger().info(f"🔍 [DOUBLE-BOOKING-DEBUG] Skipping validation - missing required fields")
                
    except Exception as e:
        frappe.logger().error(f"🔍 [DOUBLE-BOOKING-DEBUG] Error in validate_appointment_before_save: {str(e)}")
        # Re-raise the exception to prevent saving
        raise

@frappe.whitelist()
def get_service_unit_appointment_count(service_unit, date, time):
    """Get count of appointments at specific time for debugging"""
    try:
        service_unit_doc = get_service_unit_doc(service_unit)
        if not service_unit_doc:
            return 0
            
        appointment_time_obj = safe_time_parse(time)
        if not appointment_time_obj:
            return {'count': 0, 'details': [], 'message': 'Invalid time format'}
            
        appointment_time = appointment_time_obj.time()
        appointment_end_time = (datetime.combine(datetime.today(), appointment_time) + 
                              timedelta(minutes=30)).time()
        
        filters = {
            'service_unit': service_unit_doc.name,  # ✅ CORRECT - using document name
            'appointment_date': date,
            'docstatus': ['!=', 2]  # Include drafts
        }
        
        all_appointments = frappe.get_all(
            'Patient Appointment',
            filters=filters,
            fields=['name', 'appointment_time', 'duration', 'status', 'docstatus']
        )
        
        overlap_count = 0
        overlap_details = []
        
        for appointment in all_appointments:
            existing_time_obj = safe_time_parse(appointment.appointment_time)
            if not existing_time_obj:
                continue
                
            existing_time = existing_time_obj.time()
            existing_duration = appointment.duration or 30
            existing_end_time = (datetime.combine(datetime.today(), existing_time) + 
                               timedelta(minutes=existing_duration)).time()
            
            if (appointment_time < existing_end_time and 
                appointment_end_time > existing_time):
                overlap_count += 1
                status_info = f"{appointment.status}"
                if appointment.docstatus == 0:
                    status_info = f"DRAFT - {appointment.status}"
                overlap_details.append(f"{existing_time.strftime('%H:%M')} ({status_info})")
                
        return {
            'count': overlap_count,
            'details': overlap_details,
            'message': f"Found {overlap_count} overlapping appointment(s): {', '.join(overlap_details)}"
        }
        
    except Exception as e:
        frappe.log_error(f"Error in get_service_unit_appointment_count: {str(e)}")
        return {'count': 0, 'details': [], 'message': f'Error: {str(e)}'}

@frappe.whitelist()
def get_service_unit_appointment_count_strict(service_unit, date, time=None, duration=30, appointment_id=None):
    """Debug function to count ALL overlapping appointments (including drafts)"""
    try:
        service_unit_doc = get_service_unit_doc(service_unit)
        if not service_unit_doc:
            return {'count': 0, 'appointments': [], 'message': 'Service unit not found'}
            
        # Convert parameters
        appointment_duration = int(duration) if duration else 30
        appointment_start = safe_time_parse(time) if time else None
        appointment_end = appointment_start + timedelta(minutes=appointment_duration) if appointment_start else None
        
        filters = {
            'service_unit': service_unit_doc.name,  # ✅ CORRECT - using document name
            'appointment_date': date,
            'docstatus': ['!=', 2]  # Include drafts
        }
        
        # Exclude current appointment if provided
        if appointment_id:
            filters['name'] = ['!=', appointment_id]
        
        all_appointments = frappe.get_all(
            'Patient Appointment',
            filters=filters,
            fields=['name', 'appointment_time', 'duration', 'status', 'docstatus', 'patient_name']
        )
        
        overlapping_appointments = []
        
        if time and appointment_start:
            appointment_start_time = appointment_start.time()
            appointment_end_time = appointment_end.time()
            
            for appointment in all_appointments:
                existing_start = safe_time_parse(appointment.appointment_time)
                if not existing_start:
                    continue
                    
                existing_duration = int(appointment.duration) if appointment.duration else 30
                existing_end = existing_start + timedelta(minutes=existing_duration)
                
                existing_start_time = existing_start.time()
                existing_end_time = existing_end.time()
                
                # Check for ANY time overlap
                overlap_found = (appointment_start_time < existing_end_time and 
                               appointment_end_time > existing_start_time)
                
                if overlap_found:
                    overlapping_appointments.append(appointment)
        else:
            # If no time specified, return all appointments for the day
            overlapping_appointments = all_appointments
        
        # Format debug information
        debug_info = f"Found {len(overlapping_appointments)} appointment(s) for {date}"
        if time:
            debug_info = f"Found {len(overlapping_appointments)} overlapping appointment(s) for {time}"
            
        return {
            'count': len(overlapping_appointments),
            'appointments': overlapping_appointments,
            'message': debug_info
        }
        
    except Exception as e:
        frappe.log_error(f"Error in get_service_unit_appointment_count_strict: {str(e)}")
        return {'count': 0, 'appointments': [], 'message': f'Error: {str(e)}'}

@frappe.whitelist()
def force_release_time_slot(service_unit, date, time):
    """Admin function to force release a time slot (for emergency use only)"""
    try:
        if not frappe.session.user == "Administrator":
            return {"success": False, "message": "Only Administrator can use this function"}
            
        service_unit_doc = get_service_unit_doc(service_unit)
        if not service_unit_doc:
            return {"success": False, "message": "Service unit not found"}
            
        appointment_time_obj = safe_time_parse(time)
        if not appointment_time_obj:
            return {"success": False, "message": "Invalid time format"}
            
        appointment_time = appointment_time_obj.time()
        
        # Find overlapping appointments
        filters = {
            'service_unit': service_unit_doc.name,  # ✅ CORRECT - using document name
            'appointment_date': date,
            'docstatus': ['!=', 2]
        }
        
        overlapping_appointments = frappe.get_all(
            'Patient Appointment',
            filters=filters,
            fields=['name', 'appointment_time', 'status', 'docstatus']
        )
        
        released_count = 0
        for appointment in overlapping_appointments:
            existing_time_obj = safe_time_parse(appointment.appointment_time)
            if not existing_time_obj:
                continue
                
            existing_time = existing_time_obj.time()
            if existing_time == appointment_time:
                # Cancel the appointment
                frappe.db.set_value('Patient Appointment', appointment.name, 'docstatus', 2)
                released_count += 1
                
        frappe.db.commit()
        
        return {
            "success": True, 
            "message": f"Released {released_count} appointment(s) for time slot {time}"
        }
        
    except Exception as e:
        frappe.log_error(f"Error in force_release_time_slot: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}"}

@frappe.whitelist()
def cleanup_duplicate_appointments(service_unit, appointment_date):
    """Emergency function to remove duplicate appointments"""
    try:
        service_unit_doc = get_service_unit_doc(service_unit)
        if not service_unit_doc:
            return "Service unit not found"
            
        duplicates = frappe.db.sql("""
            SELECT name, appointment_time, patient_name, creation, status, docstatus
            FROM `tabPatient Appointment` 
            WHERE service_unit = %s AND appointment_date = %s AND docstatus != 2
            ORDER BY appointment_time, creation
        """, (service_unit_doc.name, appointment_date), as_dict=True)  # ✅ CORRECT - using document name
        
        # Identify duplicates (same time slot)
        seen_slots = {}
        to_cancel = []
        
        for app in duplicates:
            slot_key = app.appointment_time
            if slot_key in seen_slots:
                to_cancel.append(app.name)
            else:
                seen_slots[slot_key] = app.name
        
        # Cancel duplicates (keep the earliest one)
        for app_name in to_cancel:
            frappe.db.set_value('Patient Appointment', app_name, 'status', 'Cancelled')
            frappe.db.commit()
        
        return f"Cancelled {len(to_cancel)} duplicate appointments. Kept {len(seen_slots)} unique appointments."
        
    except Exception as e:
        frappe.log_error(f"Error in cleanup_duplicate_appointments: {str(e)}")
        return f"Error cleaning duplicates: {str(e)}"

@frappe.whitelist()
def normalize_service_unit_times():
    """One-time function to normalize time strings in service unit schedules"""
    try:
        service_units = frappe.get_all('Healthcare Service Unit', 
            fields=['name'])
        
        updated_count = 0
        for unit in service_units:
            unit_doc = frappe.get_doc('Healthcare Service Unit', unit.name)
            changed = False
            
            for schedule in unit_doc.service_unit_schedule:
                # Normalize from_time
                if schedule.from_time and '.' in str(schedule.from_time):
                    schedule.from_time = str(schedule.from_time).split('.')[0]
                    changed = True
                
                # Normalize to_time  
                if schedule.to_time and '.' in str(schedule.to_time):
                    schedule.to_time = str(schedule.to_time).split('.')[0]
                    changed = True
            
            if changed:
                unit_doc.save()
                updated_count += 1
                frappe.db.commit()
        
        return f"Normalized time formats in {updated_count} service units"
        
    except Exception as e:
        frappe.log_error(f"Error in normalize_service_unit_times: {str(e)}")
        return f"Error: {str(e)}"