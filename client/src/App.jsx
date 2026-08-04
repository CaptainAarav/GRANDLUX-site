import { useState } from 'react'
import { Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import OurTeam from './pages/OurTeam'
import OurFleet from './pages/OurFleet'
import ActiveFlights from './pages/ActiveFlights'
import GetStarted from './pages/GetStarted'
import Login from './pages/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Booking from './pages/dashboard/Booking'
import Dispatch from './pages/dashboard/booking/Dispatch'
import FlightDetails from './pages/dashboard/booking/FlightDetails'
import ProfileStats from './pages/dashboard/profile/Stats'
import ProfileFlights from './pages/dashboard/profile/Flights'
import ProfilePreferences from './pages/dashboard/profile/Preferences'
import ProfileCustomization from './pages/dashboard/profile/Customization'
import Notams from './pages/dashboard/Notams'
import Documents from './pages/dashboard/Documents'
import Resources from './pages/dashboard/Resources'
import AuthCallback from './pages/AuthCallback'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import { signOut } from 'firebase/auth'
import { auth } from './lib/firebase'

function App() {
    const { user, loading } = useAuth()
    const location = useLocation()
    const isDashboard = location.pathname.startsWith('/dashboard')
    const isProfilePage = location.pathname.startsWith('/dashboard/profile')
    const [menuOpen, setMenuOpen] = useState(false)
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)
    const closeMenu = () => {
        setMenuOpen(false)
        setProfileMenuOpen(false)
    }

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="navbar-logo-title">
                    <img src="/logos/grandlux-logo.png" alt="logo" className="navbar-logo" />
                    <h1 className="navbar-title">GrandLux</h1>
                </Link>
                <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                    <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                </button>
                <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
                    {isDashboard ? (
                        <>
                            <NavLink end className="navbar-link" to="/dashboard" onClick={closeMenu}>DASHBOARD</NavLink>
                            <NavLink className="navbar-link" to="/dashboard/booking" onClick={closeMenu}>BOOKING</NavLink>
                            <div className="nav-dropdown">
                                <button
                                    className={`navbar-link nav-dropdown-toggle${isProfilePage ? ' active' : ''}`}
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    aria-expanded={profileMenuOpen}
                                >
                                    MY PROFILE <i className="fa-solid fa-chevron-down"></i>
                                </button>
                                <div className={`nav-dropdown-menu${profileMenuOpen ? ' open' : ''}`}>
                                    <NavLink className="navbar-link nav-dropdown-item" to="/dashboard/profile/stats" onClick={closeMenu}>Stats</NavLink>
                                    <NavLink className="navbar-link nav-dropdown-item" to="/dashboard/profile/flights" onClick={closeMenu}>Flights</NavLink>
                                    <NavLink className="navbar-link nav-dropdown-item" to="/dashboard/profile/preferences" onClick={closeMenu}>Preferences</NavLink>
                                    <NavLink className="navbar-link nav-dropdown-item" to="/dashboard/profile/customization" onClick={closeMenu}>Profile Customisation</NavLink>
                                </div>
                            </div>
                            <NavLink className="navbar-link" to="/dashboard/notams" onClick={closeMenu}>NOTAMs</NavLink>
                            <NavLink className="navbar-link" to="/dashboard/documents" onClick={closeMenu}>DOCUMENTS</NavLink>
                            <NavLink className="navbar-link" to="/dashboard/resources" onClick={closeMenu}>RESOURCES</NavLink>
                            <button className="getstarted-btn" onClick={() => signOut(auth)}>Log Out</button>
                        </>
                    ) : (
                        <>
                            <NavLink className="navbar-link" to="/" onClick={closeMenu}>HOME</NavLink>
                            <NavLink className="navbar-link" to="/team" onClick={closeMenu}>OUR TEAM</NavLink>
                            <NavLink className="navbar-link" to="/fleet" onClick={closeMenu}>OUR FLEET</NavLink>
                            <NavLink className="navbar-link" to="/flights" onClick={closeMenu}>ACTIVE FLIGHTS</NavLink>
                            {!loading && (
                                user
                                    ? (
                                        <>
                                            <NavLink className="navbar-link" to="/dashboard" onClick={closeMenu}>DASHBOARD</NavLink>
                                            <button className="getstarted-btn" onClick={() => signOut(auth)}>Log Out</button>
                                        </>
                                    )
                                    : <NavLink className="getstarted-btn getstarted-btn--flag" to="/getstarted" onClick={closeMenu}>Join Now</NavLink>
                            )}
                        </>
                    )}
                </div>
            </nav>

            <main className="page-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/team" element={<OurTeam />} />
                    <Route path="/fleet" element={<OurFleet />} />
                    <Route path="/flights" element={<ActiveFlights />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/getstarted" element={<GetStarted />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/dashboard/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                    <Route path="/dashboard/booking/dispatch/:icao" element={<ProtectedRoute><Dispatch /></ProtectedRoute>} />
                    <Route path="/dashboard/booking/flight/:id" element={<ProtectedRoute><FlightDetails /></ProtectedRoute>} />
                    <Route path="/dashboard/profile" element={<Navigate to="/dashboard/profile/stats" replace />} />
                    <Route path="/dashboard/profile/stats" element={<ProtectedRoute><ProfileStats /></ProtectedRoute>} />
                    <Route path="/dashboard/profile/flights" element={<ProtectedRoute><ProfileFlights /></ProtectedRoute>} />
                    <Route path="/dashboard/profile/preferences" element={<ProtectedRoute><ProfilePreferences /></ProtectedRoute>} />
                    <Route path="/dashboard/profile/customization" element={<ProtectedRoute><ProfileCustomization /></ProtectedRoute>} />
                    <Route path="/dashboard/notams" element={<ProtectedRoute><Notams /></ProtectedRoute>} />
                    <Route path="/dashboard/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                    <Route path="/dashboard/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
                </Routes>
            </main>

            <footer className="footer">
                <p className="footer-text">© 2026 GrandLux</p>
            </footer>
        </>
    )
}

export default App
