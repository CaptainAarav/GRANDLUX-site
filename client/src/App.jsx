import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import OurTeam from './pages/OurTeam'
import Downloads from './pages/Downloads'
import './App.css'

function App() {
    return (
        <>
            <nav className="navbar">
                <div className="navbar-logo-title">
                    <img src="/grandlux-logo.png" alt="logo" className="navbar-logo" />
                    <h1 className="navbar-title">GrandLux</h1>
                </div>
                <div className="navbar-links">
                    <NavLink className="navbar-link" to="/">HOME</NavLink>
                    <NavLink className="navbar-link" to="/team">OUR TEAM</NavLink>
                    <NavLink className="navbar-link" to="/downloads">DOWNLOADS</NavLink>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/team" element={<OurTeam />} />
                <Route path="/downloads" element={<Downloads />} />
            </Routes>

            <footer className="footer">
                <p className="footer-text">© 2026 GrandLux</p>
            </footer>
        </>
    )
}

export default App