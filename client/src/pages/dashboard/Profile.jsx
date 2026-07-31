import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './Profile.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function fetchPendingPlans(user) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/flight-plans/mine`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error('Failed to load flight plans')
	return res.json()
}

function Profile() {
	const { user } = useAuth()
	const [departure, setDeparture] = useState('')
	const [arrival, setArrival] = useState('')
	const [plans, setPlans] = useState([])
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [creating, setCreating] = useState(false)

	useEffect(() => {
		if (!user) return
		let ignore = false
		fetchPendingPlans(user)
			.then((data) => {
				if (!ignore) setPlans(data)
			})
			.catch((err) => {
				if (!ignore) setError(err.message)
			})
		return () => {
			ignore = true
		}
	}, [user])

	async function handleCreate(e) {
		e.preventDefault()
		setError('')
		setSuccess('')
		setCreating(true)
		try {
			const token = await user.getIdToken()
			const res = await fetch(`${API_BASE}/api/flight-plans`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ departure_icao: departure, arrival_icao: arrival }),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || 'Failed to create flight plan')
			setDeparture('')
			setArrival('')
			setSuccess(`Flight plan ${data.departure_icao} → ${data.arrival_icao} created`)
			setPlans(await fetchPendingPlans(user))
		} catch (err) {
			setError(err.message)
		} finally {
			setCreating(false)
		}
	}

	return (
		<div className='dashboard-wrapper'>
			<h1>My Profile</h1>

			<section className='flight-plans-container'>
				<div className='flight-plans-card'>
					<h2 className='flight-plans-title'>Create Flight Plan</h2>
					<form className='flight-plan-form' onSubmit={handleCreate}>
						<input
							className='flight-plan-input'
							placeholder='Departure ICAO (e.g. EGLL)'
							value={departure}
							onChange={(e) => setDeparture(e.target.value.toUpperCase())}
							maxLength={4}
							required
						/>
						<i className="fa-solid fa-arrow-right flight-plan-arrow"></i>
						<input
							className='flight-plan-input'
							placeholder='Arrival ICAO (e.g. LUXL)'
							value={arrival}
							onChange={(e) => setArrival(e.target.value.toUpperCase())}
							maxLength={4}
							required
						/>
						<button className='flight-plan-btn' type='submit' disabled={creating}>
							{creating ? 'Creating…' : 'Create Plan'}
						</button>
					</form>
					{error && <p className='flight-plan-error'>{error}</p>}
					{success && <p className='flight-plan-success'>{success}</p>}
				</div>

				<div className='flight-plans-card'>
					<h2 className='flight-plans-title'>Your Upcoming Flights</h2>
					{plans.length === 0 ? (
						<p className='flight-plans-empty'>No upcoming flights. Create one above.</p>
					) : (
						<ul className='flight-plan-list'>
							{plans.map((plan) => (
								<li key={plan.id} className='flight-plan-item'>
									<span className='flight-plan-route'>{plan.departure_icao} → {plan.arrival_icao}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</div>
	)
}

export default Profile
