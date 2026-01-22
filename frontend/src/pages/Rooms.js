import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'standard',
    price: '',
    status: 'available'
  });

  // Fetch all rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.ROOM_SERVICE}/rooms`);
      if (response.data.success) {
        setRooms(response.data.data);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch rooms. Please check your API endpoint.');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        `${API_ENDPOINTS.ROOM_SERVICE}/rooms`,
        formData
      );
      
      if (response.data.success) {
        setRooms([...rooms, response.data.data]);
        setFormData({
          roomNumber: '',
          type: 'standard',
          price: '',
          status: 'available'
        });
        setShowForm(false);
        setError(null);
      }
    } catch (err) {
      setError('Failed to create room. Please check your API endpoint.');
      console.error('Error creating room:', err);
    }
  };

  // Check availability
  const handleCheckAvailability = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_ENDPOINTS.ROOM_SERVICE}/rooms/availability`
      );
      
      if (response.data.success) {
        const availableRooms = response.data.data.availableRooms;
        setRooms(availableRooms);
        alert(`Found ${response.data.data.count} available room(s)`);
      }
      setError(null);
    } catch (err) {
      setError('Failed to check availability. Please check your API endpoint.');
      console.error('Error checking availability:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="page-title">Rooms</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleCheckAvailability}>
            🔍 Check Availability
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Room'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: '#2d3748', fontSize: '1.5rem', fontWeight: '700' }}>✨ Add New Room</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Room Number</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleInputChange}
                required
                placeholder="e.g., 101"
              />
            </div>
            <div className="form-group">
              <label>Room Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="presidential">Presidential</option>
              </select>
            </div>
            <div className="form-group">
              <label>Price per Night ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                placeholder="e.g., 100"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create Room</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <p>No rooms found. Add a room to get started.</p>
        </div>
      ) : (
        <div className="grid">
          {rooms.map(room => (
            <div key={room.roomId} className="card-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.125rem', fontWeight: '700' }}>
                  🏨 Room {room.roomNumber}
                </h3>
                <span className={`status-badge status-${room.status}`}>
                  {room.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ margin: 0, color: '#718096', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.125rem' }}>
                    Type
                  </p>
                  <p style={{ margin: 0, color: '#2d3748', fontSize: '0.875rem', fontWeight: '600', textTransform: 'capitalize' }}>
                    {room.type}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#718096', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.125rem' }}>
                    Price
                  </p>
                  <p style={{ margin: 0, color: '#ff6b35', fontSize: '1.125rem', fontWeight: '700' }}>
                    ${parseFloat(room.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rooms;

