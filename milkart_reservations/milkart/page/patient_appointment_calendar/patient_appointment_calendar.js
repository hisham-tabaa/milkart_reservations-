frappe.pages['patient-appointment-calendar'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Patient Appointment Calendar',
		single_column: true
	});

	$(wrapper).find('.page-content').html(`
		<div class="patient-appointment-calendar-container">
			<div class="calendar-controls">
				<!-- Your existing controls -->
			</div>
			<div id="calendar"></div>
		</div>
	`);

	// Initialize FullCalendar with drag-drop
	milkart_reservations.PatientAppointmentCalendar.init(wrapper);
};
