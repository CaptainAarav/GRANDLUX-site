import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { formatHours, formatDistance, formatDuration, formatDate } from '../../lib/format'
import './Dashboard.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function fetchMe(user) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/pilots/me`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error('Failed to load profile')
	return res.json()
}

async function fetchMyFlights(user) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/pilots/me/flights`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error('Failed to load flights')
	return res.json()
}

function Dashboard() {
	const { user } = useAuth()
	const [stats, setStats] = useState(null)
	const [flights, setFlights] = useState([])
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!user) return
		let ignore = false
		Promise.all([fetchMe(user), fetchMyFlights(user)])
			.then(([me, flights]) => {
				if (ignore) return
				setStats(me)
				setFlights(flights)
				setLoading(false)
			})
			.catch((err) => {
				if (ignore) return
				setError(err.message)
				setLoading(false)
			})
		return () => {
			ignore = true
		}
	}, [user])

	return (
		<div className='dashboard-wrapper'>
			<img className="dash-plane dash-plane-737" src="/liverys/grandlux-737-livery.png" alt="" />
			<img className="dash-plane dash-plane-a320" src="/liverys/a320-grandlux-livery.png" alt="" />

			<section className="profile-info-container">
				<img className='user-pfp' src="/default-pfp.jpg" />
				<div className='profile-text-container'>
					<h2 className='welcome-message'>Welcome back,</h2>
					<h1 className='user-name'>Aarav Sahni</h1>
					<div className='badge-container'>
						<div className='badge-text-container'>
							<p className='rank-title'>Rank</p>
							<h3 className='user-rank'>First Officer</h3>
						</div>
						<img className='user-badge' src="/pilot_badges/first_officer.png" />
					</div>
				</div>
			</section>

			<section className='dashboard-container'>

				<div className='stat-card'>
					<i className="fa-regular fa-clock"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Total Flight Hours</h3>
						<p className='stat-card-stat'>{loading || !stats ? '…' : formatHours(stats.total_hours)}</p>
						<p className='stat-card-detail'>All time</p>
					</div>
				</div>
				<div className='stat-card'>
					<i className="fa-regular fa-paper-plane"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Total Flights</h3>
						<p className='stat-card-stat'>{loading || !stats ? '…' : stats.total_flights}</p>
						<p className='stat-card-detail'>All time</p>
					</div>
				</div>
				<div className='stat-card'>
					<i className="fa-regular fa-map"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Total Distance</h3>
						<p className='stat-card-stat'>{loading || !stats ? '…' : formatDistance(stats.total_distance_nm)}</p>
						<p className='stat-card-detail'>All time</p>
					</div>
				</div>
				<div className='stat-card'>
					<i className="fa-regular fa-star"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Total Points</h3>
						<p className='stat-card-stat'>Coming soon</p>
						<p className='stat-card-detail'>All time</p>
					</div>
				</div>
				<div className='stat-card'>
					<i className="fa-regular fa-flag"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Countries Visited</h3>
						<p className='stat-card-stat'>{loading || !stats ? '…' : stats.total_countries_visited}</p>
						<p className='stat-card-detail'>All time</p>
					</div>
				</div>

			</section>

			<section className='dashboard-container'>
				<Link to="/dashboard/booking" className='dashboard-btn'>
					<i className="fa-regular fa-paper-plane"></i>
					<div className='btn-card-text-container'>
						<h3 className='btn-card-title'>Make a Booking</h3>
						<p className='btn-card-subtitle'>Create a new booking</p>
					</div>
				</Link>
				<Link to="/dashboard/profile/flights" className='dashboard-btn'>
					<i className="fa-regular fa-calendar"></i>
					<div className='btn-card-text-container'>
						<h3 className='btn-card-title'>Your Flights</h3>
						<p className='btn-card-subtitle'>View your upcoming and past flights</p>
					</div>
				</Link>
				<Link to="/dashboard/notams" className='dashboard-btn'>
					<i className="fa-solid fa-exclamation"></i>
					<div className='btn-card-text-container'>
						<h3 className='btn-card-title'>NOTAMs</h3>
						<p className='btn-card-subtitle'>View latest operational NOTAMS</p>
					</div>
				</Link>
				<Link to="/dashboard/documents" className='dashboard-btn'>
					<i className="fa-regular fa-file"></i>
					<div className='btn-card-text-container'>
						<h3 className='btn-card-title'>Documents</h3>
						<p className='btn-card-subtitle'>Learn how to operate GrandLux Aircraft</p>
					</div>
				</Link>
			</section>

			<section className='recent-flights-container'>
				<div className='recent-flights-header'>
					<h2 className='recent-flights-title'>Recent flights</h2>
					<Link to="/flights" className='view-all-flights-btn'>
						View All Flights <i className="fa-solid fa-arrow-right"></i>
					</Link>
				</div>
				{error && <p className='recent-flights-error'>{error}</p>}
				{!error && loading && <p className='recent-flights-empty'>Loading…</p>}
				{!error && !loading && flights.length === 0 && (
					<p className='recent-flights-empty'>No flights yet. Create a booking and start flying!</p>
				)}
				{!error && !loading && flights.length > 0 && (
					<div className='recent-flights-table-container'>
						<table className='recent-flights-table'>
							<thead>
								<tr>
									<th>Date</th>
									<th>Route</th>
									<th>Distance</th>
									<th>Duration</th>
								</tr>
							</thead>
							<tbody>
								{flights.map((flight) => (
									<tr key={flight.id}>
										<td>{formatDate(flight.started_at)}</td>
										<td>{flight.departure_icao} → {flight.arrival_icao}</td>
										<td>{formatDistance(flight.distance_nm)}</td>
										<td>{formatDuration(flight.started_at, flight.ended_at)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	)
}

export default Dashboard
