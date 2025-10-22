frappe.provide('milkart_reservations');

milkart_reservations.PatientAppointmentCalendar = {
	init: function(wrapper) {
		this.wrapper = wrapper;
		this.$calendar = $(wrapper).find('#calendar');
		this.currentDate = moment();
		this.bind_events();
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
				editable: true,           // ← Enables drag & drop
				eventDrop: function(info) {
					me.handle_event_drop(info);
				},
				eventResize: function(info) {
					me.handle_event_drop(info);
				}
			},
			method: 'healthcare.healthcare.doctype.patient_appointment.patient_appointment.get_events'
		});

		this.calendar.refresh();
	},

	bind_events: function() {
		const me = this;

		// View switching
		this.$container.on('click', '.view-btn', function() {
			me.currentView = $(this).data('view');
			me.$container.find('.view-btn').removeClass('active');
			$(this).addClass('active');
			me.render_view();
		});

		// Navigation
		this.$container.on('click', '#prev-btn', () => {
			me.navigate('prev');
		});
		this.$container.on('click', '#next-btn', () => {
			me.navigate('next');
		});
		this.$container.on('click', '#today-btn', () => {
			me.currentDate = moment();
			me.render_view();
		});

		// Filters
		this.$container.on('change', '#practitioner-filter, #department-filter, #start-date, #end-date', () => {
			me.update_filters();
			me.render_view();
		});
	},

	navigate: function(direction) {
		if (this.currentView === 'month') {
			this.currentDate.add(direction === 'next' ? 1 : -1, 'month');
		} else if (this.currentView === 'week') {
			this.currentDate.add(direction === 'next' ? 1 : -1, 'week');
		} else if (this.currentView === 'day') {
			this.currentDate.add(direction === 'next' ? 1 : -1, 'day');
		}
		this.render_view();
	},

	load_filters: function() {
		// Load practitioners
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Healthcare Practitioner',
				fields: ['name', 'practitioner_name'],
				limit_page_length: 999
			},
			callback: (r) => {
				const $select = this.$container.find('#practitioner-filter');
				r.message.forEach(p => {
					$select.append(`<option value="${p.name}">${p.practitioner_name}</option>`);
				});
			}
		});

		// Load departments
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Medical Department',
				fields: ['name'],
				limit_page_length: 999
			},
			callback: (r) => {
				const $select = this.$container.find('#department-filter');
				r.message.forEach(d => {
					$select.append(`<option value="${d.name}">${d.name}</option>`);
				});
			}
		});

		// Set date defaults
		this.$container.find('#start-date').val(frappe.datetime.now_date());
		this.$container.find('#end-date').val(frappe.datetime.add_days(frappe.datetime.now_date(), 30));
	},

	update_filters: function() {
		this.filters = {
			practitioner: this.$container.find('#practitioner-filter').val(),
			department: this.$container.find('#department-filter').val(),
			start: this.$container.find('#start-date').val(),
			end: this.$container.find('#end-date').val()
		};
	},

	render_view: function() {
		this.$container.find('.calendar-view').removeClass('active');
		this.$container.find(`#${this.currentView}-view`).addClass('active');
		this.$container.find('#current-period').text(this.get_period_text());

		if (this.currentView === 'month') {
			this.render_month_view();
		} else if (this.currentView === 'week') {
			this.render_week_view();
		} else if (this.currentView === 'day') {
			this.render_day_view();
		} else if (this.currentView === 'list') {
			this.render_list_view();
		}
	},

	get_period_text: function() {
		if (this.currentView === 'month') {
			return this.currentDate.format('MMMM YYYY');
		} else if (this.currentView === 'week') {
			const start = this.currentDate.clone().startOf('week');
			const end = this.currentDate.clone().endOf('week');
			return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
		} else if (this.currentView === 'day') {
			return this.currentDate.format('dddd, MMMM D, YYYY');
		}
		return 'Appointments List';
	},

	render_month_view: function() {
		const $view = this.$container.find('#month-view');
		$view.empty();

		const startOfMonth = this.currentDate.clone().startOf('month').startOf('week');
		const endOfMonth = this.currentDate.clone().endOf('month').endOf('week');

		let html = `
			<div class="month-header">
				<div class="week-header">Wk</div>
				${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<div class="day-header">${day}</div>`).join('')}
			</div>
		`;

		let current = startOfMonth.clone();
		while (current.isSameOrBefore(endOfMonth)) {
			const weekStart = current.clone().startOf('week');
			html += `<div class="week-row">`;
			html += `<div class="week-number-cell">${weekStart.week()}</div>`;

			for (let i = 0; i < 7; i++) {
				const day = current.clone().add(i, 'days');
				const isCurrentMonth = day.isSame(this.currentDate, 'month');
				const isToday = day.isSame(moment(), 'day');
				const dayClass = [
					'month-day',
					!isCurrentMonth ? 'other-month' : '',
					isToday ? 'today' : ''
				].filter(Boolean).join(' ');

				html += `<div class="${dayClass}" data-date="${day.format('YYYY-MM-DD')}">
					<div class="day-number">${day.date()}</div>
					<div class="day-appointments" id="day-${day.format('YYYY-MM-DD')}">
						<!-- Appointments will be loaded here -->
					</div>
				</div>`;
			}
			html += `</div>`;
			current.add(1, 'week');
		}

		$view.html(html);
		this.load_appointments_for_view('month');
	},

	render_week_view: function() {
		const $view = this.$container.find('#week-view');
		$view.empty();

		const startOfWeek = this.currentDate.clone().startOf('week');
		const days = [];
		for (let i = 0; i < 7; i++) {
			days.push(startOfWeek.clone().add(i, 'days'));
		}

		let html = `<div class="week-header-info">
			<div class="week-range">${this.get_period_text()}</div>
		</div>
		<div class="week-grid">`;

		html += days.map(day => {
			const isToday = day.isSame(moment(), 'day');
			const dayClass = `week-day ${isToday ? 'today' : ''}`;
			return `<div class="${dayClass}" data-date="${day.format('YYYY-MM-DD')}">
				<div class="week-day-header">
					<div class="week-day-name">${day.format('ddd')}</div>
					<div class="week-day-date">${day.date()}</div>
				</div>
				<div class="week-day-appointments" id="week-day-${day.format('YYYY-MM-DD')}">
					<!-- Appointments -->
				</div>
			</div>`;
		}).join('');

		html += `</div>`;
		$view.html(html);
		this.load_appointments_for_view('week');
	},

	render_day_view: function() {
		const $view = this.$container.find('#day-view');
		$view.empty();

		const date = this.currentDate.format('YYYY-MM-DD');
		const dayName = this.currentDate.format('dddd, MMMM D, YYYY');

		let html = `<div class="day-header">
			<h3>${dayName}</h3>
			<div class="day-info">
				<div class="appointment-count" id="day-appointment-count">Loading...</div>
			</div>
		</div>
		<div id="day-appointments-container"></div>`;

		$view.html(html);
		this.load_appointments_for_view('day');
	},

	render_list_view: function() {
		const $view = this.$container.find('#list-view');
		$view.empty();
		$view.html('<h4>Appointments List (Coming Soon)</h4>');
		// You can implement full list view later
	},

	load_appointments_for_view: function(view) {
		const start = this.currentDate.clone().startOf(view).format('YYYY-MM-DD');
		const end = this.currentDate.clone().endOf(view).format('YYYY-MM-DD');

		frappe.call({
			method: 'healthcare.healthcare.doctype.patient_appointment.patient_appointment.get_events',
			args: {
				start: start,
				end: end
			},
			callback: (r) => {
				this.render_appointments(r.message || [], view);
			}
		});
	},

	render_appointments: function(appointments, view) {
		const statusClasses = {
			'Open': 'status-open',
			'Scheduled': 'status-scheduled',
			'Confirmed': 'status-confirmed',
			'Closed': 'status-closed',
			'Cancelled': 'status-cancelled',
			'No Show': 'status-no-show'
		};

		if (view === 'month') {
			// Group by date
			const grouped = {};
			appointments.forEach(appt => {
				const date = moment(appt.start).format('YYYY-MM-DD');
				if (!grouped[date]) grouped[date] = [];
				grouped[date].push(appt);
			});

			Object.keys(grouped).forEach(date => {
				const $container = this.$container.find(`#day-${date}`);
				if ($container.length) {
					$container.empty();
					grouped[date].forEach(appt => {
						const time = moment(appt.start).format('HH:mm');
						const statusClass = statusClasses[appt.status] || 'status-default';
						$container.append(`
							<div class="appointment-badge ${statusClass}" data-id="${appt.name}">
								<div class="appointment-time">${time}</div>
								<div class="appointment-patient">${appt.patient}</div>
							</div>
						`);
					});
				}
			});
		} else if (view === 'week') {
			const grouped = {};
			appointments.forEach(appt => {
				const date = moment(appt.start).format('YYYY-MM-DD');
				if (!grouped[date]) grouped[date] = [];
				grouped[date].push(appt);
			});

			Object.keys(grouped).forEach(date => {
				const $container = this.$container.find(`#week-day-${date}`);
				if ($container.length) {
					$container.empty();
					grouped[date].forEach(appt => {
						const time = moment(appt.start).format('HH:mm');
						const statusClass = statusClasses[appt.status] || 'status-default';
						$container.append(`
							<div class="week-appointment ${statusClass}" data-id="${appt.name}">
								<div class="appointment-time">${time}</div>
								<div class="appointment-patient">${appt.patient}</div>
								<div class="appointment-practitioner">${appt.practitioner || ''}</div>
							</div>
						`);
					});
				}
			});
		} else if (view === 'day') {
			const date = this.currentDate.format('YYYY-MM-DD');
			const dayAppointments = appointments.filter(appt =>
				moment(appt.start).format('YYYY-MM-DD') === date
			);

			const $count = this.$container.find('#day-appointment-count');
			const $container = this.$container.find('#day-appointments-container');

			if (dayAppointments.length === 0) {
				$count.text('No appointments');
				$container.html('<div class="no-appointments-day-view"><i class="fa fa-calendar"></i><h5>No Appointments</h5><p>No appointments scheduled for this day.</p></div>');
			} else {
				$count.text(`${dayAppointments.length} appointment${dayAppointments.length !== 1 ? 's' : ''}`);
				$container.empty();
				dayAppointments.forEach(appt => {
					const time = moment(appt.start).format('HH:mm');
					const duration = appt.duration || 15;
					const statusClass = statusClasses[appt.status] || 'status-default';
					$container.append(`
						<div class="day-appointment ${statusClass}" data-id="${appt.name}">
							<div class="appointment-time-slot">
								<div class="time-display">${time}</div>
								<div class="duration">${duration} min</div>
							</div>
							<div class="appointment-details">
								<div class="appointment-patient">${appt.patient}</div>
								<div class="appointment-meta">
									${appt.practitioner ? `<span>${appt.practitioner}</span>` : ''}
									${appt.department ? `<span> • ${appt.department}</span>` : ''}
								</div>
								<div class="appointment-status-badge appointment-status ${statusClass.split('-')[1]}">
									${appt.status}
								</div>
							</div>
						</div>
					`);
				});
			}
		}

		// Make appointments clickable
		this.$container.find('.appointment-badge, .week-appointment, .day-appointment').on('click', function() {
			const appointmentId = $(this).data('id');
			frappe.set_route('Form', 'Patient Appointment', appointmentId);
		});
	}
	
	
		handle_event_drop: function(info) {
		const event = info.event;
		const new_start = moment(event.start).format('YYYY-MM-DD HH:mm:ss');
		const new_date = moment(event.start).format('YYYY-MM-DD');
		const new_time = moment(event.start).format('HH:mm:ss');

		// Confirm reschedule
		frappe.confirm(
			`Reschedule appointment to ${moment(event.start).format('DD MMM YYYY [at] HH:mm')}?`,
			() => {
				// Call your custom reschedule method
				frappe.call({
					method: 'milkart_reservations.overrides.patient_appointment.InsightCorePatientAppointment.reschedule_via_calendar',
					args: {
						docname: event.extendedProps.name,
						new_date: new_date,
						new_time: new_time
					},
					callback: (r) => {
						if (r.message && r.message.success) {
							frappe.show_alert('Rescheduled successfully');
						} else {
							info.revert(); // Revert on failure
							frappe.msgprint('Reschedule failed');
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
};
