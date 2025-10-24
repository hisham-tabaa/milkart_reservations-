// /home/cyberv/temp-bench/apps/milkart_reservations/milkart_reservations/public/js/patient_appointment_calendar_enhanced.js
// Patient Appointment Calendar - Enhanced with Advanced Filtering + Conditional Drag-Drop Reschedule
console.log('Patient Appointment Calendar script loaded - waiting for page initialization');

let currentView = 'month';
let currentDate = frappe.datetime.get_today();
let allAppointments = [];
let filteredAppointments = [];

// Wait for the page to be defined before setting up the handler
function initializePage() {
    if (typeof frappe === 'undefined') {
        console.log('Frappe not available yet, retrying...');
        setTimeout(initializePage, 100);
        return;
    }

    if (!frappe.pages) {
        console.log('Frappe pages not available yet, retrying...');
        setTimeout(initializePage, 100);
        return;
    }

    console.log('Setting up page handler for patient-appointment-calendar');

    frappe.pages['patient-appointment-calendar'].on_page_load = function(wrapper) {
        console.log('Patient Appointment Calendar page loading...');

        try {
            // Create the page
            var page = frappe.ui.make_app_page({
                parent: wrapper,
                title: 'Patient Appointment Calendar',
                single_column: true
            });

            // Add main container
            $(wrapper).append(`
                <div class="patient-appointment-calendar-container">
                    <div class="page-header">
                        <h2><i class="fa fa-calendar"></i> Patient Appointment Calendar</h2>
                        <p>Manage and view all patient appointments</p>
                    </div>

                    <!-- Calendar Controls -->
                    <div class="calendar-controls">
                        <div class="view-controls">
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-default btn-sm active" data-view="month">
                                    <i class="fa fa-calendar"></i> Month
                                </button>
                                <button type="button" class="btn btn-default btn-sm" data-view="week">
                                    <i class="fa fa-calendar-week"></i> Week
                                </button>
                                <button type="button" class="btn btn-default btn-sm" data-view="day">
                                    <i class="fa fa-calendar-day"></i> Day
                                </button>
                                <button type="button" class="btn btn-default btn-sm" data-view="list">
                                    <i class="fa fa-list"></i> List
                                </button>
                            </div>

                            <div class="navigation-controls">
                                <button class="btn btn-default btn-sm" id="prev-period">
                                    <i class="fa fa-chevron-left"></i>
                                </button>
                                <button class="btn btn-default btn-sm" id="today-btn">
                                    Today
                                </button>
                                <button class="btn btn-default btn-sm" id="next-period">
                                    <i class="fa fa-chevron-right"></i>
                                </button>
                            </div>

                            <h4 id="current-period" style="display: inline-block; margin: 0 15px;"></h4>
                        </div>

                        <div class="filter-controls">
                            <button class="btn btn-primary btn-sm" id="refresh-appointments">
                                <i class="fa fa-refresh"></i> Refresh
                            </button>
                            <button class="btn btn-success btn-sm" id="add-appointment">
                                <i class="fa fa-plus"></i> New Appointment
                            </button>
                            <!-- Show Canceled Toggle -->
                            <div class="form-check" style="display: inline-block; margin-left: 10px;">
                                <input class="form-check-input" type="checkbox" id="show-canceled">
                                <label class="form-check-label" for="show-canceled">Show Canceled</label>
                            </div>
                            <!-- Quick Filters -->
                            <div class="quick-filters">
                                <select class="form-control" id="status-filter">
                                    <option value="">All Status</option>
                                </select>

                                <select class="form-control" id="practitioner-filter">
                                    <option value="">All Practitioners</option>
                                </select>

                                <select class="form-control" id="department-filter">
                                    <option value="">All Departments</option>
                                </select>

                                <select class="form-control" id="appointment-type-filter">
                                    <option value="">All Appointment Types</option>
                                </select>
                            </div>

                            <!-- Advanced Filters Toggle -->
                            <button class="btn btn-default btn-sm" id="toggle-advanced-filters">
                                <i class="fa fa-filter"></i> Advanced Filters
                            </button>
                        </div>

                        <!-- Advanced Filters Panel -->
                        <div class="advanced-filters-panel" id="advanced-filters-panel" style="display: none; margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                            <div class="row">
                                <div class="col-sm-3">
                                    <label>Patient</label>
                                    <select class="form-control" id="patient-filter">
                                        <option value="">All Patients</option>
                                    </select>
                                </div>
                                <div class="col-sm-3">
                                    <label>Service Unit</label>
                                    <select class="form-control" id="service-unit-filter">
                                        <option value="">All Service Units</option>
                                    </select>
                                </div>
                                <div class="col-sm-3">
                                    <label>Company</label>
                                    <select class="form-control" id="company-filter">
                                        <option value="">All Companies</option>
                                    </select>
                                </div>
                                <div class="col-sm-3">
                                    <label>Appointment For</label>
                                    <select class="form-control" id="appointment-for-filter">
                                        <option value="">All</option>
                                        <option value="Practitioner">Practitioner</option>
                                        <option value="Service Unit">Service Unit</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row" style="margin-top: 10px;">
                                <div class="col-sm-3">
                                    <label>Gender</label>
                                    <select class="form-control" id="gender-filter">
                                        <option value="">All Genders</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="col-sm-3">
                                    <label>Duration</label>
                                    <select class="form-control" id="duration-filter">
                                        <option value="">Any Duration</option>
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="45">45 minutes</option>
                                        <option value="60">60 minutes</option>
                                    </select>
                                </div>
                                <div class="col-sm-3">
                                    <label>Video Conferencing</label>
                                    <select class="form-control" id="video-conferencing-filter">
                                        <option value="">All</option>
                                        <option value="1">With Video</option>
                                        <option value="0">Without Video</option>
                                    </select>
                                </div>
                                <div class="col-sm-3">
                                    <label>Invoiced</label>
                                    <select class="form-control" id="invoiced-filter">
                                        <option value="">All</option>
                                        <option value="1">Invoiced</option>
                                        <option value="0">Not Invoiced</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row" style="margin-top: 10px;">
                                <div class="col-sm-6">
                                    <label>Date Range</label>
                                    <div class="date-range-inputs">
                                        <input type="date" class="form-control" id="start-date" style="display: inline-block; width: 48%;">
                                        <span style="margin: 0 2%;">to</span>
                                        <input type="date" class="form-control" id="end-date" style="display: inline-block; width: 48%;">
                                    </div>
                                </div>
                                <div class="col-sm-3">
                                    <label>Time Range</label>
                                    <select class="form-control" id="time-range-filter">
                                        <option value="">Any Time</option>
                                        <option value="morning">Morning (6AM-12PM)</option>
                                        <option value="afternoon">Afternoon (12PM-6PM)</option>
                                        <option value="evening">Evening (6PM-12AM)</option>
                                    </select>
                                </div>
                                <div class="col-sm-3" style="display: flex; align-items: flex-end;">
                                    <button class="btn btn-primary btn-sm" id="apply-filters" style="margin-right: 5px;">
                                        Apply Filters
                                    </button>
                                    <button class="btn btn-default btn-sm" id="clear-filters">
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="date-range-filter" id="date-range-section" style="display: none; margin-top: 10px;">
                            <input type="date" class="form-control" id="list-start-date" style="display: inline-block; width: 140px;">
                            <span style="margin: 0 5px;">to</span>
                            <input type="date" class="form-control" id="list-end-date" style="display: inline-block; width: 140px;">
                            <button class="btn btn-default btn-sm" id="apply-date-range">
                                Apply
                            </button>
                        </div>
                    </div>

                    <!-- Filter Summary -->
                    <div class="filter-summary" id="filter-summary" style="display: none; margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px; font-size: 0.9em;">
                        <strong>Active Filters:</strong> <span id="active-filters-text"></span>
                        <span class="badge badge-primary" id="appointment-count">0 appointments</span>
                    </div>

                    <!-- Calendar Views Container -->
                    <div class="calendar-views-container">
                        <!-- Month View -->
                        <div id="month-view" class="calendar-view">
                            <div class="month-calendar" id="month-calendar"></div>
                        </div>

                        <!-- Week View -->
                        <div id="week-view" class="calendar-view" style="display: none;">
                            <div class="week-calendar" id="week-calendar"></div>
                        </div>

                        <!-- Day View -->
                        <div id="day-view" class="calendar-view" style="display: none;">
                            <div class="day-calendar" id="day-calendar"></div>
                        </div>

                        <!-- List View -->
                        <div id="list-view" class="calendar-view" style="display: none;">
                            <div class="list-view-section">
                                <div class="alert alert-info" id="loading-message">
                                    <i class="fa fa-spinner fa-spin"></i> Loading appointments...
                                </div>
                                <div id="appointments-container" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            // Initialize functionality
            setupEventHandlers();
            initializeCalendar();
            loadAppointments();
            loadFilterOptions();

            console.log('Patient Appointment Calendar page loaded successfully');

        } catch (error) {
            console.error('Error loading Patient Appointment Calendar:', error);
            showError(wrapper, error);
        }
    };
}

/* -------------------------
   UI / Event Handlers
--------------------------*/
function setupEventHandlers() {
    // View controls
    $('#show-canceled').off('change').on('change', function() {
        applyFilters();
    });
    $('[data-view]').off('click').on('click', function() {
        var view = $(this).data('view');
        switchView(view);
    });

    // Navigation controls
    $('#prev-period').off('click').on('click', function() {
        navigatePeriod(-1);
    });
    $('#next-period').off('click').on('click', function() {
        navigatePeriod(1);
    });
    $('#today-btn').off('click').on('click', function() {
        currentDate = frappe.datetime.get_today();
        allAppointments = [];
        filteredAppointments = [];
        refreshCurrentView();
    });

    // Filter controls
    $('#refresh-appointments').off('click').on('click', function() {
        loadAppointments();
    });
    $('#add-appointment').off('click').on('click', function() {
        frappe.new_doc('Patient Appointment');
    });
    $('#status-filter, #practitioner-filter, #department-filter, #appointment-type-filter').off('change').on('change', function() {
        applyFilters();
    });

    // Advanced filters
    $('#toggle-advanced-filters').off('click').on('click', function() {
        $('#advanced-filters-panel').slideToggle();
        $(this).toggleClass('active');
    });
    $('#apply-filters').off('click').on('click', function() {
        applyFilters();
    });
    $('#clear-filters').off('click').on('click', function() {
        clearAllFilters();
    });
    $('#apply-date-range').off('click').on('click', function() {
        applyFilters();
    });

    // Set initial active view
    setTimeout(function() {
        $('[data-view="month"]').addClass('active');
        $('#month-view').show().addClass('active');
    }, 100);

    /* ---------------------------------------------------
       Drag & Drop: conditional behavior by appointment_for
       - Service Unit  -> show custom availability dialog
       - Practitioner  -> original confirm + reschedule
    ----------------------------------------------------*/

    // Make appointment cards draggable
    $(document).on('dragstart', '.appointment-badge, .week-appointment', function(e) {
        var apptName = $(this).data('name');
        e.originalEvent.dataTransfer.setData('text/plain', apptName);
        $(this).addClass('dragging');
    });
    $(document).on('dragend', '.appointment-badge, .week-appointment', function() {
        $(this).removeClass('dragging');
    });

    // Make day cells droppable
    $(document).on('dragover', '.month-day, .week-day', function(e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    $(document).on('drop', '.month-day, .week-day', function(e) {
        e.preventDefault();
        const apptName = e.originalEvent.dataTransfer.getData('text/plain');
        if (!apptName) return;

        // Target date from cell (we always set data-date on cells)
        const targetDate = $(this).data('date');
        if (!targetDate) {
            frappe.msgprint(__('Could not determine target date.'));
            return;
        }

        // Fetch the appointment doc to branch by appointment_for
        frappe.call({
            method: 'frappe.client.get',
            args: { doctype: 'Patient Appointment', name: apptName },
            callback: function(r) {
                if (!r.message) return;
                const appt = r.message;

                // No-op if same date
                if (appt.appointment_date === targetDate) {
                    frappe.msgprint(__('Same date selected.'));
                    return;
                }

                // Branch by appointment_for
                if (appt.appointment_for === 'Service Unit') {
                    // Show custom availability dialog for new date, then reschedule to picked slot
                    showServiceUnitRescheduleDialog(appt, targetDate);
                } else {
                    // Keep original reschedule behavior
                    const new_start_display = moment(targetDate + ' ' + (appt.appointment_time || '00:00:00')).format('DD MMM YYYY [at] HH:mm');
                    frappe.confirm(
                        __(`Reschedule appointment to ${new_start_display}?`),
                        () => {
                            const new_time = (appt.appointment_time || '00:00:00');
                            frappe.call({
                                method: 'milkart_reservations.overrides.patient_appointment.reschedule_via_calendar',
                                args: {
                                    docname: appt.name,
                                    new_date: targetDate,
                                    new_time: new_time
                                },
                                callback: (r) => {
                                    if (r.message && r.message.success) {
                                        frappe.show_alert({ message: __('Rescheduled successfully'), indicator: 'green' });
                                        refreshCurrentView();
                                    } else {
                                        frappe.msgprint(__('Reschedule failed'));
                                        refreshCurrentView();
                                    }
                                },
                                error: () => {
                                    refreshCurrentView();
                                }
                            });
                        },
                        () => {
                            // cancel -> nothing (DOM stays as is until refresh)
                        }
                    );
                }
            }
        });
    });
}

/* -------------------------
   Filter Option Loaders
--------------------------*/
function loadFilterOptions() {
    // Status
    var statusOptions = ['Open', 'Scheduled', 'Confirmed', 'Closed', 'Cancelled', 'No Show'];
    var statusFilter = $('#status-filter');
    statusOptions.forEach(function(status) {
        statusFilter.append('<option value="' + status + '">' + status + '</option>');
    });

    loadPractitioners();
    loadDepartments();
    loadAppointmentTypes();
    loadPatients();
    loadServiceUnits();
    loadCompanies();
}

function loadPractitioners() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Healthcare Practitioner',
            fields: ['name', 'first_name', 'last_name'],
            limit: 100
        },
        callback: function(response) {
            if (response.message) {
                var practitionerFilter = $('#practitioner-filter');
                response.message.forEach(function(practitioner) {
                    var displayName = (practitioner.first_name || practitioner.last_name) ?
                        `${practitioner.first_name || ''} ${practitioner.last_name || ''}`.trim() :
                        practitioner.name;
                    practitionerFilter.append('<option value="' + practitioner.name + '">' + displayName + '</option>');
                });
            }
        }
    });
}

function loadDepartments() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Medical Department',
            fields: ['name', 'department'],
            limit: 100
        },
        callback: function(response) {
            if (response.message) {
                var departmentFilter = $('#department-filter');
                response.message.forEach(function(dept) {
                    departmentFilter.append('<option value="' + dept.name + '">' + (dept.department || dept.name) + '</option>');
                });
            }
        }
    });
}

function loadAppointmentTypes() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Patient Appointment',
            fields: ['appointment_type'],
            filters: [['appointment_type', '!=', '']],
            distinct: true,
            limit: 50
        },
        callback: function(response) {
            if (response.message) {
                var typeFilter = $('#appointment-type-filter');
                response.message.forEach(function(appt) {
                    if (appt.appointment_type) {
                        typeFilter.append('<option value="' + appt.appointment_type + '">' + appt.appointment_type + '</option>');
                    }
                });
            }
        }
    });
}

function loadPatients() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Patient',
            fields: ['name', 'patient_name'],
            limit: 100
        },
        callback: function(response) {
            if (response.message) {
                var patientFilter = $('#patient-filter');
                response.message.forEach(function(patient) {
                    patientFilter.append('<option value="' + patient.name + '">' + (patient.patient_name || patient.name) + '</option>');
                });
            }
        }
    });
}

function loadServiceUnits() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Healthcare Service Unit',
            fields: ['name', 'healthcare_service_unit_name'],
            limit: 100
        },
        callback: function(response) {
            if (response.message) {
                var serviceUnitFilter = $('#service-unit-filter');
                response.message.forEach(function(unit) {
                    serviceUnitFilter.append('<option value="' + unit.name + '">' + (unit.healthcare_service_unit_name || unit.name) + '</option>');
                });
            }
        },
        error: function() {
            loadServiceUnitsAlternative();
        }
    });
}

function loadServiceUnitsAlternative() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: { doctype: 'Healthcare Service Unit', fields: ['name'], limit: 100 },
        callback: function(response) {
            if (response.message) {
                var serviceUnitFilter = $('#service-unit-filter');
                response.message.forEach(function(unit) {
                    serviceUnitFilter.append('<option value="' + unit.name + '">' + unit.name + '</option>');
                });
            }
        },
        error: function() {
            $('#service-unit-filter').closest('.col-sm-3').hide();
        }
    });
}

function loadCompanies() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: { doctype: 'Company', fields: ['name'], limit: 20 },
        callback: function(response) {
            if (response.message) {
                var companyFilter = $('#company-filter');
                response.message.forEach(function(company) {
                    companyFilter.append('<option value="' + company.name + '">' + company.name + '</option>');
                });
            }
        }
    });
}

/* -------------------------
   Filtering
--------------------------*/
function applyFilters() {
    if (allAppointments.length === 0) return;

    var filters = getCurrentFilters();
    var dateRange = getDateRange();

    var dateFilteredAppointments = allAppointments.filter(function(appt) {
        return appt.appointment_date >= dateRange.start && appt.appointment_date <= dateRange.end;
    });

    filteredAppointments = dateFilteredAppointments.filter(function(appt) {
        return matchesAllFilters(appt, filters);
    });

    updateFilterSummary(filters);
    displayAppointmentsForCurrentView(filteredAppointments);
}

function getCurrentFilters() {
    var dateRange = getDateRange();

    return {
        status: $('#status-filter').val(),
        practitioner: $('#practitioner-filter').val(),
        department: $('#department-filter').val(),
        appointmentType: $('#appointment-type-filter').val(),
        patient: $('#patient-filter').val(),
        serviceUnit: $('#service-unit-filter').val(),
        company: $('#company-filter').val(),
        appointmentFor: $('#appointment-for-filter').val(),
        gender: $('#gender-filter').val(),
        duration: $('#duration-filter').val(),
        videoConferencing: $('#video-conferencing-filter').val(),
        invoiced: $('#invoiced-filter').val(),
        timeRange: $('#time-range-filter').val(),
        startDate: dateRange.start,
        endDate: dateRange.end
    };
}

function matchesAllFilters(appointment, filters) {
    if (appointment.status === 'Cancelled' && !$('#show-canceled').is(':checked')) return false;
    if (filters.status && appointment.status !== filters.status) return false;
    if (filters.practitioner && appointment.practitioner !== filters.practitioner) return false;
    if (filters.department && appointment.department !== filters.department) return false;
    if (filters.appointmentType && appointment.appointment_type !== filters.appointmentType) return false;
    if (filters.patient && appointment.patient !== filters.patient) return false;
    if (filters.serviceUnit && appointment.service_unit !== filters.serviceUnit) return false;
    if (filters.company && appointment.company !== filters.company) return false;
    if (filters.appointmentFor && appointment.appointment_for !== filters.appointmentFor) return false;
    if (filters.gender && appointment.patient_sex !== filters.gender) return false;
    if (filters.duration && parseInt(appointment.duration) !== parseInt(filters.duration)) return false;

    if (filters.videoConferencing !== '') {
        var hasVideo = appointment.add_video_conferencing ? '1' : '0';
        if (hasVideo !== filters.videoConferencing) return false;
    }
    if (filters.invoiced !== '') {
        var isInvoiced = appointment.invoiced ? '1' : '0';
        if (isInvoiced !== filters.invoiced) return false;
    }
    if (filters.timeRange && appointment.appointment_time) {
        var hour = parseInt((appointment.appointment_time || '00:00').split(':')[0]);
        if (filters.timeRange === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (filters.timeRange === 'afternoon' && (hour < 12 || hour >= 18)) return false;
        if (filters.timeRange === 'evening' && (hour < 18 || hour >= 24)) return false;
    }
    return true;
}

function updateFilterSummary(filters) {
    var activeFilters = [];
    if (filters.status) activeFilters.push('Status: ' + filters.status);
    if (filters.practitioner) activeFilters.push('Practitioner: ' + $('#practitioner-filter option:selected').text());
    if (filters.department) activeFilters.push('Department: ' + $('#department-filter option:selected').text());
    if (filters.appointmentType) activeFilters.push('Type: ' + filters.appointmentType);
    if (filters.patient) activeFilters.push('Patient: ' + $('#patient-filter option:selected').text());
    if (filters.serviceUnit) activeFilters.push('Service Unit: ' + $('#service-unit-filter option:selected').text());
    if (filters.company) activeFilters.push('Company: ' + filters.company);
    if (filters.gender) activeFilters.push('Gender: ' + filters.gender);
    if (filters.duration) activeFilters.push('Duration: ' + filters.duration + 'min');
    if (filters.videoConferencing === '1') activeFilters.push('With Video Conferencing');
    if (filters.videoConferencing === '0') activeFilters.push('Without Video Conferencing');
    if (filters.invoiced === '1') activeFilters.push('Invoiced');
    if (filters.invoiced === '0') activeFilters.push('Not Invoiced');
    if (filters.timeRange) activeFilters.push('Time: ' + filters.timeRange);

    if (activeFilters.length > 0) {
        $('#active-filters-text').text(activeFilters.join(', '));
        $('#appointment-count').text(filteredAppointments.length + ' appointments');
        $('#filter-summary').show();
    } else {
        $('#filter-summary').hide();
    }
}

function clearAllFilters() {
    $('.form-control').val('');
    initializeCalendar();
    applyFilters();
}

/* -------------------------
   View Switching / Dates
--------------------------*/
function switchView(view) {
    currentView = view;
    $('[data-view]').removeClass('active');
    $('[data-view="' + view + '"]').addClass('active');
    $('.calendar-view').hide().removeClass('active');
    $('#' + view + '-view').show().addClass('active');
    if (view === 'list') $('#date-range-section').show(); else $('#date-range-section').hide();
    updatePeriodDisplay();
    refreshCurrentView();
}

function navigatePeriod(direction) {
    var momentDate = moment(currentDate);
    switch(currentView) {
        case 'month':
            currentDate = momentDate.add(direction, 'months').startOf('month').format('YYYY-MM-DD');
            break;
        case 'week':
            currentDate = momentDate.add(direction, 'weeks').format('YYYY-MM-DD');
            break;
        case 'day':
            currentDate = momentDate.add(direction, 'days').format('YYYY-MM-DD');
            break;
        case 'list':
            var startDate = moment($('#list-start-date').val());
            var endDate = moment($('#list-end-date').val());
            var rangeDays = endDate.diff(startDate, 'days');
            startDate.add(direction * (rangeDays + 1), 'days');
            endDate.add(direction * (rangeDays + 1), 'days');
            $('#list-start-date').val(startDate.format('YYYY-MM-DD'));
            $('#list-end-date').val(endDate.format('YYYY-MM-DD'));
            break;
    }
    refreshCurrentView();
}

function refreshCurrentView() {
    $('#loading-message').show();
    $('.calendar-view:visible .calendar-content').hide();
    $('#appointments-container').hide();

    updatePeriodDisplay();
    allAppointments = [];
    filteredAppointments = [];

    var dateRange = getDateRange();

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Patient Appointment',
            fields: [
                'name', 'patient', 'patient_name', 'practitioner', 'practitioner_name',
                'appointment_date', 'appointment_time', 'department', 'status',
                'appointment_type', 'docstatus', 'service_unit', 'company',
                'appointment_for', 'patient_sex', 'duration', 'add_video_conferencing',
                'invoiced', 'paid_amount', 'mode_of_payment', 'referring_practitioner',
                'position_in_queue'
            ],
            filters: [
                ['appointment_date', '>=', dateRange.start],
                ['appointment_date', '<=', dateRange.end]
            ],
            order_by: 'appointment_date, appointment_time asc',
            limit: 1000
        },
        callback: function(response) {
            $('#loading-message').hide();
            if (response.message && response.message.length > 0) {
                allAppointments = response.message;
                var filters = getCurrentFilters();
                filteredAppointments = allAppointments.filter(function(appt) {
                    return matchesAllFilters(appt, filters);
                });
            } else {
                allAppointments = [];
                filteredAppointments = [];
            }
            displayAppointmentsForCurrentView(filteredAppointments);
        },
        error: function(err) {
            $('#loading-message').hide();
            console.error('Error loading appointments for refresh:', err);
            showMessage('Error loading appointments. Please try again.', 'danger');
        }
    });
}

function displayAppointmentsForCurrentView(appointments) {
    switch(currentView) {
        case 'month': displayMonthView(appointments); break;
        case 'week':  displayWeekView(appointments);  break;
        case 'day':   displayDayView(appointments);   break;
        case 'list':  displayListView(appointments);  break;
    }
}

function initializeCalendar() {
    var today = new Date();
    var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    $('#start-date').val(frappe.datetime.obj_to_str(firstDay));
    $('#end-date').val(frappe.datetime.obj_to_str(lastDay));
    $('#list-start-date').val(frappe.datetime.obj_to_str(firstDay));
    $('#list-end-date').val(frappe.datetime.obj_to_str(lastDay));
}

function getDateRange() {
    var startDate, endDate;
    var momentDate = moment(currentDate);
    switch(currentView) {
        case 'month':
            startDate = momentDate.clone().startOf('month').startOf('week');
            endDate   = momentDate.clone().endOf('month').endOf('week');
            break;
        case 'week':
            startDate = momentDate.clone().startOf('week');
            endDate   = momentDate.clone().endOf('week');
            break;
        case 'day':
            startDate = momentDate.clone();
            endDate   = momentDate.clone();
            break;
        case 'list':
            var startVal = $('#list-start-date').val();
            var endVal   = $('#list-end-date').val();
            startDate = startVal ? moment(startVal) : momentDate.clone().startOf('month');
            endDate   = endVal   ? moment(endVal)   : momentDate.clone().endOf('month');
            break;
    }
    return { start: startDate.format('YYYY-MM-DD'), end: endDate.format('YYYY-MM-DD') };
}

function updatePeriodDisplay() {
    var dateRange = getDateRange();
    var displayText = '';
    switch(currentView) {
        case 'month':
            displayText = moment(dateRange.start).format('MMMM YYYY'); break;
        case 'week':
            var ws = moment(dateRange.start), we = moment(dateRange.end);
            displayText = `Week ${ws.week()} - ${ws.format('MMM D')} to ${we.format('MMM D, YYYY')}`;
            break;
        case 'day':
            displayText = moment(dateRange.start).format('dddd, MMMM D, YYYY'); break;
        case 'list':
            var ls = moment(dateRange.start), le = moment(dateRange.end);
            displayText = `${ls.format('MMM D, YYYY')} to ${le.format('MMM D, YYYY')}`;
            break;
    }
    $('#current-period').text(displayText);
}

/* -------------------------
   Month / Week / Day / List renderers
--------------------------*/
function displayMonthView(appointments) {
    var container = $('#month-calendar');
    container.empty();

    var intendedMonth = moment(currentDate);
    var monthStart = intendedMonth.clone().startOf('month');
    var monthEnd = intendedMonth.clone().endOf('month');

    var calendarStart = monthStart.clone().startOf('week');
    var calendarEnd   = monthEnd.clone().endOf('week');

    var today = moment();

    var html = `
        <div class="month-calendar-grid">
            <div class="month-header">
                <div class="week-header">Week</div>
                <div class="day-header">Sun</div>
                <div class="day-header">Mon</div>
                <div class="day-header">Tue</div>
                <div class="day-header">Wed</div>
                <div class="day-header">Thu</div>
                <div class="day-header">Fri</div>
                <div class="day-header">Sat</div>
            </div>
            <div class="month-grid">
    `;

    var currentDay = calendarStart.clone();
    var currentWeek = null;
    var weekHtml = '';
    var totalMonthAppointments = 0;

    while (currentDay.isSameOrBefore(calendarEnd)) {
        var weekNumber = currentDay.week();

        if (weekNumber !== currentWeek) {
            if (currentWeek !== null) {
                html += weekHtml + '</div>';
            }
            currentWeek = weekNumber;
            weekHtml = `<div class="week-row">`;
            weekHtml += `<div class="week-number-cell" title="Click to view week ${weekNumber}">${weekNumber}</div>`;
        }

        var dayAppointments = appointments.filter(function(appt) {
            return appt.appointment_date === currentDay.format('YYYY-MM-DD');
        });

        totalMonthAppointments += dayAppointments.length;

        var isToday = currentDay.isSame(today, 'day');
        var isCurrentMonth = currentDay.month() === monthStart.month();
        var dayDateStr = currentDay.format('YYYY-MM-DD');

        weekHtml += `<div class="month-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dayDateStr}">`;
        weekHtml += `<div class="day-number ${isToday ? 'today' : ''}">${currentDay.date()}</div>`;
        weekHtml += `<div class="day-appointments">`;

        dayAppointments.forEach(function(appt) {
            var statusClass = getStatusClass(appt.status);
            var timeDisplay = appt.appointment_time ? frappe.datetime.str_to_user(appt.appointment_time, 'hh:mm A') : '';
            weekHtml += `
                <div class="appointment-badge ${statusClass}"
                     data-name="${appt.name}"
                     data-date="${appt.appointment_date}"
                     draggable="true"
                     title="${frappe.utils.escape_html(appt.patient_name || '')} - ${timeDisplay}">
                    <span class="appointment-time">${timeDisplay}</span>
                    <span class="appointment-patient">${frappe.utils.escape_html(appt.patient_name || '')}</span>
                </div>
            `;
        });

        if (dayAppointments.length === 0) {
            weekHtml += `<div class="no-appointments-day">No appointments</div>`;
        }

        weekHtml += `</div></div>`;
        currentDay.add(1, 'day');

        if (currentDay.day() === 0 || currentDay.isAfter(calendarEnd)) {
            html += weekHtml + '</div>';
            weekHtml = '';
            currentWeek = null;
        }
    }

    if (weekHtml && weekHtml !== '<div class="week-row">') {
        html += weekHtml + '</div>';
    }

    html += `</div></div>`;

    var monthSummary = `
        <div class="month-summary">
            <div class="month-total-appointments">
                <i class="fa fa-bar-chart"></i>
                Total: ${totalMonthAppointments} appointment(s) in ${intendedMonth.format('MMMM YYYY')}
            </div>
        </div>
    `;

    container.html(html + monthSummary).show();

    $('.appointment-badge').off('click').on('click', function() {
        var appointmentName = $(this).data('name');
        frappe.set_route('Form', 'Patient Appointment', appointmentName);
    });

    $('.week-number-cell').off('click').on('click', function() {
        var weekNumber = parseInt($(this).text(), 10);
        var year = moment(currentDate).year();
        var weekStart = moment().year(year).week(weekNumber).startOf('week');
        currentDate = weekStart.format('YYYY-MM-DD');
        switchView('week');
    });
}

function displayWeekView(appointments) {
    var container = $('#week-calendar');
    container.empty();

    var dateRange = getDateRange();
    var weekStart = moment(dateRange.start);
    var weekEnd = moment(dateRange.end);
    var today = moment();

    var html = `
        <div class="week-header-info">
            <div class="week-range">
                <i class="fa fa-calendar-week"></i>
                ${weekStart.format('MMM D')} - ${weekEnd.format('MMM D, YYYY')}
            </div>
            <div class="week-number-display">
                <i class="fa fa-hashtag"></i>
                Week ${weekStart.week()} of ${weekStart.year()}
            </div>
        </div>
        <div class="week-grid">
    `;

    var totalWeekAppointments = 0;

    for (let i = 0; i < 7; i++) {
        var currentDay = weekStart.clone().add(i, 'days');
        var dayDateStr = currentDay.format('YYYY-MM-DD');
        var isToday = currentDay.isSame(today, 'day');

        var dayAppointments = appointments.filter(function(appt) {
            return appt.appointment_date === dayDateStr;
        });

        totalWeekAppointments += dayAppointments.length;

        html += `
            <div class="week-day ${isToday ? 'today' : ''}" data-date="${dayDateStr}">
                <div class="week-day-header">
                    <div class="week-day-name">${currentDay.format('ddd')}</div>
                    <div class="week-day-date">${currentDay.date()}</div>
                    ${isToday ? '<div class="today-indicator">Today</div>' : ''}
                </div>
                <div class="week-day-appointments">
        `;

        if (dayAppointments.length === 0) {
            html += `
                <div class="no-appointments">
                    <i class="fa fa-calendar-times-o"></i>
                    <span>No appointments</span>
                </div>
            `;
        } else {
            dayAppointments.sort(function(a, b) {
                return (a.appointment_time || '').localeCompare(b.appointment_time || '');
            });

            dayAppointments.forEach(function(appt) {
                var statusClass = getStatusClass(appt.status);
                var timeDisplay = appt.appointment_time ? frappe.datetime.str_to_user(appt.appointment_time, 'hh:mm A') : 'All day';

                html += `
                    <div class="week-appointment ${statusClass}"
                         data-name="${appt.name}"
                         data-date="${appt.appointment_date}"
                         draggable="true">
                        <div class="appointment-time">${timeDisplay}</div>
                        <div class="appointment-patient">${frappe.utils.escape_html(appt.patient_name || '')}</div>
                        <div class="appointment-practitioner">${frappe.utils.escape_html(appt.practitioner_name || 'N/A')}</div>
                        <div class="appointment-type">${frappe.utils.escape_html(appt.appointment_type || '')}</div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
    }

    html += `</div>`;

    var weekSummary = `
        <div class="week-summary">
            <div class="week-total-appointments">
                <i class="fa fa-list-alt"></i>
                Total: ${totalWeekAppointments} appointment(s) this week
            </div>
        </div>
    `;

    container.html(html + weekSummary).show();

    $('.week-appointment').off('click').on('click', function() {
        var appointmentName = $(this).data('name');
        frappe.set_route('Form', 'Patient Appointment', appointmentName);
    });
}

function displayDayView(appointments) {
    var container = $('#day-calendar');
    container.empty();

    var dayAppointments = appointments.filter(function(appt) {
        return appt.appointment_date === currentDate;
    });

    var currentDay = moment(currentDate);
    var today = moment();
    var isToday = currentDay.isSame(today, 'day');

    var html = `
        <div class="day-view">
            <div class="day-header ${isToday ? 'today-header' : ''}">
                <h4>
                    ${currentDay.format('dddd, MMMM D, YYYY')}
                    ${isToday ? '<span class="today-badge">Today</span>' : ''}
                </h4>
                <div class="day-info">
                    <div class="appointment-count ${dayAppointments.length === 0 ? 'no-appointments' : ''}">
                        ${dayAppointments.length} appointment(s)
                    </div>
                    <div class="day-of-year">Day ${currentDay.dayOfYear()} of ${currentDay.year()}</div>
                </div>
            </div>
            <div class="day-timeline">
    `;

    if (dayAppointments.length === 0) {
        html += `
            <div class="no-appointments-day-view">
                <i class="fa fa-calendar-times-o fa-3x"></i>
                <h5>No appointments scheduled</h5>
                <p>No appointments found for ${currentDay.format('dddd, MMMM D, YYYY')}</p>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="frappe.new_doc('Patient Appointment')">
                        <i class="fa fa-plus"></i> Create New Appointment
                    </button>
                    <button class="btn btn-default btn-sm" onclick="currentDate='${today.format('YYYY-MM-DD')}'; refreshCurrentView()">
                        <i class="fa fa-calendar"></i> Go to Today
                    </button>
                </div>
            </div>
        `;
    } else {
        dayAppointments.sort(function(a, b) {
            return (a.appointment_time || '').localeCompare(b.appointment_time || '');
        });

        dayAppointments.forEach(function(appt) {
            var statusClass = getStatusClass(appt.status);
            var timeDisplay = appt.appointment_time ? frappe.datetime.str_to_user(appt.appointment_time, 'hh:mm A') : 'Time not set';

            html += `
                <div class="day-appointment ${statusClass}" data-name="${appt.name}">
                    <div class="appointment-time-slot">
                        <div class="time-display">${timeDisplay}</div>
                        <div class="duration">${appt.duration || 15} min</div>
                    </div>
                    <div class="appointment-details">
                        <div class="appointment-patient">
                            <i class="fa fa-user"></i> ${frappe.utils.escape_html(appt.patient_name || 'Unknown Patient')}
                        </div>
                        <div class="appointment-meta">
                            <span class="practitioner">
                                <i class="fa fa-user-md"></i> ${frappe.utils.escape_html(appt.practitioner_name || 'Unknown Practitioner')}
                            </span>
                            ${appt.department ? ' • ' + frappe.utils.escape_html(appt.department) : ''}
                            ${appt.appointment_type ? ' • ' + frappe.utils.escape_html(appt.appointment_type) : ''}
                        </div>
                        <div class="appointment-status-badge">
                            <span class="badge ${getStatusClass(appt.status)}">${frappe.utils.escape_html(appt.status || 'Unknown')}</span>
                            ${appt.add_video_conferencing ? '<span class="badge badge-info video-badge"><i class="fa fa-video-camera"></i> Video</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    container.html(html).show();

    $('.day-appointment').off('click').on('click', function() {
        var appointmentName = $(this).data('name');
        frappe.set_route('Form', 'Patient Appointment', appointmentName);
    });
}

function displayListView(appointments) {
    var container = $('#appointments-container');
    container.empty();

    if (appointments.length === 0) {
        showNoAppointmentsMessage();
        return;
    }

    var appointmentsByDate = {};
    appointments.forEach(function(appt) {
        var date = appt.appointment_date;
        if (!appointmentsByDate[date]) appointmentsByDate[date] = [];
        appointmentsByDate[date].push(appt);
    });

    var html = '';
    var dateKeys = Object.keys(appointmentsByDate).sort();

    dateKeys.forEach(function(date) {
        var userDate = frappe.datetime.str_to_user(date);

        html += `
            <div class="date-group">
                <h4><i class="fa fa-calendar-o"></i> ${userDate}</h4>
                <div class="appointments-list">
        `;

        appointmentsByDate[date].forEach(function(appt) {
            var statusClass = getStatusClass(appt.status);
            var timeDisplay = appt.appointment_time ? frappe.datetime.str_to_user(appt.appointment_time, 'hh:mm A') : 'Time not set';

            var docstatusBadge = '';
            if (appt.docstatus === 0) docstatusBadge = '<span class="badge badge-warning badge-xs">Draft</span> ';
            else if (appt.docstatus === 1) docstatusBadge = '<span class="badge badge-success badge-xs">Submitted</span> ';
            else if (appt.docstatus === 2) docstatusBadge = '<span class="badge badge-danger badge-xs">Cancelled</span> ';

            html += `
                <div class="appointment-item">
                    <div class="row">
                        <div class="col-sm-8">
                            <h5>
                                <i class="fa fa-user"></i> ${frappe.utils.escape_html(appt.patient_name || 'Unknown Patient')}
                                ${docstatusBadge}
                            </h5>
                            <p class="appointment-details">
                                <i class="fa fa-user-md"></i> ${frappe.utils.escape_html(appt.practitioner_name || 'Unknown Practitioner')}
                                ${appt.department ? ' • ' + frappe.utils.escape_html(appt.department) : ''}
                            </p>
                            <p class="appointment-time">
                                <i class="fa fa-clock-o"></i> ${timeDisplay}
                                ${appt.appointment_type ? ' • ' + frappe.utils.escape_html(appt.appointment_type) : ''}
                            </p>
                        </div>
                        <div class="col-sm-4 text-right">
                            <span class="badge ${statusClass}">${frappe.utils.escape_html(appt.status || 'Unknown')}</span>
                            <div class="action-buttons">
                                <button class="btn btn-default btn-xs view-appointment" data-name="${frappe.utils.escape_html(appt.name)}">
                                    <i class="fa fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    container.html(html).show();

    $('.view-appointment').off('click').on('click', function() {
        var appointmentName = $(this).data('name');
        frappe.set_route('Form', 'Patient Appointment', appointmentName);
    });
}

/* -------------------------
   Utilities / Messages
--------------------------*/
function getStatusClass(status) {
    switch(status) {
        case 'Open': return 'status-open';
        case 'Scheduled': return 'status-scheduled';
        case 'Confirmed': return 'status-confirmed';
        case 'Closed': return 'status-closed';
        case 'Cancelled': return 'status-cancelled';
        case 'No Show': return 'status-no-show';
        default: return 'status-default';
    }
}

function showNoAppointmentsMessage() {
    var message = 'No appointments found';
    if (currentView !== 'list') message += ' for the selected period';
    if ($('#filter-summary').is(':visible')) message += ' matching the current filters';
    if (currentView === 'day' || currentView === 'list') showMessage(message, 'warning');
}

function showMessage(message, type) {
    var container = $('.calendar-view:visible .calendar-content, #appointments-container').first();
    container.html(`
        <div class="alert alert-${type}">
            <i class="fa fa-${type === 'danger' ? 'exclamation-triangle' : 'info-circle'}"></i> 
            ${frappe.utils.escape_html(message)}
        </div>
    `).show();
}

function showError(wrapper, error) {
    $(wrapper).html(`
        <div class="alert alert-danger">
            <h4>Error Loading Calendar</h4>
            <p>There was an error loading the patient appointment calendar.</p>
            <pre>${frappe.utils.escape_html(error.toString())}</pre>
            <button class="btn btn-primary btn-sm" onclick="window.location.reload()">
                <i class="fa fa-refresh"></i> Reload Page
            </button>
        </div>
    `);
}

/* -------------------------
   Service Unit Reschedule (custom dialog)
--------------------------*/
function showServiceUnitRescheduleDialog(appt, targetDate) {
    if (!appt.service_unit) {
        frappe.msgprint(__('This appointment has no Service Unit set.'));
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
                return;
            }
            // Build & show dialog with selectable slots
            show_availability_dialog_for_reschedule(r.message, appt, targetDate);
        }
    });
}

function show_availability_dialog_for_reschedule(html_content, appt, targetDate) {
    let selectedTimeValue = null;

    let dialog = new frappe.ui.Dialog({
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
            // Use existing server method to reschedule (keeps original flow)
            frappe.call({
                method: 'milkart_reservations.overrides.patient_appointment.reschedule_via_calendar',
                args: {
                    docname: appt.name,
                    new_date: targetDate,
                    new_time: selectedTimeValue
                },
                callback: (r) => {
                    if (r.message && r.message.success) {
                        frappe.show_alert({ message: __('Appointment rescheduled successfully'), indicator: 'green' });
                        dialog.hide();
                        refreshCurrentView();
                    } else {
                        frappe.msgprint(__('Reschedule failed'));
                    }
                },
                error: () => { /* keep dialog open to try again */ }
            });
        },
        secondary_action_label: __('Close'),
        secondary_action: function() { dialog.hide(); }
    });

    dialog.show();

    // Enhance buttons inside provided HTML to capture slot selection
    setTimeout(() => {
        enhance_dialog_with_selection(dialog, {
            onSelect: function(displayText, timeValue) {
                selectedTimeValue = timeValue;
            },
            enablePrimary: true // will enable primary on selection
        });
    }, 250);
}

/**
 * Enhance any HTML of slots by turning visible times into selectable buttons.
 * If options.onSelect is provided, it will be called with (display, value).
 */
function enhance_dialog_with_selection(dialog, options = {}) {
    const dialog_body = dialog.body;

    let timeButtons = Array.from(dialog_body.querySelectorAll('button')).filter(button => {
        const text = (button.textContent || '').trim();
        return text && (text.includes('AM') || text.includes('PM') || text.match(/\d{1,2}:\d{2}([ ]?[AP]M)?/i));
    });

    if (timeButtons.length === 0) {
        timeButtons = Array.from(dialog_body.querySelectorAll('.btn, .slot-available, [data-time]'));
    }

    timeButtons.forEach(button => {
        const originalTime = (button.getAttribute('data-time') || button.textContent || '').trim();
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

            // Visual selection
            timeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            frappe.show_alert({
                message: __(`Selected time: ${selectedDisplayTime}`),
                indicator: 'green'
            });

            if (typeof options.onSelect === 'function') {
                options.onSelect(selectedDisplayTime, selectedTimeValue);
            }

            if (options.enablePrimary) {
                dialog.get_primary_btn().attr('disabled', false);
            }
        });
    });

    // Disable primary until selection
    if (options.enablePrimary) {
        dialog.get_primary_btn().attr('disabled', true);
    }
}

