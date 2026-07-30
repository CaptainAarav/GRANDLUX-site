import { Routes, Route, NavLink, Link } from 'react-router-dom'
import Home from './pages/Home'
import OurTeam from './pages/OurTeam'
import ActiveFlights from './pages/ActiveFlights'
import GetStarted from './pages/GetStarted'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'
import { useAuth } from './useAuth'
import ProtectedRoute from './ProtectedRoute'
import './App.css'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'

function App() {
    const { user, loading } = useAuth()

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="navbar-logo-title">
                    <img src="/grandlux-logo.png" alt="logo" className="navbar-logo" />
                    <h1 className="navbar-title">GrandLux</h1>
                </Link>
                <div className="navbar-links">
                    <NavLink className="navbar-link" to="/">HOME</NavLink>
                    <NavLink className="navbar-link" to="/team">OUR TEAM</NavLink>
                    <NavLink className="navbar-link" to="/flights">ACTIVE FLIGHTS</NavLink>
                    {!loading && (
                        user
                            ? (
                                <>
                                    <NavLink className="navbar-link" to="/dashboard">DASHBOARD</NavLink>
                                    <button className="getstarted-btn" onClick={() => signOut(auth)}>Log Out</button>
                                </>
                            )
                            : <NavLink className="getstarted-btn" to="/getstarted">Get Started</NavLink>
                    )}
                </div>
            </nav>

            <main className="page-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/team" element={<OurTeam />} />
                    <Route path="/flights" element={<ActiveFlights />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/getstarted" element={<GetStarted />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                </Routes>
            </main>

            <footer className="footer">
                <p className="footer-text">© 2026 GrandLux</p>
            </footer>
        </>
    )
}

export default App