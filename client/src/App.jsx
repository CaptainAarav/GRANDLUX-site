import { Routes, Route, Link } from 'react-router-dom'
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
                    <Link className="navbar-link" to="/">HOME</Link>
                    <Link className="navbar-link" to="/team">OUR TEAM</Link>
                    <Link className="navbar-link" to="/downloads">DOWNLOADS</Link>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/team" element={<OurTeam />} />
                <Route path="/downloads" element={<Downloads />} />
            </Routes>
        </>
    )
}

export default App