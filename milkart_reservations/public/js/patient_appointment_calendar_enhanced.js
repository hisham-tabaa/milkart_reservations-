// /home/cyberv/cyberv-15-bench/apps/insightcoreerpmilkart/insightcoreerpmilkart/public/js/patient_appointment_calendar.js
// Patient Appointment Calendar - Enhanced with Advanced Filtering
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
        console.log('Going to today:', currentDate, 'Month:', moment(currentDate).format('MMMM YYYY'));
        // Clear all data to force fresh load
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
    
    // Quick filters
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

        // Enable drag-drop rescheduling
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
        var apptName = e.originalEvent.dataTransfer.getData('text/plain');
        if (!apptName) return;

        // Get target date from the dropped cell
        var targetDate;
        if ($(this).hasClass('month-day')) {
            targetDate = $(this).find('.day-number').text().trim();
            var monthYear = $('#current-period').text().trim(); // e.g., "October 2025"
            var fullDate = moment(monthYear + ' ' + targetDate, 'MMMM YYYY D').format('YYYY-MM-DD');
            if (!fullDate || fullDate === 'Invalid date') {
                // fallback: use calendar logic
                var weekRow = $(this).closest('.week-row');
                var weekStart = weekRow.data('week-start'); // we'll set this in month view
                // Instead, better: get from data attribute (see Step 3)
            }
        } else if ($(this).hasClass('week-day')) {
            targetDate = $(this).find('.week-day-date').text().trim();
            var weekRange = $('#current-period').text(); // e.g., "Week 42 - Oct 13 to Oct 19, 2025"
            // Extract year from week range
            var yearMatch = weekRange.match(/(\d{4})/);
            var year = yearMatch ? yearMatch[1] : moment().year();
            var month = $(this).find('.week-day-name').text(); // e.g., "Mon"
            // Better: store date in data attribute (see Step 3)
        }

        // ✅ BETTER: Store date in day cell
        targetDate = $(this).data('date');
        if (!targetDate) {
            frappe.msgprint(__('Could not determine target date.'));
            return;
        }

        // Fetch the appointment doc to get practitioner, etc.
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Patient Appointment',
                name: apptName
            },
            callback: function(r) {
                if (r.message) {
                    var appt = r.message;
                    // Prevent rescheduling to same date
                    if (appt.appointment_date === targetDate) {
                        frappe.msgprint(__('Same date selected.'));
                        return;
                    }

                    // Show "Available Slots" dialog for target date
                    showRescheduleDialog(appt, targetDate);
                }
            }
        });
    });
}

function loadFilterOptions() {
    // Load status options
    var statusOptions = ['Open', 'Scheduled', 'Confirmed', 'Closed', 'Cancelled', 'No Show'];
    var statusFilter = $('#status-filter');
    statusOptions.forEach(function(status) {
        statusFilter.append('<option value="' + status + '">' + status + '</option>');
    });
    
    // Load practitioners with error handling
    loadPractitioners();
    
    // Load departments with error handling
    loadDepartments();
    
    // Load appointment types with error handling
    loadAppointmentTypes();
    
    // Load patients with error handling
    loadPatients();
    
    // Load service units with error handling
    loadServiceUnits();
    
    // Load companies with error handling
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
                    var displayName = practitioner.first_name || practitioner.last_name ? 
                        (practitioner.first_name || '') + ' ' + (practitioner.last_name || '') : 
                        practitioner.name;
                    practitionerFilter.append('<option value="' + practitioner.name + '">' + displayName + '</option>');
                });
            }
        },
        error: function(err) {
            console.warn('Error loading practitioners:', err);
            // Continue without practitioners filter
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
                    var displayName = dept.department || dept.name;
                    departmentFilter.append('<option value="' + dept.name + '">' + displayName + '</option>');
                });
            }
        },
        error: function(err) {
            console.warn('Error loading departments:', err);
            // Continue without departments filter
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
        },
        error: function(err) {
            console.warn('Error loading appointment types:', err);
            // Continue without appointment types filter
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
                    var displayName = patient.patient_name || patient.name;
                    patientFilter.append('<option value="' + patient.name + '">' + displayName + '</option>');
                });
            }
        },
        error: function(err) {
            console.warn('Error loading patients:', err);
            // Continue without patients filter
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
                    var displayName = unit.healthcare_service_unit_name || unit.name;
                    serviceUnitFilter.append('<option value="' + unit.name + '">' + displayName + '</option>');
                });
            }
        },
        error: function(err) {
            console.warn('Error loading service units:', err);
            // Try alternative field names
            loadServiceUnitsAlternative();
        }
    });
}

