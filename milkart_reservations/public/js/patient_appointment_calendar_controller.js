// /home/cyberv/temp-bench/apps/milkart_reservations/milkart_reservations/public/js/patient_appointment_calendar_controller.js
frappe.provide('milkart_reservations');

milkart_reservations.PatientAppointmentCalendar = {
	init: function(wrapper) {
		this.wrapper = wrapper;
		this.$calendar = $(wrapper).find('#calendar');
		this.currentDate = moment();
		this.render_calendar();
	},

	render_calendar: function() {
		const me = this;

		// Destroy if already exists
		if (this.calendar) {
			this.calendar.destroy();
		}

		this.calendar = new frappe.Calendar({
			wrapper: this.$calendar,
			field_map: {
				"id": "name",
				"start": "start",
				"end": "end",
				"title": "title",
				"allDay": "allDay",
				"status": "status"
			},
			options: {
				editable: true, // Enables drag & drop and resize
				eventDrop: function(info) {
					me.handle_event_drop_or_resize(info);
				},
				eventResize: function(info) {
					me.handle_event_drop_or_resize(info);
				}
			},
			method: 'healthcare.healthcare.doctype.patient_appointment.patient_appointment.get_events'
		});

		this.calendar.refresh();
	},

	/**
	 * Unified handler for drop and resize.
	 * - For Practitioner appointments: keep original confirm+reschedule flow.
	 * - For Service Unit appointments: show custom availability dialog for the target date,
	 *   then reschedule to selected slot.
	 */
	handle_event_drop_or_resize: function(info) {
		const event = info.event;
		// Robustly find the appointment name/id
		const apptName = event.extendedProps?.name || event.id;

		// New date/time based on the drop target
		const new_date = moment(event.start).format('YYYY-MM-DD');
		const new_time_from_drag = moment(event.start).format('HH:mm:ss');
		const new_display = moment(event.start).format('DD MMM YYYY [at] HH:mm');

		if (!apptName) {
			frappe.msgprint(__('Could not determine appointment ID.'));
			info.revert();
			return;
		}

		// Load the full appointment to branch by appointment_for
		frappe.call({
			method: 'frappe.client.get',
			args: {
				doctype: 'Patient Appointment',
				name: apptName
			},
			callback: (r) => {
				const appt = r.message;
				if (!appt) {
					frappe.msgprint(__('Appointment not found.'));
					info.revert();
					return;
				}

				// If dropped on same date (no-op), just confirm nothing to do
				if (appt.appointment_date === new_date) {
					// For practitioner we might still want to change time on same date,
					// but for service unit we’ll use the dialog anyway.
					// We'll handle both cases below.
				}

				if (appt.appointment_for === 'Service Unit') {
					// SERVICE UNIT: Show custom availability dialog for the target date.
					milkart_reservations._show_service_unit_reschedule_dialog(appt, new_date, info);
				} else {
					// PRACTITIONER: Keep the original confirm+reschedule flow (use dragged time).
					frappe.confirm(
						__(`Reschedule appointment to ${new_display}?`),
						() => {
							frappe.call({
								method: 'milkart_reservations.overrides.patient_appointment.reschedule_via_calendar',
								args: {
									docname: appt.name,
									new_date: new_date,
									new_time: new_time_from_drag
								},
								callback: (resp) => {
									if (resp.message && resp.message.success) {
										frappe.show_alert({ message: __('Rescheduled successfully'), indicator: 'green' });
										// Keep the event as-is (no revert)
									} else {
										frappe.msgprint(__('Reschedule failed'));
										info.revert();
									}
								},
								error: () => {
									info.revert();
								}
							});
						},
						() => {
							info.revert(); // User cancelled
						}
					);
				}
			},
			error: () => {
				frappe.msgprint(__('Error loading appointment'));
				info.revert();
			}
		});
	}
};

/* ========================================================================
   Helpers for Service Unit reschedule flow (local to this controller file)
   ======================================================================== */

