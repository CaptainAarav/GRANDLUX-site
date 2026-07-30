import { Routes, Route, NavLink, Link } from 'react-router-dom'
import Home from './pages/Home'
import OurTeam from './pages/OurTeam'
import Downloads from './pages/Downloads'
import GetStarted from './pages/GetStarted'
import Login from './pages/Login'
import './App.css'

function App() {
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
                    <NavLink className="getstarted-btn" to="/getstarted">Get Started</NavLink>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/team" element={<OurTeam />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/login" element={<Login />} />
                <Route path="/getstarted" element={<GetStarted />} />
            </Routes>

            <footer className="footer">
                <p className="footer-text">© 2026 GrandLux</p>
            </footer>
        </>
    )
}

export default App