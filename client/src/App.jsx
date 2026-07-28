import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import OurTeam from './pages/OurTeam'
import Downloads from './pages/Downloads'
import './App.css'

function App() {
    return (
        <>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/team">Our Team</Link>
                <Link to="/downloads">Downloads</Link>
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