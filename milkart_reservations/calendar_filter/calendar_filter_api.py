import frappe
from frappe.desk.calendar import get_events
from frappe.desk.reportview import get_filters_cond

@frappe.whitelist()
def get_filtered_calendar_events(doctype, start, end, filters=None, field_map=None):
    """
    Get calendar events with applied filters from list view
    """
    if not filters:
        filters = []
    
    if isinstance(filters, str):
        import json
        filters = json.loads(filters)
    
    # Convert filters to standard format
    standard_filters = process_filters(filters)
    
    # Build conditions from filters
    conditions = build_filter_conditions(standard_filters, doctype)
    
    # Get events with filters applied
    events = get_calendar_events_with_filters(
        doctype, 
        start, 
        end, 
        conditions, 
        field_map or {}
    )
    
    return events

def process_filters(filters):
    """
    Convert filters to standard format
    """
    standard_filters = []
    
    for filter_item in filters:
        if isinstance(filter_item, list) and len(filter_item) >= 3:
            # Standard [field, operator, value] format
            standard_filters.append(filter_item)
        elif isinstance(filter_item, dict):
            # Dictionary format
            field = filter_item.get('field')
            operator = filter_item.get('operator', '=')
            value = filter_item.get('value')
            if field and value is not None:
                standard_filters.append([field, operator, value])
    
    return standard_filters

def build_filter_conditions(filters, doctype):
    """
    Build SQL conditions from filters
    """
    if not filters:
        return ""
    
    conditions = []
    
    for field, operator, value in filters:
        if operator == '=':
            conditions.append(f"`{doctype}`.`{field}` = {frappe.db.escape(value)}")
        elif operator == '!=':
            conditions.append(f"`{doctype}`.`{field}` != {frappe.db.escape(value)}")
        elif operator == 'like':
            conditions.append(f"`{doctype}`.`{field}` LIKE '%{value}%'")
        elif operator == 'in':
            if isinstance(value, list):
                escaped_values = [frappe.db.escape(v) for v in value]
                conditions.append(f"`{doctype}`.`{field}` IN ({', '.join(escaped_values)})")
            else:
                conditions.append(f"`{doctype}`.`{field}` IN ({frappe.db.escape(value)})")
        elif operator == 'not in':
            if isinstance(value, list):
                escaped_values = [frappe.db.escape(v) for v in value]
                conditions.append(f"`{doctype}`.`{field}` NOT IN ({', '.join(escaped_values)})")
            else:
                conditions.append(f"`{doctype}`.`{field}` NOT IN ({frappe.db.escape(value)})")
        elif operator == '>':
            conditions.append(f"`{doctype}`.`{field}` > {frappe.db.escape(value)}")
        elif operator == '<':
            conditions.append(f"`{doctype}`.`{field}` < {frappe.db.escape(value)}")
        elif operator == '>=':
            conditions.append(f"`{doctype}`.`{field}` >= {frappe.db.escape(value)}")
        elif operator == '<=':
            conditions.append(f"`{doctype}`.`{field}` <= {frappe.db.escape(value)}")
        elif operator == 'between':
            if isinstance(value, list) and len(value) == 2:
                conditions.append(f"`{doctype}`.`{field}` BETWEEN {frappe.db.escape(value[0])} AND {frappe.db.escape(value[1])}")
    
    return " AND ".join(conditions) if conditions else ""

def get_calendar_events_with_filters(doctype, start, end, conditions, field_map):
    """
    Get calendar events with custom filter conditions
    """
    if not field_map:
        field_map = {
            'start': 'appointment_date',
            'end': 'appointment_date',
            'id': 'name',
            'title': 'patient',
            'allDay': 'all_day'
        }
    
    start_field = field_map.get('start')
    end_field = field_map.get('end') or start_field
    
    # Build the query
    query = f"""
        SELECT 
            `name` as id,
            `{start_field}` as start,
            `{end_field}` as end,
            `patient` as title,
            `appointment_type`,
            `practitioner`,
            `service_unit`,
            `appointment_time`,
            `status`
        FROM `tab{doctype}`
        WHERE 
            (`{start_field}` BETWEEN %(start)s AND %(end)s)
            OR (`{end_field}` BETWEEN %(start)s AND %(end)s)
            OR (`{start_field}` <= %(start)s AND `{end_field}` >= %(end)s)
    """
    
    # Add filter conditions if they exist
    if conditions:
        query += f" AND ({conditions})"
    
    # Add order by
    query += " ORDER BY `appointment_date`, `appointment_time`"
    
    # Execute query
    events = frappe.db.sql(query, {
        'start': start,
        'end': end
    }, as_dict=True)
    
    # Format events for calendar
    formatted_events = []
    for event in events:
        formatted_event = {
            'id': event.id,
            'title': f"{event.title} - {event.appointment_type or ''}",
            'start': event.start,
            'end': event.end,
            'allDay': False
        }
        
        # Add additional properties
        if event.service_unit:
            formatted_event['title'] += f" ({event.service_unit})"
        
        if event.status:
            formatted_event['className'] = f'event-status-{event.status.lower().replace(" ", "-")}'
        
        formatted_events.append(formatted_event)
    
    return formatted_events