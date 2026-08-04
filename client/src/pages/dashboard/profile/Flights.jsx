import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { formatDate, formatDistance, formatDuration } from '../../../lib/format'
import { matchingAircraft } from '../../../lib/aircraft'
import DispatchPicker from '../../../components/DispatchPicker'
import './Flights.css'
import '../../../components/DispatchPicker.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function authedGet(user, path) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error(`Failed to load ${path}`)
	return res.json()
}

function Flights() {
	const { user } = useAuth()
	const [upcoming, setUpcoming] = useState([])
	const [recent, setRecent] = useState([])
	const [fleet, setFleet] = useState([])
	const [destinations, setDestinations] = useState([])
	const [dispatch, setDispatch] = useState({})
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!user) return
		let ignore = false
		Promise.all([
			authedGet(user, '/api/flight-plans/mine'),
			authedGet(user, '/api/pilots/me/flights'),
			authedGet(user, '/api/fleet'),
			authedGet(user, '/api/destinations'),
		])
			.then(([up, rec, ft, ds]) => {
				if (ignore) return
				setUpcoming(up)
				setRecent(rec)
				setFleet(ft)
				setDestinations(ds)
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

	function handleSelect(planId, registration) {
		setDispatch((prev) => ({
			...prev,
			[planId]: { registration, error: '', sending: false, sent: false },
		}))
	}

	async function handleDispatch(planId, registration) {
		const aircraft = fleet.find((a) => a.registration === registration)
		if (!aircraft) return
		setDispatch((prev) => ({
			...prev,
			[planId]: { registration, error: '', sending: true, sent: false },
		}))
		try {
			const token = await user.getIdToken()
			const res = await fetch(`${API_BASE}/api/flight-plans/${planId}/dispatch`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fleet_id: aircraft.id }),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				setDispatch((prev) => ({
					...prev,
					[planId]: { registration, error: data.error || 'Dispatch failed', sending: false, sent: false },
				}))
				return
			}
			setDispatch((prev) => ({
				...prev,
				[planId]: { registration, error: '', sending: false, sent: true },
			}))
		} catch (err) {
			setDispatch((prev) => ({
				...prev,
				[planId]: { registration, error: err.message, sending: false, sent: false },
			}))
		}
	}

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
								{upcoming.map((plan) => {
									const priority = matchingAircraft(fleet, destinations, plan.departure_icao, plan.arrival_icao)
									const priorityFree = priority.filter((a) => !a.in_use)
									const d = dispatch[plan.id]
									const currentReg = d
										? d.registration
										: priorityFree.length === 1
											? priorityFree[0].registration
											: ''
									return (
										<li key={plan.id} className='flights-item flights-item--plan'>
											<div className='flights-plan-main'>
												<span className='flights-route'>{plan.departure_icao} → {plan.arrival_icao}</span>
												<span className='flights-status'>Pending</span>
											</div>
											{d?.sent ? (
												<div className='dispatch dispatch--sent'>
													<span className='dispatch-sent-badge'>
														<i className='fa-solid fa-check'></i> Dispatched · {d.registration}
													</span>
													<Link className='flights-link' to={`/dashboard/booking/flight/${plan.id}`}>
														View in Your Flights →
													</Link>
												</div>
											) : (
												<div className='dispatch'>
													<div className='dispatch-row'>
														<DispatchPicker
															fleet={fleet}
															destinations={destinations}
															departureIcao={plan.departure_icao}
															arrivalIcao={plan.arrival_icao}
															value={currentReg}
															onChange={(reg) => handleSelect(plan.id, reg)}
															disabled={d?.sending}
														/>
														<button
															className='dispatch-btn'
															onClick={() => handleDispatch(plan.id, currentReg)}
															disabled={!currentReg || d?.sending}
														>
															{d?.sending ? 'Dispatching…' : 'Dispatch'}
														</button>
													</div>
													{d?.error && <p className='dispatch-error'>{d.error}</p>}
												</div>
											)}
										</li>
									)
								})}
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