(function () {
	/**
	 * Fetch available slots for a Service Unit on a target date and show a dialog
	 * allowing the user to pick a time. Then call the same server method used by
	 * the practitioner flow to reschedule.
	 */
	milkart_reservations._show_service_unit_reschedule_dialog = function(appt, targetDate, info) {
		if (!appt.service_unit) {
			frappe.msgprint(__('This appointment has no Service Unit set.'));
			info.revert();
			return;
		}

		// Load available slots via your custom API
		frappe.call({
			method: 'milkart_reservations.api.service_unit_appointment.check_service_unit_availability',
			args: {
				service_unit: appt.service_unit,
				date: targetDate
			},
			callback: function(r) {
				if (!r.message) {
					frappe.msgprint(__('No available time slots found for the selected date'));
					info.revert();
					return;
				}
				// Show dialog with slot selection
				const html_content = r.message; // server returns ready HTML with buttons/slots
				_show_availability_dialog_for_reschedule(html_content, appt, targetDate, info);
			},
			error: function() {
				frappe.msgprint(__('Failed to load availability.'));
				info.revert();
			}
		});
	};

	/**
	 * Render an availability dialog with the given HTML, detect time clicks,
	 * and reschedule to the chosen slot.
	 */
	function _show_availability_dialog_for_reschedule(html_content, appt, targetDate, info) {
		let selectedTimeValue = null;

		let d = new frappe.ui.Dialog({
			title: __('Reschedule Service Unit Appointment - Available Slots'),
			fields: [
				{ fieldname: 'html_content', fieldtype: 'HTML', options: html_content }
			],
			primary_action_label: __('Reschedule'),
			primary_action: function() {
				if (!selectedTimeValue) {
					frappe.msgprint(__('Please select a time slot.'));
					return;
				}
				// Call the same server method the practitioner flow uses
				frappe.call({
					method: 'milkart_reservations.overrides.patient_appointment.reschedule_via_calendar',
					args: {
						docname: appt.name,
						new_date: targetDate,
						new_time: selectedTimeValue
					},
					callback: (resp) => {
						if (resp.message && resp.message.success) {
							frappe.show_alert({ message: __('Appointment rescheduled successfully'), indicator: 'green' });
							d.hide();
							// Keep the event as-is (we already dropped it on the new date)
						} else {
							frappe.msgprint(__('Reschedule failed'));
							// Revert the event position since the server failed
							info.revert();
							d.hide();
						}
					},
					error: () => {
						info.revert();
						d.hide();
					}
				});
			},
			secondary_action_label: __('Cancel'),
			secondary_action: function() {
				// User cancelled -> revert the drag
				info.revert();
				d.hide();
			}
		});

		d.show();

		// Enhance buttons in the returned HTML so clicking a time selects it
		setTimeout(() => {
			_enhance_slot_buttons(d, {
				onSelect(displayText, timeValue) {
					selectedTimeValue = timeValue;
				},
				enablePrimary: true
			});
		}, 200);
	}

	/**
	 * Makes any time-looking buttons inside the dialog selectable and enables the primary button.
	 */
	function _enhance_slot_buttons(dialog, opts = {}) {
		const body = dialog.body;
		let buttons = Array.from(body.querySelectorAll('button')).filter(btn => {
			const t = (btn.textContent || '').trim();
			return t && (t.includes('AM') || t.includes('PM') || t.match(/\d{1,2}:\d{2}([ ]?[AP]M)?/i));
		});

		if (buttons.length === 0) {
			buttons = Array.from(body.querySelectorAll('.btn, .slot-available, [data-time]'));
		}

		buttons.forEach(btn => {
			const txt = (btn.getAttribute('data-time') || btn.textContent || '').trim();
			const val = _to_24h_time_value(txt);

			btn.setAttribute('data-time-value', val);
			btn.removeAttribute('onclick');
			btn.onclick = null;
			btn.style.cursor = 'pointer';
			btn.classList.add('btn-primary');

			btn.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();

				buttons.forEach(b => b.classList.remove('active'));
				this.classList.add('active');

				const display = (this.getAttribute('data-time') || this.textContent || '').trim();
				const value = this.getAttribute('data-time-value');

				frappe.show_alert({ message: __(`Selected: ${display}`), indicator: 'green' });

				if (typeof opts.onSelect === 'function') {
					opts.onSelect(display, value);
				}
				if (opts.enablePrimary) {
					dialog.get_primary_btn().attr('disabled', false);
				}
			});
		});

		if (opts.enablePrimary) {
			dialog.get_primary_btn().attr('disabled', true);
		}
	}

	/**
	 * Convert a display time (e.g., "2:30 PM", "14:45") into "HH:mm:00".
	 */
	function _to_24h_time_value(displayTime) {
		if (!displayTime) return '';
		try {
			let t = displayTime.trim();

			if (/^\d{1,2}:\d{2}:\d{2}$/.test(t)) return t;
			if (/^\d{1,2}:\d{2}$/.test(t)) return t + ':00';

			let period = '';
			if (t.toUpperCase().includes('AM')) {
				period = 'AM';
				t = t.replace(/AM/gi, '').trim();
			} else if (t.toUpperCase().includes('PM')) {
				period = 'PM';
				t = t.replace(/PM/gi, '').trim();
			}

			const parts = t.split(':');
			let h = parseInt(parts[0] || '0', 10);
			let m = (parts[1] || '00').padStart(2, '0');

			if (period === 'PM' && h < 12) h += 12;
			else if (period === 'AM' && h === 12) h = 0;

			return `${h.toString().padStart(2, '0')}:${m}:00`;
		} catch (e) {
			console.error('Time parse error:', e, displayTime);
			return displayTime;
		}
	}
})();
