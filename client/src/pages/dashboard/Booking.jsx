import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './Booking.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function createFlightPlan(user, departure, arrival) {
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
	return data
}

function Booking() {
	const { user } = useAuth()
	const [departure, setDeparture] = useState('')
	const [arrival, setArrival] = useState('')
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [creating, setCreating] = useState(false)

	async function handleCreate(e) {
		e.preventDefault()
		setError('')
		setSuccess('')
		setCreating(true)
		try {
			const data = await createFlightPlan(user, departure, arrival)
			setDeparture('')
			setArrival('')
			setSuccess(`Flight plan ${data.departure_icao} → ${data.arrival_icao} created`)
		} catch (err) {
			setError(err.message)
		} finally {
			setCreating(false)
		}
	}

	return (
		<div className='dashboard-wrapper'>
			<h1>Bookings</h1>
			<section className='booking-container'>
				<div className='booking-card'>
					<h2 className='booking-title'>Create Flight Plan</h2>
					<form className='booking-form' onSubmit={handleCreate}>
						<input
							className='booking-input'
							placeholder='Departure ICAO (e.g. EGLL)'
							value={departure}
							onChange={(e) => setDeparture(e.target.value.toUpperCase())}
							maxLength={4}
							required
						/>
						<i className="fa-solid fa-arrow-right booking-arrow"></i>
						<input
							className='booking-input'
							placeholder='Arrival ICAO (e.g. LUXL)'
							value={arrival}
							onChange={(e) => setArrival(e.target.value.toUpperCase())}
							maxLength={4}
							required
						/>
						<button className='booking-btn' type='submit' disabled={creating}>
							{creating ? 'Creating…' : 'Create Plan'}
						</button>
					</form>
					<p className='booking-hint'>Your flight will be available to start in the GrandLux desktop client.</p>
					{error && <p className='booking-error'>{error}</p>}
					{success && <p className='booking-success'>{success}</p>}
				</div>
			</section>
		</div>
	)
}

export default Booking
