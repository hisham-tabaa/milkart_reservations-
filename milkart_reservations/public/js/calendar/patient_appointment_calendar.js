
// Calendar Filter for Patient Appointment - Minimal Version
console.log('Calendar filter loaded for Patient Appointment');

// Wait for Frappe to be ready
function initCalendarFilter() {
    if (window.frappe && window.frappe.views && window.frappe.views.CalendarView) {
        setupCalendarFilter();
    } else {
        setTimeout(initCalendarFilter, 100);
    }
}

function setupCalendarFilter() {
    console.log('Setting up calendar filter...');
    
    // Store original method
    const originalGetEvents = frappe.views.CalendarView.prototype.get_events;
    
    // Override for Patient Appointment only
    frappe.views.CalendarView.prototype.get_events = function(start, end) {
        if (this.doctype !== 'Patient Appointment') {
            return originalGetEvents.call(this, start, end);
        }
        
        // Get filters from list view
        const filters = this.getAppliedFilters ? this.getAppliedFilters() : [];
        
        console.log('Applying filters to calendar:', filters);
        
        // For now, just use original method but log filters
        // We'll implement the actual filtering in next step
        return originalGetEvents.call(this, start, end);
    };
    
    // Add method to get filters
    frappe.views.CalendarView.prototype.getAppliedFilters = function() {
        const listView = frappe.views.list_view && frappe.views.list_view[this.doctype];
        return (listView && listView.filter_area) ? listView.filter_area.get() || [] : [];
    };
}

// Start initialization
setTimeout(initCalendarFilter, 1000);