function loadServiceUnitsAlternative() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Healthcare Service Unit',
            fields: ['name'],
            limit: 100
        },
        callback: function(response) {
            if (response.message) {
                var serviceUnitFilter = $('#service-unit-filter');
                response.message.forEach(function(unit) {
                    serviceUnitFilter.append('<option value="' + unit.name + '">' + unit.name + '</option>');
                });
            }
        },
        error: function(err) {
            console.warn('Error loading service units with alternative method:', err);
            // Hide service unit filter if it fails
            $('#service-unit-filter').closest('.col-sm-3').hide();
        }
    });
}

function loadCompanies() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Company',
            fields: ['name'],
            limit: 20
        },
        callback: function(response) {
            if (response.message) {
                var companyFilter = $('#company-filter');
                response.message.forEach(function(company) {
                    companyFilter.append('<option value="' + company.name + '">' + company.name + '</option>');
                });
            }
        },
        error: function(err) {
            console.warn('Error loading companies:', err);
            // Continue without companies filter
        }
    });
}

function applyFilters() {
    if (allAppointments.length === 0) {
        console.log('No appointments to filter');
        return;
    }
    
    var filters = getCurrentFilters();
    var dateRange = getDateRange();
    
    console.log('Applying filters with date range:', dateRange);
    
    // First filter by date range
    var dateFilteredAppointments = allAppointments.filter(function(appt) {
        return appt.appointment_date >= dateRange.start && appt.appointment_date <= dateRange.end;
    });
    
    console.log('After date filtering:', dateFilteredAppointments.length);
    
    // Then apply other filters
    filteredAppointments = dateFilteredAppointments.filter(function(appt) {
        return matchesAllFilters(appt, filters);
    });
    
    console.log('After all filtering:', filteredAppointments.length);
    
    updateFilterSummary(filters);
    
    // Display the filtered appointments for CURRENT view
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
     // NEW: Hide canceled appointments unless explicitly requested
    if (appointment.status === 'Cancelled' && !$('#show-canceled').is(':checked')) {
        return false;
    }
    // Status filter
    if (filters.status && appointment.status !== filters.status) return false;
    
    // Practitioner filter
    if (filters.practitioner && appointment.practitioner !== filters.practitioner) return false;
    
    // Department filter
    if (filters.department && appointment.department !== filters.department) return false;
    
    // Appointment type filter
    if (filters.appointmentType && appointment.appointment_type !== filters.appointmentType) return false;
    
    // Patient filter
    if (filters.patient && appointment.patient !== filters.patient) return false;
    
    // Service unit filter
    if (filters.serviceUnit && appointment.service_unit !== filters.serviceUnit) return false;
    
    // Company filter
    if (filters.company && appointment.company !== filters.company) return false;
    
    // Appointment for filter
    if (filters.appointmentFor && appointment.appointment_for !== filters.appointmentFor) return false;
    
    // Gender filter
    if (filters.gender && appointment.patient_sex !== filters.gender) return false;
    
    // Duration filter
    if (filters.duration && parseInt(appointment.duration) !== parseInt(filters.duration)) return false;
    
    // Video conferencing filter
    if (filters.videoConferencing !== '') {
        var hasVideo = appointment.add_video_conferencing ? '1' : '0';
        if (hasVideo !== filters.videoConferencing) return false;
    }
    
    // Invoiced filter
    if (filters.invoiced !== '') {
        var isInvoiced = appointment.invoiced ? '1' : '0';
        if (isInvoiced !== filters.invoiced) return false;
    }
    
    // Time range filter
    if (filters.timeRange && appointment.appointment_time) {
        var time = appointment.appointment_time;
        var hour = parseInt(time.split(':')[0]);
        
        switch(filters.timeRange) {
            case 'morning':
                if (hour < 6 || hour >= 12) return false;
                break;
            case 'afternoon':
                if (hour < 12 || hour >= 18) return false;
                break;
            case 'evening':
                if (hour < 18 || hour >= 24) return false;
                break;
        }
    }
    
    // Date range filter (already handled by the main query)
    
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
    // Clear all filter dropdowns
    $('.form-control').val('');
    
    // Reset date range to current view
    initializeCalendar();
    
    // Reapply filters (which will show all appointments)
    applyFilters();
}

