// milkart_reservations/public/js/patient_appointment.js

frappe.ui.form.on('Patient Appointment', {
    refresh: function(frm) {
        frm.trigger('setup_service_unit_availability');
        frm.trigger('add_debug_button');
        frm.trigger('toggle_book_button'); // 👈 NEW: control Book button visibility
    },

    service_unit: function(frm) {
        frm.trigger('setup_service_unit_availability');
    },

    appointment_type: function(frm) {
        frm.trigger('toggle_book_button'); // 👈 NEW
    },

    procedure_template: function(frm) {
        frm.trigger('toggle_book_button'); // 👈 NEW
    },

    appointment_date: function(frm) {
        frm.trigger('setup_service_unit_availability');
        frm.trigger('toggle_book_button'); // 👈 NEW
    },

    appointment_time: function(frm) {
        // Validate ONLY the selected time slot when time is selected
        if (frm.doc.service_unit && frm.doc.appointment_date && frm.doc.appointment_time) {
            frm.trigger('validate_selected_time_slot');
        }
        frm.trigger('setup_service_unit_availability');
        frm.trigger('toggle_book_button'); // 👈 NEW
    },

    // 👇 NEW: Toggle visibility of the primary "Book" button
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
                    show_availability_dialog(r.message, frm);
                } else {
                    frappe.msgprint(__('No available time slots found'));
                }
            }
        });
    },

    validate_selected_time_slot: function(frm) {
        // ⭐ ONLY validate the currently selected time slot
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
                    
                    // FORCE CLEAR the appointment time to prevent saving
                    frm.set_value('appointment_time', '');
                    frm.refresh_field('appointment_time');
                } else {
                    // Time slot is available
                    frappe.show_alert({
                        message: __('✅ Time slot is available'),
                        indicator: 'green'
                    });
                }
            }
        });
    },


    before_save: function(frm) {
        // ⭐ FINAL VALIDATION - This should match server-side validation
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
                            
                            // Prevent the save operation
                            frappe.validated = false;
                        } else {
                            // Validation passed - allow save
                            frappe.validated = true;
                        }
                        resolve();
                    }
                });
            });
        }
    }
});

// Keep the existing show_availability_dialog and convert_display_time_to_value functions
function show_availability_dialog(html_content, frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Select Appointment Time - Available Slots'),
        fields: [
            {
                fieldname: 'html_content',
                fieldtype: 'HTML',
                options: html_content
            }
        ],
        primary_action_label: __('Close'),
        primary_action: function() {
            dialog.hide();
        }
    });
    
    dialog.show();
    
    setTimeout(() => {
        enhance_dialog_with_selection(dialog, frm);
    }, 300);
}

function enhance_dialog_with_selection(dialog, frm) {
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
                
                dialog.hide();
            }
        });
    });
}

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

console.log('Milkart Patient Appointment JS loaded - FOCUSED on selected time slot validation');