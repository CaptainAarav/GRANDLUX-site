import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { formatDate, formatDistance, formatDuration } from '../../../lib/format'
import './Flights.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function fetchUpcoming(user) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/flight-plans/mine`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error('Failed to load upcoming flights')
	return res.json()
}

async function fetchRecent(user) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/pilots/me/flights`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error('Failed to load flights')
	return res.json()
}

function Flights() {
	const { user } = useAuth()
	const [upcoming, setUpcoming] = useState([])
	const [recent, setRecent] = useState([])
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!user) return
		let ignore = false
		Promise.all([fetchUpcoming(user), fetchRecent(user)])
			.then(([up, rec]) => {
				if (ignore) return
				setUpcoming(up)
				setRecent(rec)
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
			<h1>Flights</h1>
			{error && <p className='flights-error'>{error}</p>}

			<section className='flights-section'>
				<h2 className='flights-section-title'>Your Upcoming Flights</h2>
				{!error && loading && <p className='flights-empty'>Loading…</p>}
				{!error && !loading && upcoming.length === 0 && (
					<p className='flights-empty'>No upcoming flights. <Link to="/dashboard/booking" className='flights-link'>Create one here</Link>.</p>
				)}
				{!error && !loading && upcoming.length > 0 && (
					<ul className='flights-list'>
						{upcoming.map((plan) => (
							<li key={plan.id} className='flights-item'>
								<span className='flights-route'>{plan.departure_icao} → {plan.arrival_icao}</span>
								<span className='flights-status'>Pending</span>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className='flights-section'>
				<h2 className='flights-section-title'>Recent Flights</h2>
				{!error && loading && <p className='flights-empty'>Loading…</p>}
				{!error && !loading && recent.length === 0 && (
					<p className='flights-empty'>No flights yet. Start flying!</p>
				)}
				{!error && !loading && recent.length > 0 && (
					<div className='flights-table-container'>
						<table className='flights-table'>
							<thead>
								<tr>
									<th>Date</th>
									<th>Route</th>
									<th>Distance</th>
									<th>Duration</th>
								</tr>
							</thead>
							<tbody>
								{recent.map((flight) => (
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

export default Flights
