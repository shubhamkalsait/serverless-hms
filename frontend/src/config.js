// API Configuration
// These will be set as environment variables when deployed
// Each microservice has its own API Gateway endpoint

const ROOM_SERVICE_URL = process.env.REACT_APP_ROOM_SERVICE_URL || 'http://localhost:3001';
const BOOKING_SERVICE_URL = process.env.REACT_APP_BOOKING_SERVICE_URL || 'http://localhost:3002';
const PAYMENT_SERVICE_URL = process.env.REACT_APP_PAYMENT_SERVICE_URL || 'http://localhost:3003';

export const API_ENDPOINTS = {
  ROOM_SERVICE: ROOM_SERVICE_URL,
  BOOKING_SERVICE: BOOKING_SERVICE_URL,
  PAYMENT_SERVICE: PAYMENT_SERVICE_URL
};

export default API_ENDPOINTS;

