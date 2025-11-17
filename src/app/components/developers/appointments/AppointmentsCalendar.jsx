"use client"
import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiEdit3, 
  FiX,
  FiVideo,
  FiHome,
  FiTrash2,
  FiLoader
} from 'react-icons/fi'
import { toast } from 'react-toastify'

// Custom CSS for modern calendar styling
const calendarStyles = `
  .rbc-calendar {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .rbc-calendar * {
    box-sizing: border-box;
  }
  
  .rbc-header {
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 4px;
    font-weight: 600;
    font-size: 12px;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .rbc-month-view {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    width: 100% !important;
    min-width: 800px;
  }
  
  .rbc-month-row {
    border-bottom: 1px solid #f3f4f6;
    min-height: 120px;
    display: flex;
  }
  
  .rbc-off-range-bg {
    background-color: #f9fafb;
  }
  
  .rbc-off-range {
    color: #9ca3af;
  }
  
  .rbc-today {
    background-color: #eff6ff;
  }
  
  .rbc-date-cell {
    padding: 6px 8px;
    font-size: 12px;
    color: #374151;
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 100px;
    align-items: center;
    justify-content: flex-start;
  }
  
  .rbc-event {
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 6px;
    margin: 1px 2px;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    width: calc(100% - 4px) !important;
    max-width: calc(100% - 4px) !important;
    overflow: visible !important;
    min-height: 28px;
    max-height: 60px;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    text-align: center !important;
    position: relative;
    word-wrap: break-word;
    word-break: break-word;
    white-space: normal !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
  }
  
  .rbc-event-content {
    font-size: 11px;
    font-weight: 500;
    line-height: 1.3;
    width: 100% !important;
    text-align: center !important;
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
  }
  
  .rbc-toolbar {
    margin-bottom: 16px;
    padding: 0;
  }
  
  .rbc-toolbar button:hover {
    background-color: #f9fafb;
  }
  
  .rbc-toolbar-label {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }
  
  .rbc-btn-group button {
    font-size: 12px;
    padding: 6px 12px;
  }
  
  .rbc-time-view {
    min-height: 600px;
    width: 100% !important;
  }
  
  .rbc-time-content {
    min-height: 500px;
  }
  
  .rbc-week-view {
    width: 100% !important;
    min-width: 800px;
  }
  
  .rbc-week-view .rbc-event {
    width: calc(100% - 4px) !important;
    max-width: calc(100% - 4px) !important;
    overflow: visible !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    text-align: center !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    font-size: 10px !important;
    padding: 2px 4px !important;
    margin: 1px !important;
    min-height: 24px !important;
    max-height: 50px !important;
  }
  
  .rbc-week-view .rbc-event-content {
    width: 100% !important;
    text-align: center !important;
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    font-size: 10px !important;
    line-height: 1.2 !important;
  }
  
  .rbc-week-view .rbc-time-slot {
    min-height: 30px !important;
  }
  
  .rbc-week-view .rbc-day-slot {
    min-width: 120px !important;
  }
  
  .rbc-week-view .rbc-header {
    min-width: 120px !important;
    padding: 8px 4px !important;
    font-size: 11px !important;
  }
  
  @media (max-width: 768px) {
    .rbc-calendar {
      overflow-x: auto !important;
      overflow-y: hidden !important;
    }
    
    .rbc-month-view,
    .rbc-week-view,
    .rbc-time-view {
      min-width: 800px !important;
      width: 800px !important;
    }
    
    .rbc-date-cell {
      min-width: 100px !important;
    }
    
    .rbc-header {
      min-width: 100px !important;
    }
    
    .rbc-week-view .rbc-day-slot {
      min-width: 100px !important;
    }
    
    .rbc-week-view .rbc-header {
      min-width: 100px !important;
    }
    
    .rbc-week-view .rbc-event {
      font-size: 9px !important;
      padding: 1px 3px !important;
      min-height: 20px !important;
      max-height: 40px !important;
    }
    
    .rbc-week-view .rbc-event-content {
      font-size: 9px !important;
      line-height: 1.1 !important;
    }
  }
`

