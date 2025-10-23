/**
 * Service Unit Reservation Form Controller
 * Handles availability checking and time slot selection for reservations
 */

frappe.ui.form.on('Service Unit Reservation', {
	refresh: function(frm) {
		// Initialize availability checked flag if not exists
		if (typeof frm.availability_checked === 'undefined') {
			frm.availability_checked = false;
		}

		// Remove existing buttons first
		frm.remove_custom_button(__('Check Availability'));
		frm.remove_custom_button(__('Schedule'));

		// Add check availability button (like practitioner appointment)
		if (!frm.availability_checked) {
			frm.add_custom_button(__('Check Availability'), function() {
				if (!frm.doc.service_unit) {
					frappe.msgprint(__('Please select Service Unit first'));
					return;
				}
				if (!frm.doc.reservation_date) {
					frappe.msgprint(__('Please select Date first'));
					return;
				}

				frm.trigger('check_schedule_availability');
			}).addClass('btn-primary');
		}

		// Add schedule button
		frm.add_custom_button(__('Schedule'), function() {
			frm.save().then(() => {
				frm.savesubmit();
			});
		});
	},

	service_unit: function(frm) {
		// Reset availability check flag when service unit changes
		frm.availability_checked = false;
		frm.refresh();

		// Auto-check availability when service unit changes
		if (frm.doc.service_unit && frm.doc.reservation_date) {
			setTimeout(() => {
				frm.trigger('check_schedule_availability');
			}, 500);
		}
	},

	reservation_date: function(frm) {
		// Reset availability check flag when date changes
		frm.availability_checked = false;
		frm.refresh();

		// Auto-check availability when date changes
		if (frm.doc.service_unit && frm.doc.reservation_date) {
			setTimeout(() => {
				frm.trigger('check_schedule_availability');
			}, 500);
		}
	},

	/**
	 * Check schedule availability and show available time slots
	 */
	check_schedule_availability: function(frm) {
		frappe.call({
			method: 'milkart_reservations.api.check_service_unit_availability',
			args: {
				service_unit: frm.doc.service_unit,
				date: frm.doc.reservation_date
			},
			callback: function(r) {
				if(r.message) {
					// Mark availability as checked after successful response
					frm.availability_checked = true;
					frm.trigger('refresh');
					show_schedule_availability_dialog(r.message, frm);
				}
			}
		});
	}
});

/**
 * Show availability dialog for Service Unit Reservation
 * @param {string} html_content - HTML content with available slots
 * @param {object} frm - Frappe form object
 */
function show_schedule_availability_dialog(html_content, frm) {
	let dialog = new frappe.ui.Dialog({
		title: __('Available Time Slots - Based on Service Unit Schedule'),
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

console.log('✅ Milkart Service Unit Reservation JS loaded');
