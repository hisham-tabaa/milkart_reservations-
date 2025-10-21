/**
 * Calendar Filter Integration for Patient Appointment
 * This file extends the Calendar View to respect List View filters
 */

// Use immediate function to avoid timing issues
(function() {
    'use strict';
    
    // Wait for Frappe to be fully loaded
    function initializeWhenReady() {
        if (window.frappe && window.frappe.views && window.frappe.views.CalendarView) {
            setupCalendarFilterIntegration();
        } else {
            // If Frappe not ready, wait a bit and try again
            setTimeout(initializeWhenReady, 100);
        }
    }
    
    function setupCalendarFilterIntegration() {
        console.log('Setting up calendar filter integration...');
        
        // Store original methods
        const originalGetEvents = frappe.views.CalendarView.prototype.get_events;
        const originalSetupDefaults = frappe.views.CalendarView.prototype.setup_defaults;
        const originalRefresh = frappe.views.CalendarView.prototype.refresh;
        
        // Override get_events for Patient Appointment
        frappe.views.CalendarView.prototype.get_events = function(start, end) {
            if (this.doctype !== 'Patient Appointment') {
                return originalGetEvents.call(this, start, end);
            }
            
            return new Promise(resolve => {
                const filters = this.getAppliedFilters ? this.getAppliedFilters() : [];
                
                frappe.call({
                    method: 'milkart_reservations.calendar_filter.calendar_filter_api.get_filtered_calendar_events',
                    args: {
                        doctype: this.doctype,
                        start: start,
                        end: end,
                        filters: filters,
                        field_map: this.field_map
                    },
                    callback: function(r) {
                        resolve(r.message || []);
                    }
                });
            });
        };
        
        // Add method to get applied filters
        frappe.views.CalendarView.prototype.getAppliedFilters = function() {
            const listView = frappe.views.list_view && frappe.views.list_view[this.doctype];
            return (listView && listView.filter_area) ? listView.filter_area.get() || [] : [];
        };
        
        // Override setup_defaults
        frappe.views.CalendarView.prototype.setup_defaults = function() {
            originalSetupDefaults.call(this);
            
            if (this.doctype === 'Patient Appointment') {
                this.setupFilterDisplay();
            }
        };
        
        // Setup filter display
        frappe.views.CalendarView.prototype.setupFilterDisplay = function() {
            const filters = this.getAppliedFilters();
            
            setTimeout(() => {
                const toolbar = this.$calendar_wrapper && this.$calendar_wrapper.find('.fc-toolbar');
                if (toolbar && toolbar.length) {
                    // Remove existing status if any
                    toolbar.find('.calendar-filter-status').remove();
                    
                    if (filters.length > 0) {
                        const statusHtml = `
                            <div class="calendar-filter-status" style="
                                margin-left: 15px;
                                padding: 4px 8px;
                                background: #e3f2fd;
                                border-radius: 4px;
                                border: 1px solid #2196f3;
                                font-size: 12px;
                                color: #1976d2;
                            ">
                                <i class="fa fa-filter"></i>
                                <strong>${filters.length}</strong> filter${filters.length > 1 ? 's' : ''} applied from list view
                            </div>
                        `;
                        toolbar.append(statusHtml);
                    }
                }
            }, 200);
        };
        
        // Override refresh to update filter display
        frappe.views.CalendarView.prototype.refresh = function() {
            originalRefresh.call(this);
            
            if (this.doctype === 'Patient Appointment') {
                this.setupFilterDisplay();
            }
        };
        
        console.log('Calendar filter integration setup complete');
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWhenReady);
    } else {
        initializeWhenReady();
    }
    
    // Also initialize when navigating (for single page app)
    if (window.frappe && frappe.router && frappe.router.on) {
        frappe.router.on('change', function() {
            setTimeout(initializeWhenReady, 500);
        });
    }
})();