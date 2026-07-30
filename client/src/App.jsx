import { useState } from 'react'
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import OurTeam from './pages/OurTeam'
import OurFleet from './pages/OurFleet'
import ActiveFlights from './pages/ActiveFlights'
import GetStarted from './pages/GetStarted'
import Login from './pages/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Profile from './pages/dashboard/Profile'
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
    const [menuOpen, setMenuOpen] = useState(false)
    const closeMenu = () => setMenuOpen(false)

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
                            <NavLink className="navbar-link" to="/dashboard" onClick={closeMenu}>DASHBOARD</NavLink>
                            <NavLink className="navbar-link" to="/dashboard/profile" onClick={closeMenu}>MY PROFILE</NavLink>
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
                                    : <NavLink className="getstarted-btn" to="/getstarted" onClick={closeMenu}>Join Now</NavLink>
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
                    <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
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