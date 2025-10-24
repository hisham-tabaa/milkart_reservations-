
frappe.ui.form.on('Healthcare Service Unit', {
    refresh: function(frm) {
        // Allow editing of schedule after creation
        frm.fields_dict.service_unit_schedule.grid.df.read_only = 0;
        frm.refresh_field('service_unit_schedule');

        // Add button to check schedule availability
        if (!frm.is_new()) {
            frm.add_custom_button(__('Check Schedule'), function() {
                frappe.msgprint({
                    title: __('Current Schedule'),
                    message: get_schedule_summary(frm)
                });
            });

            // Add button to update schedule
            frm.add_custom_button(__('Update Schedule'), function() {
                frm.save().then(() => {
                    frappe.msgprint({
                        title: __('Success'),
                        message: __('Service Unit schedule has been updated successfully')
                    });
                });
            }).addClass('btn-primary');
        }
    },

    service_unit_schedule_add: function(frm, cdt, cdn) {
        update_schedule_summary(frm);
    },

    service_unit_schedule_remove: function(frm, cdt, cdn) {
        update_schedule_summary(frm);
    }
});

function get_schedule_summary(frm) {
    let schedule = frm.doc.service_unit_schedule || [];
    let days = {};

    schedule.forEach(function(slot) {
        if (!days[slot.day]) {
            days[slot.day] = [];
        }
        days[slot.day].push(slot.from_time + ' - ' + slot.to_time);
    });

    let summary = '<div style="max-height: 300px; overflow-y: auto;">';
    summary += '<h4>Service Unit Schedule</h4>';

    Object.keys(days).sort().forEach(function(day) {
        summary += '<div style="margin-bottom: 10px;">';
        summary += '<strong>' + day + ':</strong><br>';
        days[day].forEach(function(time) {
            summary += '<span style="margin-left: 10px;">• ' + time + '</span><br>';
        });
        summary += '</div>';
    });

    if (Object.keys(days).length === 0) {
        summary += '<p>No schedule defined</p>';
    }

    summary += '</div>';
    return summary;
}

function update_schedule_summary(frm) {
    // This function can be used to update any schedule summary display
    console.log('Schedule updated');
}
