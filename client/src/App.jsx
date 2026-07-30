import { Routes, Route, NavLink, Link } from 'react-router-dom'
import Home from './pages/Home'
import OurTeam from './pages/OurTeam'
import Downloads from './pages/Downloads'
import GetStarted from './pages/GetStarted'
import Login from './pages/Login'
import MyAccount from './pages/MyAccount'
import { useAuth } from './authcontext'
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
                    <NavLink className="navbar-link" to="/downloads">DOWNLOADS</NavLink>
                    {!loading && (
                        user
                            ? (
                                <>
                                    <NavLink className="navbar-link" to="/myaccount">MY ACCOUNT</NavLink>
                                    <button className="getstarted-btn" onClick={() => signOut(auth)}>Log Out</button>
                                </>
                            )
                            : <NavLink className="getstarted-btn" to="/getstarted">Get Started</NavLink>
                    )}
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/team" element={<OurTeam />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/login" element={<Login />} />
                <Route path="/getstarted" element={<GetStarted />} />
                <Route path='/myaccount' element={<MyAccount />} />
                <Route path="/myaccount" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
            </Routes>

            <footer className="footer">
                <p className="footer-text">© 2026 GrandLux</p>
            </footer>
        </>
    )
}

export default App