function switchView(view) {
    console.log('Switching to view:', view);
    currentView = view;
    $('[data-view]').removeClass('active');
    $('[data-view="' + view + '"]').addClass('active');
    $('.calendar-view').hide().removeClass('active');
    $('#' + view + '-view').show().addClass('active');
    if (view === 'list') {
        $('#date-range-section').show();
    } else {
        $('#date-range-section').hide();
    }
    updatePeriodDisplay();
    // ALWAYS refresh to ensure correct data for current date + view
    refreshCurrentView();
}

function navigatePeriod(direction) {
    console.log('Navigating period:', direction, 'Current view:', currentView, 'Current date:', currentDate);
    
    var momentDate = moment(currentDate);
    
    switch(currentView) {
        case 'month':
            // For month view, navigate by month and set to 1st day of month
            currentDate = momentDate.add(direction, 'months').startOf('month').format('YYYY-MM-DD');
            console.log('New month date:', currentDate, 'Month:', moment(currentDate).format('MMMM YYYY'));
            break;
        case 'week':
            currentDate = momentDate.add(direction, 'weeks').format('YYYY-MM-DD');
            console.log('New week date:', currentDate);
            break;
        case 'day':
            currentDate = momentDate.add(direction, 'days').format('YYYY-MM-DD');
            console.log('New day date:', currentDate);
            break;
        case 'list':
            var startDate = moment($('#list-start-date').val());
            var endDate = moment($('#list-end-date').val());
            var rangeDays = endDate.diff(startDate, 'days');
            
            startDate.add(direction * (rangeDays + 1), 'days');
            endDate.add(direction * (rangeDays + 1), 'days');
            
            $('#list-start-date').val(startDate.format('YYYY-MM-DD'));
            $('#list-end-date').val(endDate.format('YYYY-MM-DD'));
            console.log('New list date range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'));
            break;
    }
    
    // Force complete refresh of the view
    refreshCurrentView();
}

function refreshCurrentView() {
    console.log('Refreshing current view:', currentView);
    
    // Show loading state
    $('#loading-message').show();
    $('.calendar-view:visible .calendar-content').hide();
    $('#appointments-container').hide();
    
    // Update period display immediately
    updatePeriodDisplay();
    
    // Clear ALL data to force fresh load
    allAppointments = [];
    filteredAppointments = [];
    
    // Get date range based on current view
    var dateRange = getDateRange();
    
    console.log('Date range for refresh:', dateRange, 'Current date:', currentDate);
    
    // Load appointments for the new period
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
                console.log('Appointments loaded for refresh:', response.message.length);
                console.log('Date range loaded:', dateRange.start, 'to', dateRange.end);
                allAppointments = response.message;
                var filters = getCurrentFilters();
                filteredAppointments = allAppointments.filter(function(appt) {
                    return matchesAllFilters(appt, filters);
                });
                console.log('Filtered appointments after refresh:', filteredAppointments.length);
            } else {
                console.log('No appointments found in date range for refresh:', dateRange);
                allAppointments = [];
                filteredAppointments = [];
            }
            // ALWAYS render the view — even if empty
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
    console.log('Displaying appointments for current view:', currentView, 'Count:', appointments.length);
    
    switch(currentView) {
        case 'month':
            displayMonthView(appointments);
            break;
        case 'week':
            displayWeekView(appointments);
            break;
        case 'day':
            displayDayView(appointments);
            break;
        case 'list':
            displayListView(appointments);
            break;
    }
}

