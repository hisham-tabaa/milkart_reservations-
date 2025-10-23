/**
 * Patient Appointment Form Controller
 * Handles service unit availability, time slot validation, and booking logic
 */

frappe.ui.form.on('Patient Appointment', {
	refresh: function(frm) {
		frm.trigger('setup_service_unit_availability');
		frm.trigger('toggle_book_button');
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
		// Validate ONLY the selected time slot when time is selected
		if (frm.doc.service_unit && frm.doc.appointment_date && frm.doc.appointment_time) {
			frm.trigger('validate_selected_time_slot');
		}
		frm.trigger('setup_service_unit_availability');
		frm.trigger('toggle_book_button');
	},

	/**
	 * Toggle visibility of the primary "Book" button based on form readiness
	 */
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

	/**
	 * Setup availability checking button and UI
	 */
	setup_service_unit_availability: function(frm) {
		// Remove existing buttons
		frm.remove_custom_button(__('Check Available Slots'));

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

	/**
	 * Check available time slots for selected service unit and date
	 */
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
			method: 'milkart_reservations.api.check_service_unit_availability',
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

	/**
	 * Validate the currently selected time slot
	 */
	validate_selected_time_slot: function(frm) {
		if (!frm.doc.service_unit || !frm.doc.appointment_date || !frm.doc.appointment_time) {
			return;
		}

		frappe.call({
			method: 'milkart_reservations.api.validate_service_unit_availability_strict',
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

					// FORCE CLEAR the appointment time to prevent invalid booking
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

	/**
	 * Final validation before saving appointment
	 */
	before_save: function(frm) {
		if (frm.doc.service_unit && frm.doc.appointment_date && frm.doc.appointment_time) {
			return new Promise((resolve) => {
				frappe.call({
					method: 'milkart_reservations.api.validate_service_unit_availability_strict',
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

console.log('✅ Milkart Patient Appointment JS loaded');
