import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    bookingId: '',
    amount: '',
    paymentMethod: 'card'
  });

  // Fetch all payments
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.PAYMENT_SERVICE}/payments`);
      if (response.data.success) {
        setPayments(response.data.data);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch payments. Please check your API endpoint.');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings for dropdown
  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.BOOKING_SERVICE}/bookings`);
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchBookings();
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
        `${API_ENDPOINTS.PAYMENT_SERVICE}/payments`,
        formData
      );
      
      if (response.data.success) {
        setPayments([...payments, response.data.data]);
        setFormData({
          bookingId: '',
          amount: '',
          paymentMethod: 'card'
        });
        setShowForm(false);
        setError(null);
        alert('Payment created! Click "Process Payment" to complete the transaction.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment. Please check your API endpoint.');
      console.error('Error creating payment:', err);
    }
  };

  // Process payment
  const handleProcessPayment = async (paymentId) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.PAYMENT_SERVICE}/payments/${paymentId}/process`
      );
      
      if (response.data.success) {
        // Update the payment in the list
        setPayments(payments.map(payment => 
          payment.paymentId === paymentId ? response.data.data : payment
        ));
        
        if (response.data.data.status === 'PAID') {
          alert('Payment processed successfully! ✅');
        } else {
          alert('Payment processing failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Failed to process payment. Please check your API endpoint.');
      console.error('Error processing payment:', err);
    }
  };

  // Get booking info by bookingId
  const getBookingInfo = (bookingId) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    return booking ? `${booking.guestName} (${booking.guestEmail})` : bookingId;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="page-title">Payments</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Payment'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Create New Payment</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Booking</label>
              <select
                name="bookingId"
                value={formData.bookingId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a booking</option>
                {bookings.map(booking => (
                  <option key={booking.bookingId} value={booking.bookingId}>
                    {booking.guestName} - {booking.bookingId.substring(0, 8)}...
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                placeholder="e.g., 150.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                required
              >
                <option value="card">Credit/Debit Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create Payment</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <p>No payments found. Create a payment to get started.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Booking</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.paymentId}>
                  <td>{payment.paymentId.substring(0, 8)}...</td>
                  <td>{getBookingInfo(payment.bookingId)}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>
                    <span className={`status-badge status-${payment.status.toLowerCase()}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td>
                    {payment.status === 'PENDING' && (
                      <button
                        className="btn btn-success"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => handleProcessPayment(payment.paymentId)}
                      >
                        Process Payment
                      </button>
                    )}
                    {payment.status === 'PAID' && (
                      <span style={{ color: '#27ae60' }}>✓ Processed</span>
                    )}
                    {payment.status === 'FAILED' && (
                      <span style={{ color: '#e74c3c' }}>✗ Failed</span>
                    )}
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

export default Payments;

