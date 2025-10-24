// milkart_reservations/public/js/patient_appointment.js

frappe.ui.form.on('Patient Appointment', {
    refresh: function(frm) {
        frm.trigger('setup_service_unit_availability');
        frm.trigger('add_debug_button');
        frm.trigger('toggle_book_button');
        
        // 👇 NEW: Add custom reschedule button for Service Unit appointments
        if (!frm.is_new() && ["Open", "Checked In", "Confirmed"].includes(frm.doc.status) || 
            (frm.doc.status == "Scheduled" && !frm.doc.__islocal)) {
            
            frm.trigger('add_custom_reschedule_button');
        }
    },

    service_unit: function(frm) {
        frm.trigger('setup_service_unit_availability');
    },

    appointment_type: function(frm) {
        frm.trigger('toggle_book_button');
    },

    procedure_template: function(frm) {
        frm.trigger('toggle_book_button');
    },

    appointment_date: function(frm) {
        frm.trigger('setup_service_unit_availability');
        frm.trigger('toggle_book_button');
    },

    appointment_time: function(frm) {
        if (frm.doc.service_unit && frm.doc.appointment_date && frm.doc.appointment_time) {
            frm.trigger('validate_selected_time_slot');
        }
        frm.trigger('setup_service_unit_availability');
        frm.trigger('toggle_book_button');
    },

    // 👇 NEW: Add custom reschedule button for Service Unit appointments
    add_custom_reschedule_button: function(frm) {
        // Remove existing Reschedule button if it's a Service Unit appointment
        if (frm.doc.appointment_for === 'Service Unit') {
            frm.remove_custom_button(__('Reschedule'));
            
            // Add our custom Reschedule button
            frm.add_custom_button(__('Reschedule'), function() {
                frm.trigger('custom_service_unit_reschedule');
            });
        }
    },

    // 👇 NEW: Custom reschedule function for Service Unit appointments
    custom_service_unit_reschedule: function(frm) {
        if (!frm.doc.service_unit) {
            frappe.msgprint(__('Please select a Service Unit first'));
            return;
        }

        let d = new frappe.ui.Dialog({
            title: __('Reschedule Service Unit Appointment'),
            fields: [
                {
                    fieldtype: 'Link',
                    reqd: 1,
                    options: 'Healthcare Service Unit',
                    fieldname: 'service_unit',
                    label: 'Service Unit',
                    default: frm.doc.service_unit
                },
                { 
                    fieldtype: 'Column Break' 
                },
                { 
                    fieldtype: 'Date', 
                    reqd: 1, 
                    fieldname: 'appointment_date', 
                    label: 'Date', 
                    default: frm.doc.appointment_date,
                    min_date: new Date(frappe.datetime.get_today()) 
                },
                { 
                    fieldtype: 'Section Break' 
                },
                {
                    fieldtype: 'HTML',
                    fieldname: 'availability_section'
                }
            ],
            primary_action_label: __('Check Available Slots'),
            primary_action: function() {
                const values = d.get_values();
                if (values.service_unit && values.appointment_date) {
                    frm.trigger('show_custom_availability_dialog').then(() => {
                        // Set the service unit and date first
                        frm.set_value('service_unit', values.service_unit);
                        frm.set_value('appointment_date', values.appointment_date);
                    });
                }
                d.hide();
            },
            secondary_action_label: __('Close'),
            secondary_action: function() {
                d.hide();
            }
        });

        // Set query for service unit
        d.fields_dict.service_unit.get_query = function() {
            return {
                query: 'healthcare.controllers.queries.get_healthcare_service_units',
                filters: {
                    company: frm.doc.company,
                    inpatient_record: frm.doc.inpatient_record,
                    allow_appointments: 1,
                }
            };
        };

        d.show();
    },

    // 👇 NEW: Show custom availability dialog for rescheduling
    show_custom_availability_dialog: function(frm) {
        if (!frm.doc.service_unit) {
            frappe.msgprint(__('Please select a Service Unit first'));
            return;
        }
        
        if (!frm.doc.appointment_date) {
            frappe.msgprint(__('Please select Appointment Date first'));
            return;
        }

        frappe.call({
            method: 'milkart_reservations.api.service_unit_appointment.check_service_unit_availability',
            args: {
                service_unit: frm.doc.service_unit,
                date: frm.doc.appointment_date
            },
            callback: function(r) {
                if (r.message) {
                    show_availability_dialog(r.message, frm, true); // true = isReschedule
                } else {
                    frappe.msgprint(__('No available time slots found for the selected date'));
                }
            }
        });
    },

    toggle_book_button: function(frm) {
        const book_btn = $('button.primary-action[data-label="Book"]');
        if (!book_btn.length) return;

        const ready = 
            frm.doc.appointment_type &&
            frm.doc.appointment_date &&
            frm.doc.procedure_template &&
            frm.doc.appointment_time;

        if (ready) {
            book_btn.show();
        } else {
            book_btn.hide();
        }
    },

    setup_service_unit_availability: function(frm) {
        // Remove existing buttons
        frm.remove_custom_button(__('Check Availability'));
        
        // Show availability button ONLY when service unit and date are selected but no time
        const shouldShowButton = frm.doc.service_unit && 
                                frm.doc.appointment_date && 
                                !frm.doc.appointment_time &&
                                frm.doc.docstatus === 0;
        
        if (shouldShowButton) {
            frm.add_custom_button(__('Check Available Slots'), function() {
                frm.trigger('check_service_unit_availability');
            }).addClass('btn-primary');
        }
    },

    check_service_unit_availability: function(frm) {
        if (!frm.doc.service_unit) {
            frappe.msgprint(__('Please select a Service Unit first'));
            return;
        }
        
        if (!frm.doc.appointment_date) {
            frappe.msgprint(__('Please select Appointment Date first'));
            return;
        }

        frappe.call({
            method: 'milkart_reservations.api.service_unit_appointment.check_service_unit_availability',
            args: {
                service_unit: frm.doc.service_unit,
                date: frm.doc.appointment_date
            },
            callback: function(r) {
                if (r.message) {
                    show_availability_dialog(r.message, frm, false); // false = not reschedule
                } else {
                    frappe.msgprint(__('No available time slots found'));
                }
            }
        });
    },

    validate_selected_time_slot: function(frm) {
        if (frm.doc.appointment_for != 'Service Unit'){
            return;
        }
        if (!frm.doc.service_unit || !frm.doc.appointment_date || !frm.doc.appointment_time) {
            return;
        }

        frappe.call({
            method: 'milkart_reservations.api.service_unit_appointment.validate_service_unit_availability_strict',
            args: {
                service_unit: frm.doc.service_unit,
                appointment_date: frm.doc.appointment_date,
                appointment_time: frm.doc.appointment_time,
                duration: frm.doc.duration || 30,
                appointment_id: frm.doc.name
            },
            callback: function(r) {
                if (r.message && !r.message.available) {
                    let conflict_message = r.message.message || __('This time slot is already booked');
                    
                    frappe.msgprint({
                        title: __('⛔ Time Slot Not Available'),
                        message: conflict_message,
                        indicator: 'red'
                    });
                    
                    frm.set_value('appointment_time', '');
                    frm.refresh_field('appointment_time');
                } else {
                    frappe.show_alert({
                        message: __('✅ Time slot is available'),
                        indicator: 'green'
                    });
                }
            }
        });
    },

    before_save: function(frm) {
        if (frm.doc.appointment_for != 'Service Unit'){
            return;
        }
        if (frm.doc.service_unit && frm.doc.appointment_date && frm.doc.appointment_time) {
            return new Promise((resolve) => {
                frappe.call({
                    method: 'milkart_reservations.api.service_unit_appointment.validate_service_unit_availability_strict',
                    args: {
                        service_unit: frm.doc.service_unit,
                        appointment_date: frm.doc.appointment_date,
                        appointment_time: frm.doc.appointment_time,
                        duration: frm.doc.duration || 30,
                        appointment_id: frm.doc.name
                    },
                    callback: function(r) {
                        if (r.message && !r.message.available) {
                            let error_message = r.message.message || 
                                __('⛔ DOUBLE BOOKING PREVENTED: This time slot is already occupied.');
                            
                            frappe.msgprint({
                                title: __('Cannot Save Appointment'),
                                message: error_message,
                                indicator: 'red'
                            });
                            
                            frappe.validated = false;
                        } else {
                            frappe.validated = true;
                        }
                        resolve();
                    }
                });
            });
        }
    }
});

