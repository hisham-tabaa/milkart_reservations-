
frappe.ui.form.on('Patient Appointment', {
    refresh: function(frm) {
        frm.trigger('setup_service_unit_availability');
    },

    service_unit: function(frm) {
        frm.trigger('setup_service_unit_availability');
        // Auto-check availability like practitioner
        if (frm.doc.service_unit && frm.doc.appointment_date) {
            setTimeout(() => {
                frm.trigger('check_service_unit_availability');
            }, 300);
        }
    },

    appointment_date: function(frm) {
        frm.trigger('setup_service_unit_availability');
        // Auto-check availability like practitioner
        if (frm.doc.service_unit && frm.doc.appointment_date) {
            setTimeout(() => {
                frm.trigger('check_service_unit_availability');
            }, 300);
        }
    },

    setup_service_unit_availability: function(frm) {
        // Remove existing buttons
        frm.remove_custom_button(__('Check Availability'));
        
        // Show availability button ONLY if service unit is selected (like practitioner)
        if (frm.doc.service_unit && frm.doc.appointment_date) {
            frm.add_custom_button(__('Check Availability'), function() {
                frm.trigger('check_service_unit_availability');
            });
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

        // Show loading indicator
        frappe.call({
            method: 'milkart_reservations.api.get_service_unit_availability',
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

function show_availability_dialog(result, frm) {
    if (!result.slots || result.slots.length === 0) {
        frappe.msgprint({
            title: __('No Slots Available'),
            message: __('No available slots found for the selected Service Unit and Date.')
        });
        return;
    }

    let dialog = new frappe.ui.Dialog({
        title: __('Available Slots'),
        fields: [
            {
                fieldname: 'html',
                fieldtype: 'HTML',
                options: get_availability_html(result.slots)
            }
        ],
        primary_action_label: __('Close'),
        primary_action: function() {
            dialog.hide();
        }
    });
    
    // Store dialog reference for global access
    frm.availability_dialog = dialog;
    
    dialog.show();
}

function get_availability_html(slots) {
    let html = `
        <div style="max-height: 400px; overflow-y: auto;">
            <div class="row">
    `;
    
    // Group slots by hour for better display (like practitioner)
    slots.forEach(function(slot) {
        html += `
            <div class="col-sm-4" style="margin-bottom: 8px;">
                <button class="btn btn-sm btn-default btn-block" 
                        onclick="cur_frm.set_value('appointment_time', '${slot.time}'); cur_frm.availability_dialog && cur_frm.availability_dialog.hide();">
                    ${slot.display_time}
                </button>
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="text-muted small mt-3">
                ${__('Click on a time slot to set the appointment time')}
            </div>
        </div>
    `;
    
    return html;
}
