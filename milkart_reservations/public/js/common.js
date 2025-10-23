/**
 * Common utilities for Milkart Reservations
 * Shared functions used across multiple modules
 */

/**
 * Convert display time format (12-hour with AM/PM) to 24-hour format
 * @param {string} displayTime - Time in display format (e.g., "02:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "14:30:00")
 */
function convert_display_time_to_value(displayTime) {
	if (!displayTime) return '';

	try {
		let timeStr = displayTime.trim();

		// Already in 24-hour format
		if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
			return timeStr;
		}

		// HH:MM format without seconds
		if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
			return timeStr + ':00';
		}

		let period = '';

		// Extract AM/PM
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

		// Convert 12-hour to 24-hour format
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

/**
 * Show availability dialog with time slots
 * @param {string} html_content - HTML content to display in dialog
 * @param {object} frm - Frappe form object
 */
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

/**
 * Enhance dialog buttons with click handlers for time slot selection
 * @param {object} dialog - Frappe dialog object
 * @param {object} frm - Frappe form object
 */
function enhance_dialog_with_selection(dialog, frm) {
	const dialog_body = dialog.body;

	// Find time slot buttons
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

				dialog.hide();
			}
		});
	});
}

console.log('✅ Milkart Common JS utilities loaded');
