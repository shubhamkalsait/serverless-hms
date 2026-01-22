import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import './App.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">Welcome to HotelKeys</h1>
        <p className="hero-subtitle">Your Complete Hotel Management Solution</p>
        <p className="hero-description">
          Manage rooms, bookings, and payments all in one place. Streamline your hotel operations 
          with our intuitive and powerful management system.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-number">🏨</div>
            <div className="hero-stat-label">Room Management</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-number">📅</div>
            <div className="hero-stat-label">Easy Bookings</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-number">💳</div>
            <div className="hero-stat-label">Secure Payments</div>
          </div>
        </div>
      </div>
    </section>
  );
};

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <div className="logo-container">
              <img src="/logo.png" alt="Cloudblitz Logo" className="logo" />
              <div className="brand">
                <h1 className="brand-title">HotelKeys</h1>
                <p className="brand-subtitle">Hotel Management System</p>
              </div>
            </div>
          </div>
        </header>
        <nav className="nav">
          <NavLink to="/rooms" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🏨</span>
            <span>Rooms</span>
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📅</span>
            <span>Bookings</span>
          </NavLink>
          <NavLink to="/payments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">💳</span>
            <span>Payments</span>
          </NavLink>
        </nav>
        <main className="container">
          <Routes>
            <Route path="/" element={
              <>
                <HeroSection />
                <Rooms />
              </>
            } />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/payments" element={<Payments />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>Application powered by <strong>Cloudblitz</strong></p>
        </footer>
      </div>
    </Router>
  );
}

export default App;