const AppointmentsCalendar = ({ appointments, onEventSelect }) => {
  const localizer = momentLocalizer(moment)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('month')
  const [selectedDate, setSelectedDate] = useState(
    moment(new Date()).format('YYYY-MM-DD')
  )

  // Handle navigation
  // react-big-calendar's onNavigate receives: (newDate, view, action)
  const handleNavigate = (newDate, view, action) => {
    // When toolbar buttons are clicked, action will be 'TODAY', 'PREV', or 'NEXT'
    // When a date is clicked, newDate will be a Date object
    if (action) {
      // Handle toolbar button actions
      if (action === 'TODAY') {
        const today = new Date()
        setCurrentDate(today)
        setSelectedDate(moment(today).format('YYYY-MM-DD'))
      } else if (action === 'PREV') {
        let newDateObj
        if (currentView === 'month') {
          newDateObj = moment(currentDate).subtract(1, 'month').toDate()
        } else if (currentView === 'week') {
          newDateObj = moment(currentDate).subtract(1, 'week').toDate()
        } else if (currentView === 'day') {
          newDateObj = moment(currentDate).subtract(1, 'day').toDate()
        }
        setCurrentDate(newDateObj)
        setSelectedDate(moment(newDateObj).format('YYYY-MM-DD'))
      } else if (action === 'NEXT') {
        let newDateObj
        if (currentView === 'month') {
          newDateObj = moment(currentDate).add(1, 'month').toDate()
        } else if (currentView === 'week') {
          newDateObj = moment(currentDate).add(1, 'week').toDate()
        } else if (currentView === 'day') {
          newDateObj = moment(currentDate).add(1, 'day').toDate()
        }
        setCurrentDate(newDateObj)
        setSelectedDate(moment(newDateObj).format('YYYY-MM-DD'))
      }
    } else if (newDate instanceof Date) {
      // Handle direct date selection (clicking on a date)
      setCurrentDate(newDate)
      setSelectedDate(moment(newDate).format('YYYY-MM-DD'))
    }
  }

  // Handle date picker change
  const handleDatePickerChange = (dateString) => {
    if (dateString) {
      const dateObj = moment(dateString).toDate()
      setCurrentDate(dateObj)
      setSelectedDate(dateString)
      // Trigger navigation
      handleNavigate(dateObj, currentView, null)
    }
  }

  // Update selected date when currentDate changes externally
  useEffect(() => {
    setSelectedDate(moment(currentDate).format('YYYY-MM-DD'))
  }, [currentDate])

  // Handle view change
  const handleViewChange = (view) => {
    setCurrentView(view)
  }

  // Handle date selection (clicking on a date)
  const handleSelectSlot = ({ start }) => {
    setCurrentDate(start)
    if (currentView !== 'day') {
      setCurrentView('day')
    }
  }

  // Custom Toolbar Component
  // Using closure to access parent component's state
  const CustomToolbar = (toolbar) => {
    const goToToday = () => {
      toolbar.onNavigate('TODAY')
    }

    const goToPrevious = () => {
      toolbar.onNavigate('PREV')
    }

    const goToNext = () => {
      toolbar.onNavigate('NEXT')
    }

    const handleDateChange = (e) => {
      const newDate = e.target.value
      if (newDate) {
        const dateObj = moment(newDate).toDate()
        toolbar.onNavigate(dateObj)
      }
    }

    const viewNames = {
      month: 'Month',
      week: 'Week',
      day: 'Day'
    }

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-4 rounded-lg">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={goToToday}
            type="button"
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevious}
              type="button"
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              type="button"
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 ml-2 hidden sm:block">
            {toolbar.label}
          </h2>
          {/* Date Picker */}
          <div className="flex items-center gap-2 ml-auto sm:ml-2">
            <FiCalendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent bg-white"
              title="Go to specific date"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-1 w-full sm:w-auto justify-end sm:justify-start">
          {toolbar.views.map(view => (
            <button
              key={view}
              onClick={() => toolbar.onView(view)}
              type="button"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                toolbar.view === view
                  ? 'bg-primary_color text-white'
                  : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {viewNames[view]}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Custom Event Component
  const CustomEvent = ({ event }) => {
    const startTime = moment(event.start).format('HH:mm')
    const endTime = moment(event.end).format('HH:mm')
    const timeRange = `${startTime}-${endTime}`
    
    return (
      <div className="text-xs font-medium w-full h-full flex flex-col justify-center items-center text-center p-1" style={{ textAlign: 'center', width: '100%' }}>
        <div className="font-semibold text-white text-center text-xs leading-tight mb-0.5" title={event.title} style={{ width: '100%', textAlign: 'center' }}>
          {event.title}
        </div>
        <div className="text-xs opacity-90 font-normal text-white text-center leading-tight" style={{ width: '100%', textAlign: 'center' }}>
          {timeRange}
        </div>
      </div>
    )
  }

  // Convert appointments to calendar events
  const calendarEvents = appointments.map(appointment => {
    const startDateTime = moment(appointment.appointment_date)
    const endDateTime = moment(appointment.appointment_date).add(appointment.duration || 60, 'minutes')
    
    return {
      id: appointment.id,
      title: `${appointment.client_name || 'Unknown Client'} - ${appointment.listings?.title || 'Unknown Property'}`,
      start: startDateTime.toDate(),
      end: endDateTime.toDate(),
      appointment: appointment,
      resource: appointment
    }
  })

  const getStatusColorForCalendar = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981' // green
      case 'pending': return '#F59E0B' // yellow
      case 'completed': return '#3B82F6' // blue
      case 'cancelled': return '#EF4444' // red
      default: return '#6B7280' // gray
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />
      <div className="w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700, minWidth: '800px', width: '100%' }}
          date={currentDate}
          view={currentView}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectSlot={handleSelectSlot}
          views={['month', 'week', 'day']}
          step={60}
          timeslots={1}
          selectable
          popup
          className="text-xs"
          onSelectEvent={onEventSelect}
          eventPropGetter={(event) => {
            const status = event.appointment?.status
            const backgroundColor = getStatusColorForCalendar(status)
            
            return {
              style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.95,
                color: 'white',
                border: '0px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '11px',
                padding: '4px 6px',
                margin: '1px 2px',
                fontWeight: '500',
                minHeight: '28px',
                maxHeight: '60px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                width: 'calc(100% - 4px)',
                maxWidth: 'calc(100% - 4px)',
                position: 'relative',
                overflow: 'visible',
                textOverflow: 'clip',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                textAlign: 'center',
                left: '50%',
                transform: 'translateX(-50%)'
              }
            }
          }}
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent
          }}
        />
      </div>
    </div>
  )
}

export default AppointmentsCalendar