// 👇 UPDATED: Modified to handle both regular and reschedule scenarios
function show_availability_dialog(html_content, frm, isReschedule = false) {
    let dialog = new frappe.ui.Dialog({
        title: isReschedule ? __('Reschedule Appointment - Available Slots') : __('Select Appointment Time - Available Slots'),
        fields: [
            {
                fieldname: 'html_content',
                fieldtype: 'HTML',
                options: html_content
            }
        ],
        primary_action_label: isReschedule ? __('Reschedule') : __('Select Time'),
        primary_action: function() {
            if (isReschedule && frm.doc.appointment_time) {
                // For reschedule, save the appointment with new time
                frm.save().then(() => {
                    frappe.show_alert({
                        message: __('Appointment rescheduled successfully'),
                        indicator: 'green'
                    });
                });
            }
            dialog.hide();
        },
        secondary_action_label: __('Close'),
        secondary_action: function() {
            dialog.hide();
        }
    });
    
    dialog.show();
    
    setTimeout(() => {
        enhance_dialog_with_selection(dialog, frm, isReschedule);
    }, 300);
}

// 👇 UPDATED: Enhanced to handle reschedule flow
function enhance_dialog_with_selection(dialog, frm, isReschedule = false) {
    const dialog_body = dialog.body;
    
    let timeButtons = Array.from(dialog_body.querySelectorAll('button')).filter(button => {
        const text = button.textContent.trim();
        return text && (text.includes('AM') || text.includes('PM') || text.match(/\d{1,2}:\d{2}/));
    });
    
    if (timeButtons.length === 0) {
        timeButtons = Array.from(dialog_body.querySelectorAll('.btn, .slot-available, [data-time]'));
    }
    
    timeButtons.forEach(button => {
        const originalTime = button.textContent.trim();
        const timeValue = convert_display_time_to_value(originalTime);
        
        button.setAttribute('data-original-time', originalTime);
        button.setAttribute('data-time-value', timeValue);
        
        button.removeAttribute('onclick');
        button.onclick = null;
        button.style.cursor = 'pointer';
        button.classList.add('btn-primary');
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const selectedDisplayTime = this.getAttribute('data-original-time');
            const selectedTimeValue = this.getAttribute('data-time-value');
            
            if (frm && selectedTimeValue) {
                frappe.model.set_value(frm.doctype, frm.docname, 'appointment_time', selectedTimeValue);
                
                frappe.show_alert({
                    message: __(`Appointment time set to: ${selectedDisplayTime}`),
                    indicator: 'green'
                });
                
                // Validate the selected time slot
                setTimeout(() => {
                    frm.trigger('validate_selected_time_slot');
                }, 100);
                
                // If this is a reschedule, enable the primary action button
                if (isReschedule) {
                    dialog.get_primary_btn().attr('disabled', false);
                } else {
                    dialog.hide();
                }
            }
        });
    });

    // For reschedule, disable the primary button until a time is selected
    if (isReschedule) {
        dialog.get_primary_btn().attr('disabled', true);
    }
}

// Keep the existing convert_display_time_to_value function
function convert_display_time_to_value(displayTime) {
    if (!displayTime) return '';
    
    try {
        let timeStr = displayTime.trim();
        
        if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
            return timeStr;
        }
        
        if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
            return timeStr + ':00';
        }
        
        let period = '';
        
        if (timeStr.toUpperCase().includes('AM')) {
            period = 'AM';
            timeStr = timeStr.replace(/AM/gi, '').trim();
        } else if (timeStr.toUpperCase().includes('PM')) {
            period = 'PM';
            timeStr = timeStr.replace(/PM/gi, '').trim();
        }
        
        const timeParts = timeStr.split(':');
        if (timeParts.length < 1) return timeStr + ':00';
        
        let hours = parseInt(timeParts[0]);
        let minutes = '00';
        
        if (timeParts.length >= 2) {
            minutes = timeParts[1].padStart(2, '0');
        }
        
        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
        
    } catch (error) {
        console.error('Time conversion error:', error, displayTime);
        return displayTime;
    }
}

console.log('Milkart Patient Appointment JS loaded - Enhanced with Reschedule functionality');