function filterAppointmentsForCurrentView(appointments) {
    var dateRange = getDateRange();
    
    // Filter by date range first
    var filtered = appointments.filter(function(appt) {
        return appt.appointment_date >= dateRange.start && appt.appointment_date <= dateRange.end;
    });
    
    // Apply additional filters
    var filters = getCurrentFilters();
    filtered = filtered.filter(function(appt) {
        return matchesAllFilters(appt, filters);
    });
    
    return filtered;
}
function initializeCalendar() {
    // Set default date range
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
    console.log('Getting date range for currentDate:', currentDate, 'View:', currentView);
    switch(currentView) {
        case 'month':
            // Return Moment objects (not strings) for consistent formatting later
            startDate = momentDate.clone().startOf('month').startOf('week');
            endDate = momentDate.clone().endOf('month').endOf('week');
            console.log('Month calendar range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'), 'Month:', momentDate.format('MMMM YYYY'));
            break;
        case 'week':
            startDate = momentDate.clone().startOf('week');
            endDate = momentDate.clone().endOf('week');
            console.log('Week range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'));
            break;
        case 'day':
            startDate = momentDate.clone();
            endDate = momentDate.clone();
            console.log('Day range:', startDate.format('YYYY-MM-DD'));
            break;
        case 'list':
            var startVal = $('#list-start-date').val();
            var endVal = $('#list-end-date').val();
            startDate = startVal ? moment(startVal) : momentDate.clone().startOf('month');
            endDate = endVal ? moment(endVal) : momentDate.clone().endOf('month');
            console.log('List range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'));
            break;
    }
    // Always return formatted strings
    return {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD')
    };
}

function updatePeriodDisplay() {
    var dateRange = getDateRange();
    var displayText = '';
    var isValid = dateRange.start && dateRange.end;

    switch(currentView) {
        case 'month':
            if (isValid) {
                var monthDate = moment(dateRange.start);
                if (monthDate.isValid()) {
                    displayText = monthDate.format('MMMM YYYY');
                } else {
                    displayText = 'Invalid Month';
                }
            } else {
                displayText = 'Select Month';
            }
            break;

        case 'week':
            if (isValid) {
                var weekStart = moment(dateRange.start);
                var weekEnd = moment(dateRange.end);
                if (weekStart.isValid() && weekEnd.isValid()) {
                    var weekNumber = weekStart.week();
                    displayText = 'Week ' + weekNumber + ' - ' + 
                                 weekStart.format('MMM D') + ' to ' + 
                                 weekEnd.format('MMM D, YYYY');
                } else {
                    displayText = 'Invalid Week';
                }
            } else {
                displayText = 'Select Week';
            }
            break;

        case 'day':
            if (dateRange.start) {
                var dayDate = moment(dateRange.start);
                if (dayDate.isValid()) {
                    displayText = dayDate.format('dddd, MMMM D, YYYY');
                } else {
                    displayText = 'Invalid Day';
                }
            } else {
                displayText = 'Select Day';
            }
            break;

        case 'list':
            if (isValid) {
                var listStart = moment(dateRange.start);
                var listEnd = moment(dateRange.end);
                if (listStart.isValid() && listEnd.isValid()) {
                    displayText = listStart.format('MMM D, YYYY') + ' to ' + listEnd.format('MMM D, YYYY');
                } else {
                    displayText = 'Invalid Date Range';
                }
            } else {
                displayText = 'Set Date Range';
            }
            break;
    }
    $('#current-period').text(displayText);
}

