
frappe.ui.form.on('Patient Appointment', {
    refresh: function(frm) {
        frm.trigger('setup_service_unit_availability');
    },

    service_unit: function(frm) {
        frm.trigger('setup_service_unit_availability');
        frm.trigger('auto_check_availability');
    },

    appointment_date: function(frm) {
        frm.trigger('setup_service_unit_availability');
        frm.trigger('auto_check_availability');
    },

    setup_service_unit_availability: function(frm) {
        // Remove existing buttons
        frm.remove_custom_button(__('Check Availability'));
        
        // Show availability button exactly like practitioner appointments
        if (frm.doc.service_unit && frm.doc.appointment_date) {
            frm.add_custom_button(__('Check Availability'), function() {
                frm.trigger('check_service_unit_availability');
            }).addClass('btn-primary');
        }
    },

    auto_check_availability: function(frm) {
        // Auto-check availability when both fields are filled (like practitioner)
        if (frm.doc.service_unit && frm.doc.appointment_date && !frm.doc.appointment_time) {
            setTimeout(() => {
                frm.trigger('check_service_unit_availability');
            }, 500);
        }
    },

    check_service_unit_availability: function(frm) {
        if (!frm.doc.service_unit) {
            frappe.msgprint({
                title: __('Service Unit Required'),
                message: __('Please select a Service Unit first')
            });
            return;
        }
        
        if (!frm.doc.appointment_date) {
            frappe.msgprint({
                title: __('Date Required'), 
                message: __('Please select Appointment Date first')
            });
            return;
        }

        // Show loading like practitioner appointments
        frappe.call({
            method: 'milkart_reservations.api.check_service_unit_availability',
            args: {
                service_unit: frm.doc.service_unit,
                date: frm.doc.appointment_date
            },
            callback: function(r) {
                if (r.message) {
                    show_availability_dialog(r.message, frm);
                }
            }
        });
    }
});

function show_availability_dialog(html_content, frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Available Time Slots'),
        fields: [
            {
                fieldname: 'available_slots_html',
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
}

// Set up service unit field to show display names but store document names
frappe.ui.form.on('Patient Appointment', {
    onload: function(frm) {
        // Enhance service unit field to show better display
        frm.set_query('service_unit', function() {
            return {
                query: 'milkart_reservations.api.get_service_units_for_appointment'
            };
        });
    }
});
