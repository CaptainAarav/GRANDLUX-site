import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { formatHours, formatDistance } from '../../../lib/format'
import './Stats.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function fetchMe(user) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/pilots/me`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error('Failed to load stats')
	return res.json()
}

function Stats() {
	const { user } = useAuth()
	const [stats, setStats] = useState(null)
	const [error, setError] = useState('')

	useEffect(() => {
		if (!user) return
		let ignore = false
		fetchMe(user)
			.then((data) => {
				if (!ignore) setStats(data)
			})
			.catch((err) => {
				if (!ignore) setError(err.message)
			})
		return () => {
			ignore = true
		}
	}, [user])

	const landingRate = stats && stats.average_landing_rate_fpm != null
		? `${Math.round(stats.average_landing_rate_fpm)} fpm`
		: '—'

	return (
		<div className='dashboard-wrapper'>
			<h1>Stats</h1>
			{error && <p className='stats-error'>{error}</p>}
			<section className='stats-grid'>
				<div className='stats-card'>
					<i className="fa-regular fa-clock"></i>
					<div className='stats-card-text'>
						<h3 className='stats-card-title'>Total Flight Hours</h3>
						<p className='stats-card-stat'>{stats ? formatHours(stats.total_hours) : '…'}</p>
						<p className='stats-card-detail'>All time</p>
					</div>
				</div>
				<div className='stats-card'>
					<i className="fa-regular fa-paper-plane"></i>
					<div className='stats-card-text'>
						<h3 className='stats-card-title'>Total Flights</h3>
						<p className='stats-card-stat'>{stats ? stats.total_flights : '…'}</p>
						<p className='stats-card-detail'>All time</p>
					</div>
				</div>
				<div className='stats-card'>
					<i className="fa-regular fa-map"></i>
					<div className='stats-card-text'>
						<h3 className='stats-card-title'>Total Distance</h3>
						<p className='stats-card-stat'>{stats ? formatDistance(stats.total_distance_nm) : '…'}</p>
						<p className='stats-card-detail'>All time</p>
					</div>
				</div>
				<div className='stats-card'>
					<i className="fa-regular fa-flag"></i>
					<div className='stats-card-text'>
						<h3 className='stats-card-title'>Countries Visited</h3>
						<p className='stats-card-stat'>{stats ? stats.total_countries_visited : '…'}</p>
						<p className='stats-card-detail'>All time</p>
					</div>
				</div>
				<div className='stats-card'>
					<i className="fa-solid fa-plane-up"></i>
					<div className='stats-card-text'>
						<h3 className='stats-card-title'>Average Landing Rate</h3>
						<p className='stats-card-stat'>{stats ? landingRate : '…'}</p>
						<p className='stats-card-detail'>Completed flights</p>
					</div>
				</div>
			</section>
		</div>
	)
}

export default Stats