function loadAppointments() {
    console.log('Loading all appointments for initial view...');
    
    // Show loading state
    $('#loading-message').show();
    $('.calendar-view:visible .calendar-content').hide();
    $('#appointments-container').hide();
    
    updatePeriodDisplay();
    
    // Get date range based on current view
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
                console.log('All appointments loaded:', response.message.length);
                
                // Store all appointments for filter purposes
                allAppointments = response.message;
                
                // Reset filtered appointments to force fresh filtering
                filteredAppointments = [];
                
                // Apply current filters
                applyFilters();
                
            } else {
                console.log('No appointments found in date range');
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
function displayFilteredAppointments() {
    if (filteredAppointments.length === 0) {
        showNoAppointmentsMessage();
        return;
    }
    
    // Display based on current view
    switch(currentView) {
        case 'month':
            displayMonthView(filteredAppointments);
            break;
        case 'week':
            displayWeekView(filteredAppointments);
            break;
        case 'day':
            displayDayView(filteredAppointments);
            break;
        case 'list':
            displayListView(filteredAppointments);
            break;
    }
}

// [Keep all the display functions (displayMonthView, displayWeekView, displayDayView, displayListView) exactly as they were in the previous version]

function displayMonthView(appointments) {
    var container = $('#month-calendar');
    container.empty();
    
    // ✅ Use currentDate to determine the intended month
    var intendedMonth = moment(currentDate);
    var monthStart = intendedMonth.clone().startOf('month');
    var monthEnd = intendedMonth.clone().endOf('month');
    
    // But render the full 6-week grid
    var calendarStart = monthStart.clone().startOf('week');
    var calendarEnd = monthEnd.clone().endOf('week');
    
    var today = moment();
    console.log('Displaying month view for:', intendedMonth.format('MMMM YYYY'), 'Appointments count:', appointments.length);
    console.log('Calendar range:', calendarStart.format('YYYY-MM-DD'), 'to', calendarEnd.format('YYYY-MM-DD'));
    
    
    console.log('Displaying month view for:', monthStart.format('MMMM YYYY'), 'Appointments count:', appointments.length);
    
    // Create month calendar structure
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
    
    // Start from the first Sunday of the calendar view
    var calendarStart = monthStart.clone().startOf('week');
    var calendarEnd = monthEnd.clone().endOf('week');
    
    var currentDay = calendarStart.clone();
    var currentWeek = null;
    var weekHtml = '';
    var totalMonthAppointments = 0;
    
    console.log('Calendar range:', calendarStart.format('YYYY-MM-DD'), 'to', calendarEnd.format('YYYY-MM-DD'));
    
    while (currentDay.isBefore(calendarEnd) || currentDay.isSame(calendarEnd)) {
        var weekNumber = currentDay.week();
        
        // Start new week row
        if (weekNumber !== currentWeek) {
            if (currentWeek !== null) {
                html += weekHtml + '</div>';
            }
            currentWeek = weekNumber;
            weekHtml = `<div class="week-row">`;
            
            // Add week number cell first
            weekHtml += `<div class="week-number-cell" title="Click to view week ${weekNumber}">${weekNumber}</div>`;
        }
        
        // Filter appointments for this specific day
        var dayAppointments = appointments.filter(function(appt) {
            return appt.appointment_date === currentDay.format('YYYY-MM-DD');
        });
        
        totalMonthAppointments += dayAppointments.length;
        
        // Check if this is today
        var isToday = currentDay.isSame(today, 'day');
        var isCurrentMonth = currentDay.month() === monthStart.month();
        var dayDateStr = currentDay.format('YYYY-MM-DD');
        weekHtml += `<div class="month-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dayDateStr}">`;
        weekHtml += `<div class="day-number ${isToday ? 'today' : ''}">${currentDay.date()}</div>`;
        weekHtml += `<div class="day-appointments">`;
        
        // Display appointments
        dayAppointments.forEach(function(appt) {
            var statusClass = getStatusClass(appt.status);
            var timeDisplay = appt.appointment_time ? 
                frappe.datetime.str_to_user(appt.appointment_time, 'hh:mm A') : '';
            
            weekHtml += `
                <div class="appointment-badge ${statusClass}" 
                    data-name="${appt.name}" 
                    data-date="${appt.appointment_date}"
                    draggable="true" title="${appt.patient_name} - ${timeDisplay}">
                    <span class="appointment-time">${timeDisplay}</span>
                    <span class="appointment-patient">${appt.patient_name}</span>
                </div>
            `;
        });
        
        if (dayAppointments.length === 0) {
            weekHtml += `<div class="no-appointments-day">No appointments</div>`;
        }
        
        weekHtml += `</div></div>`;
        currentDay.add(1, 'day');
        
        // End week if we've reached Saturday or end of calendar
        if (currentDay.day() === 0 || currentDay.isAfter(calendarEnd)) {
            html += weekHtml + '</div>';
            weekHtml = '';
            currentWeek = null;
        }
    }
    
    // Close any remaining week
    if (weekHtml && weekHtml !== '<div class="week-row">') {
        html += weekHtml + '</div>';
    }
    
    html += `</div></div>`; // Close month-grid and month-calendar-grid
    
    // Add month summary
    var monthSummary = `
        <div class="month-summary">
            <div class="month-total-appointments">
                <i class="fa fa-bar-chart"></i>
                Total: ${totalMonthAppointments} appointment(s) in ${intendedMonth.format('MMMM YYYY')}
            </div>
        </div>
    `;
    
    container.html(html + monthSummary).show();
    
    // Bind click events
    $('.appointment-badge').off('click').on('click', function() {
        var appointmentName = $(this).data('name');
        frappe.set_route('Form', 'Patient Appointment', appointmentName);
    });
    
    // Add week number click functionality
    $('.week-number-cell').off('click').on('click', function() {
        var weekNumber = parseInt($(this).text());
        var year = moment(currentDate).year();
        var weekStart = moment().year(year).week(weekNumber).startOf('week');
        
        // Switch to week view for the selected week
        currentDate = weekStart.format('YYYY-MM-DD');
        switchView('week');
    });
    
    console.log('Month view rendered for', monthStart.format('MMMM YYYY'), 'with', totalMonthAppointments, 'total appointments');
}
function displayWeekView(appointments) {
    var container = $('#week-calendar');
    container.empty();
    
    var dateRange = getDateRange();
    var weekStart = moment(dateRange.start);
    var weekEnd = moment(dateRange.end);
    var today = moment();
    
    console.log('Displaying week view from:', dateRange.start, 'to:', dateRange.end);
    console.log('Appointments to display:', appointments.length);
    
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
        
        console.log('Checking day:', dayDateStr);
        
        // Filter appointments for this specific day
        var dayAppointments = appointments.filter(function(appt) {
            var matches = appt.appointment_date === dayDateStr;
            console.log('Appointment:', appt.name, 'Date:', appt.appointment_date, 'Matches:', matches);
            return matches;
        });
        
        console.log('Day', dayDateStr, 'has', dayAppointments.length, 'appointments');
        
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
            // Sort appointments by time
            dayAppointments.sort(function(a, b) {
                return (a.appointment_time || '').localeCompare(b.appointment_time || '');
            });
            
            dayAppointments.forEach(function(appt) {
                var statusClass = getStatusClass(appt.status);
                var timeDisplay = appt.appointment_time ? 
                    frappe.datetime.str_to_user(appt.appointment_time, 'hh:mm A') : 'All day';
                
                html += `
                        <div class="week-appointment ${statusClass}" 
                                data-name="${appt.name}" 
                                data-date="${appt.appointment_date}"
                                draggable="true">
                        <div class="appointment-time">${timeDisplay}</div>
                        <div class="appointment-patient">${appt.patient_name}</div>
                        <div class="appointment-practitioner">${appt.practitioner_name || 'N/A'}</div>
                        <div class="appointment-type">${appt.appointment_type || ''}</div>
                    </div>
                `;
            });
        }
        
        html += `</div></div>`;
    }
    
    html += `</div>`;
    
    // Add week summary
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
    
    console.log('Week view rendered with', totalWeekAppointments, 'total appointments');
}

