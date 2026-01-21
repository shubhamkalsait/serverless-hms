import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>🏨 Hotel Management System</h1>
        </header>
        <nav className="nav">
          <NavLink to="/rooms" className={({ isActive }) => isActive ? 'active' : ''}>
            Rooms
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => isActive ? 'active' : ''}>
            Bookings
          </NavLink>
          <NavLink to="/payments" className={({ isActive }) => isActive ? 'active' : ''}>
            Payments
          </NavLink>
        </nav>
        <main className="container">
          <Routes>
            <Route path="/" element={<Rooms />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/payments" element={<Payments />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

