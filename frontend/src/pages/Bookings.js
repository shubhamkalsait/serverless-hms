import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    roomId: '',
    guestName: '',
    guestEmail: '',
    checkInDate: '',
    checkOutDate: ''
  });

  // Fetch all bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.BOOKING_SERVICE}/bookings`);
      if (response.data.success) {
        setBookings(response.data.data);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch bookings. Please check your API endpoint.');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available rooms for dropdown
  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ROOM_SERVICE}/rooms`);
      if (response.data.success) {
        setRooms(response.data.data.filter(room => room.status === 'available'));
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.BOOKING_SERVICE}/bookings`,
        formData
      );
      
      if (response.data.success) {
        setBookings([...bookings, response.data.data]);
        setFormData({
          roomId: '',
          guestName: '',
          guestEmail: '',
          checkInDate: '',
          checkOutDate: ''
        });
        setShowForm(false);
        setError(null);
        fetchRooms(); // Refresh available rooms
        alert('Booking created successfully! Please complete payment.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking. Please check your API endpoint.');
      console.error('Error creating booking:', err);
    }
  };

  // Get room number by roomId
  const getRoomNumber = (roomId) => {
    const room = rooms.find(r => r.roomId === roomId);
    return room ? room.roomNumber : roomId;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="page-title">Bookings</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Booking'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Create New Booking</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Room</label>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a room</option>
                {rooms.map(room => (
                  <option key={room.roomId} value={room.roomId}>
                    Room {room.roomNumber} - {room.type} (${room.price}/night)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Guest Name</label>
              <input
                type="text"
                name="guestName"
                value={formData.guestName}
                onChange={handleInputChange}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label>Guest Email</label>
              <input
                type="email"
                name="guestEmail"
                value={formData.guestEmail}
                onChange={handleInputChange}
                required
                placeholder="john@example.com"
              />
            </div>
            <div className="form-group">
              <label>Check-in Date</label>
              <input
                type="date"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Check-out Date</label>
              <input
                type="date"
                name="checkOutDate"
                value={formData.checkOutDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Booking</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>No bookings found. Create a booking to get started.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Room</th>
                <th>Guest Name</th>
                <th>Guest Email</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.bookingId}>
                  <td>{booking.bookingId.substring(0, 8)}...</td>
                  <td>{getRoomNumber(booking.roomId)}</td>
                  <td>{booking.guestName}</td>
                  <td>{booking.guestEmail}</td>
                  <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                  <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Bookings;