function displayDayView(appointments) {
    var container = $('#day-calendar');
    container.empty();
    
    console.log('Displaying day view for:', currentDate, 'with', appointments.length, 'appointments');
    
    // Filter appointments for the specific day
    var dayAppointments = appointments.filter(function(appt) {
        var matchesDate = appt.appointment_date === currentDate;
        console.log('Appointment:', appt.name, 'Date:', appt.appointment_date, 'Matches:', matchesDate);
        return matchesDate;
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
                    <button class="btn btn-default btn-sm" onclick="currentDate = '${today.format('YYYY-MM-DD')}'; refreshCurrentView()">
                        <i class="fa fa-calendar"></i> Go to Today
                    </button>
                </div>
            </div>
        `;
    } else {
        // Sort appointments by time
        dayAppointments.sort(function(a, b) {
            return (a.appointment_time || '').localeCompare(b.appointment_time || '');
        });
        
        dayAppointments.forEach(function(appt) {
            var statusClass = getStatusClass(appt.status);
            var timeDisplay = appt.appointment_time ? 
                frappe.datetime.str_to_user(appt.appointment_time, 'hh:mm A') : 'Time not set';
            
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
                            <span class="badge ${getStatusClass(appt.status)}">${appt.status}</span>
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
    
    console.log('Day view rendered for:', currentDate);
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
        if (date) {
            if (!appointmentsByDate[date]) {
                appointmentsByDate[date] = [];
            }
            appointmentsByDate[date].push(appt);
        }
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
            var timeDisplay = appt.appointment_time ? 
                frappe.datetime.str_to_user(appt.appointment_time, 'hh:mm A') : 
                'Time not set';
            
            var docstatusBadge = '';
            if (appt.docstatus === 0) {
                docstatusBadge = '<span class="badge badge-warning badge-xs">Draft</span> ';
            } else if (appt.docstatus === 1) {
                docstatusBadge = '<span class="badge badge-success badge-xs">Submitted</span> ';
            } else if (appt.docstatus === 2) {
                docstatusBadge = '<span class="badge badge-danger badge-xs">Cancelled</span> ';
            }
            
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
    if (currentView !== 'list') {
        message += ' for the selected period';
    }
    if ($('#filter-summary').is(':visible')) {
        message += ' matching the current filters';
    }

    // ONLY show message in Day and List views
    if (currentView === 'day' || currentView === 'list') {
        showMessage(message, 'warning');
    }
    // For 'month' and 'week', do nothing — the grid is rendered by display functions
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

function showRescheduleDialog(appointment_doc, target_date) {
    // Reuse the existing availability dialog logic
    let selected_slot = null;
    let service_unit = null;
    let duration = appointment_doc.duration || 15;
    let add_video_conferencing = appointment_doc.add_video_conferencing || 0;

    let d = new frappe.ui.Dialog({
        title: __('Reschedule Appointment'),
        fields: [
            { fieldtype: 'Data', fieldname: 'patient', label: __('Patient'), read_only: 1 },
            { fieldtype: 'Data', fieldname: 'practitioner', label: __('Practitioner'), read_only: 1 },
            { fieldtype: 'Date', fieldname: 'appointment_date', label: __('New Date'), reqd: 1, default: target_date },
            { fieldtype: 'Section Break' },
            { fieldtype: 'HTML', fieldname: 'available_slots' }
        ],
        primary_action_label: __('Book New Slot'),
        primary_action: function() {
            if (!selected_slot) {
                frappe.msgprint(__('Please select a time slot.'));
                return;
            }

            // Step 1: Cancel old appointment
            frappe.call({
                method: 'healthcare.healthcare.doctype.patient_appointment.patient_appointment.update_status',
                args: {
                    appointment_id: appointment_doc.name,
                    status: 'Cancelled'
                },
                callback: function() {
                    // Step 2: Create new appointment
                    frappe.call({
                        method: 'frappe.client.insert',
                        args: {
                            doc: {
                                doctype: 'Patient Appointment',
                                patient: appointment_doc.patient,
                                practitioner: appointment_doc.practitioner,
                                appointment_type: appointment_doc.appointment_type,
                                appointment_for: appointment_doc.appointment_for,
                                department: appointment_doc.department,
                                service_unit: service_unit,
                                appointment_date: d.get_value('appointment_date'),
                                appointment_time: selected_slot,
                                duration: duration,
                                add_video_conferencing: add_video_conferencing,
                                company: appointment_doc.company,
                                mode_of_payment: appointment_doc.mode_of_payment,
                                paid_amount: appointment_doc.paid_amount,
                                billing_item: appointment_doc.billing_item,
                                invoiced: appointment_doc.invoiced
                            }
                        },
                        callback: function(r) {
                            if (r.message) {
                                frappe.show_alert(__('Appointment rescheduled successfully.'));
                                d.hide();
                                refreshCurrentView(); // ✅ Refresh calendar
                            }
                        }
                    });
                }
            });
        }
    });

    d.set_value('patient', appointment_doc.patient_name || appointment_doc.patient);
    d.set_value('practitioner', appointment_doc.practitioner_name || appointment_doc.practitioner);
    d.show();

    // Load available slots for target date
    frappe.call({
        method: 'healthcare.healthcare.doctype.patient_appointment.patient_appointment.get_availability_data',
        args: {
            practitioner: appointment_doc.practitioner,
            date: target_date,
            appointment: appointment_doc
        },
        callback: function(r) {
            if (r.message && r.message.slot_details.length > 0) {
                let slot_html = getSlotsForDialog(r.message.slot_details, target_date);
                d.fields_dict.available_slots.$wrapper.html(slot_html);

                // Make slots clickable
                d.fields_dict.available_slots.$wrapper.on('click', 'button', function() {
                    d.get_primary_btn().prop('disabled', false);
                    selected_slot = $(this).data('name');
                    service_unit = $(this).data('service-unit');
                    duration = $(this).data('duration') || appointment_doc.duration || 15;
                    add_video_conferencing = $(this).data('tele-conf') || 0;
                });
            } else {
                d.fields_dict.available_slots.$wrapper.html(`<div class="text-muted">No slots available on ${target_date}</div>`);
            }
        }
    });
}

// Helper: Render slots (reuse from your existing logic)
function getSlotsForDialog(slot_details, appointment_date) {
    let html = '';
    slot_details.forEach(slot_info => {
        html += `<div><strong>${slot_info.slot_name}</strong> - ${slot_info.service_unit || ''}</div>`;
        html += slot_info.avail_slot.map(slot => {
            let start_time = slot.from_time;
            let disabled = '';
            // Simple: don't disable past slots here for reschedule
            return `<button class="btn btn-sm btn-secondary" 
                    data-name="${start_time}"
                    data-service-unit="${slot_info.service_unit || ''}"
                    data-duration="${slot.duration || 15}"
                    data-tele-conf="${slot_info.tele_conf || 0}"
                    ${disabled}>
                    ${start_time.substring(0, 5)}
                </button>`;
        }).join(' ');
        html += '<br><br>';
    });
    return html;
}
// Start the initialization
initializePage();