import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert, ButtonGroup, Form } from 'react-bootstrap';
import { FaCalendarAlt, FaArrowLeft, FaArrowRight, FaBus, FaTicketAlt } from 'react-icons/fa';

const BusScheduleView = () => {
  // State for buses and bookings
  const [buses, setBuses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for date navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  
  // Format date for display
  const formatDate = (date) => format(date, 'yyyy-MM-dd');
  const formatDisplayDate = (date) => format(date, 'MMMM d, yyyy');
  
  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
      const end = endOfWeek(currentDate, { weekStartsOn: 0 }); // Saturday
      return { start, end };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end };
    }
  };
  
  // Navigate to previous period
  const goToPrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };
  
  // Navigate to next period
  const goToNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };
  
  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Toggle view mode between week and month
  const toggleViewMode = () => {
    setViewMode(viewMode === 'week' ? 'month' : 'week');
  };
  
  // Fetch buses for date range
  const fetchBuses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { start, end } = getDateRange();
      const startDateStr = formatDate(start);
      const endDateStr = formatDate(end);
      
      // Fetch buses for date range
      const response = await adminService.getBusesForDateRange(startDateStr, endDateStr);
      setBuses(response.busSchedule || []);
      
      // If in month view, also fetch bookings for the month
      if (viewMode === 'month') {
        await fetchMonthlyBookings();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching buses:', error);
      setError('Failed to fetch bus schedule. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch bookings for the month
  const fetchMonthlyBookings = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      
      const response = await adminService.getMonthlyBookings(year, month);
      setBookings(response.monthlySummary || []);
    } catch (error) {
      console.error('Error fetching monthly bookings:', error);
      // We don't set the error state here to avoid overriding bus fetch errors
    }
  };
  
  // Effect to fetch data when date range or view mode changes
  useEffect(() => {
    fetchBuses();
  }, [currentDate, viewMode]);
  
  // Generate days for the current view
  const getDaysInView = () => {
    const { start, end } = getDateRange();
    const days = [];
    let currentDay = new Date(start);
    
    while (currentDay <= end) {
      days.push(new Date(currentDay));
      currentDay = addDays(currentDay, 1);
    }
    
    return days;
  };
  
  // Find buses for a specific date
  const getBusesForDate = (date) => {
    const dateStr = formatDate(date);
    const dayData = buses.find(day => formatDate(new Date(day.date)) === dateStr);
    return dayData ? dayData.buses : [];
  };
  
  // Find bookings for a specific date
  const getBookingsForDate = (date) => {
    const dateStr = formatDate(date);
    const dayData = bookings.find(day => formatDate(new Date(day.date)) === dateStr);
    return dayData ? dayData.bookings : [];
  };
  
  // Render loading spinner
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  
  // Render error message
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      <Card className="mb-4">
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h3 className="mb-0">
                {viewMode === 'week' ? 'Weekly Bus Schedule' : 'Monthly Bus Schedule & Bookings'}
              </h3>
            </Col>
            <Col xs="auto">
              <ButtonGroup className="me-2">
                <Button variant="outline-secondary" onClick={goToPrevious}>
                  <FaArrowLeft />
                </Button>
                <Button variant="outline-primary" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline-secondary" onClick={goToNext}>
                  <FaArrowRight />
                </Button>
              </ButtonGroup>
              <Button 
                variant={viewMode === 'week' ? 'primary' : 'outline-primary'} 
                onClick={toggleViewMode}
                className="me-2"
              >
                <FaCalendarAlt className="me-1" />
                {viewMode === 'week' ? 'Week View' : 'Month View'}
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <h4 className="mb-3">
            {viewMode === 'week' 
              ? `Week of ${formatDisplayDate(getDateRange().start)} to ${formatDisplayDate(getDateRange().end)}`
              : `${format(currentDate, 'MMMM yyyy')}`
            }
          </h4>
          
          <div className="bus-schedule-container">
            {getDaysInView().map((day) => (
              <Card key={formatDate(day)} className="mb-3">
                <Card.Header className={`d-flex justify-content-between align-items-center ${formatDate(day) === formatDate(new Date()) ? 'bg-primary text-white' : ''}`}>
                  <h5 className="mb-0">{format(day, 'EEEE, MMMM d, yyyy')}</h5>
                  <div>
                    <Badge bg="info" className="me-2">
                      <FaBus className="me-1" />
                      {getBusesForDate(day).length} Buses
                    </Badge>
                    {viewMode === 'month' && (
                      <Badge bg="success">
                        <FaTicketAlt className="me-1" />
                        {getBookingsForDate(day).length} Bookings
                      </Badge>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  {getBusesForDate(day).length > 0 ? (
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Bus Name</th>
                          <th>Route</th>
                          <th>Departure</th>
                          <th>Arrival</th>
                          <th>Seats</th>
                          <th>Bookings</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getBusesForDate(day).map((bus) => (
                          <tr key={bus._id}>
                            <td>{bus.name}</td>
                            <td>{bus.from} to {bus.to}</td>
                            <td>{bus.departureTime}</td>
                            <td>{bus.arrivalTime}</td>
                            <td>
                              {bus.availableSeatsCount} / {bus.totalSeats}
                            </td>
                            <td>{bus.bookingsCount}</td>
                            <td>
                              <Badge bg={bus.availableSeatsCount === 0 ? 'danger' : bus.availableSeatsCount < 5 ? 'warning' : 'success'}>
                                {bus.availableSeatsCount === 0 ? 'Full' : bus.availableSeatsCount < 5 ? 'Filling Fast' : 'Available'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">No buses scheduled for this day.</Alert>
                  )}
                  
                  {viewMode === 'month' && getBookingsForDate(day).length > 0 && (
                    <div className="mt-3">
                      <h5>Bookings</h5>
                      <Table responsive striped hover>
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Bus</th>
                            <th>Route</th>
                            <th>Seats</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getBookingsForDate(day).map((booking) => (
                            <tr key={booking._id}>
                              <td>{booking.user?.name || 'N/A'}</td>
                              <td>{booking.bus?.name || 'N/A'}</td>
                              <td>{booking.bus?.from} to {booking.bus?.to}</td>
                              <td>{booking.seatsBooked.join(', ')}</td>
                              <td>₹{booking.totalAmount}</td>
                              <td>
                                <Badge bg={booking.status === 'confirmed' ? 'success' : 'warning'}>
                                  {booking.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BusScheduleView;