/**
 * Convert a human display time (e.g., "2:30 PM", "14:45") to "HH:mm:00"
 */
function convert_display_time_to_value(displayTime) {
    if (!displayTime) return '';
    try {
        let timeStr = displayTime.trim();

        if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
        if (/^\d{1,2}:\d{2}$/.test(timeStr)) return timeStr + ':00';

        let period = '';
        if (timeStr.toUpperCase().includes('AM')) {
            period = 'AM';
            timeStr = timeStr.replace(/AM/gi, '').trim();
        } else if (timeStr.toUpperCase().includes('PM')) {
            period = 'PM';
            timeStr = timeStr.replace(/PM/gi, '').trim();
        }

        const parts = timeStr.split(':');
        let hours = parseInt(parts[0] || '0', 10);
        let minutes = (parts[1] || '00').padStart(2, '0');

        if (period === 'PM' && hours < 12) hours += 12;
        else if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    } catch (error) {
        console.error('Time conversion error:', error, displayTime);
        return displayTime;
    }
}

/* -------------------------
   Initial Load
--------------------------*/
function loadAppointments() {
    $('#loading-message').show();
    $('.calendar-view:visible .calendar-content').hide();
    $('#appointments-container').hide();

    updatePeriodDisplay();

    var dateRange = getDateRange();

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Patient Appointment',
            fields: [
                'name', 'patient', 'patient_name', 'practitioner', 'practitioner_name',
                'appointment_date', 'appointment_time', 'department', 'status',
                'appointment_type', 'docstatus', 'service_unit', 'company',
                'appointment_for', 'patient_sex', 'duration', 'add_video_conferencing',
                'invoiced', 'paid_amount', 'mode_of_payment', 'referring_practitioner',
                'position_in_queue'
            ],
            filters: [
                ['appointment_date', '>=', dateRange.start],
                ['appointment_date', '<=', dateRange.end]
            ],
            order_by: 'appointment_date, appointment_time asc',
            limit: 1000
        },
        callback: function(response) {
            $('#loading-message').hide();

            if (response.message && response.message.length > 0) {
                allAppointments = response.message;
                filteredAppointments = [];
                applyFilters();
            } else {
                allAppointments = [];
                filteredAppointments = [];
                showNoAppointmentsMessage();
            }
        },
        error: function(err) {
            $('#loading-message').hide();
            console.error('Error loading appointments:', err);
            showMessage('Error loading appointments. Please try again.', 'danger');
        }
    });
}

// Start the initialization
initializePage();

console.log('Milkart Patient Appointment JS loaded - Enhanced with conditional drag-drop reschedule');
