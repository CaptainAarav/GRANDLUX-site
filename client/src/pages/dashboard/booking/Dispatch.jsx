import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { matchingAircraft } from '../../../lib/aircraft'
import { haversineNM, estimateHours } from '../../../lib/map'
import { generateSimBrief } from '../../../lib/simbrief'
import '../Booking.css'
import './Dispatch.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const HUB = { icao: 'ELLX', name: 'Luxembourg (Hub)', lat: 49.6233, lon: 6.2044 }

const AIRCRAFT_NAMES = {
	'A320 CEO': 'Airbus A320-200',
	A32N: 'Airbus A320neo',
	'A21N LR': 'Airbus A321neo (LR)',
	'A21N NEO': 'Airbus A321neo',
	B738: 'Boeing 737-800',
	B38M: 'Boeing 737-8',
}

const CALLSIGN_RE = /^[A-Z0-9]{3,8}$/
const FLIGHT_NUMBER_RE = /^[A-Z0-9]{1,4}$/

function defaultSchedule() {
	const now = new Date()
	const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1, 0, 0))
	const pad = (n) => String(n).padStart(2, '0')
	return {
		date: d.toISOString().slice(0, 10),
		time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
	}
}

// The callsign is GLX + a flight-number suffix (2 digits + 1 letter, e.g.
// "11A", or 1 digit + 2 letters, e.g. "1AA"). If the flight number is the
// callsign suffix, the airline prefix is whatever precedes it (GLX).

async function authedGet(user, path) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error(`Failed to load ${path}`)
	return res.json()
}

async function createPlan(user, { departure, arrival, callsign, flightNumber }) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/flight-plans`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify({
			departure_icao: departure,
			arrival_icao: arrival,
			callsign,
			flight_number: flightNumber,
		}),
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.error || 'Failed to create flight plan')
	return data
}

async function dispatchPlan(user, planId, fleetId, callsign, flightNumber, dispatchParams) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/flight-plans/${planId}/dispatch`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify({ fleet_id: fleetId, callsign, flight_number: flightNumber, dispatch_params: dispatchParams }),
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.error || 'Dispatch failed')
	return data
}

function ToggleRow({ label, hint, checked, onChange }) {
	return (
		<label className='dispatch-toggle-row'>
			<input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} />
			<span>
				<strong>{label}</strong>
				{hint && <p className='dispatch-hint'>{hint}</p>}
			</span>
		</label>
	)
}

function Field({ label, children }) {
	return (
		<label className='dispatch-field'>
			<span className='dispatch-field-label'>{label}</span>
			{children}
		</label>
	)
}

// Collapsible section. Sections start minimized unless defaultOpen is set;
// click the header to expand or collapse the body.
function DispatchSection({ title, defaultOpen = false, children }) {
	const [open, setOpen] = useState(defaultOpen)
	return (
		<section className={`dispatch-section${open ? ' dispatch-section--open' : ''}`}>
			<button
				type='button'
				className='dispatch-section-header'
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
			>
				<h2 className='dispatch-section-title'>{title}</h2>
				<i
					className={`fa-solid fa-chevron-down dispatch-section-chevron${open ? ' dispatch-section-chevron--open' : ''}`}
					aria-hidden='true'
				></i>
			</button>
			{open && <div className='dispatch-section-body'>{children}</div>}
		</section>
	)
}

// Custom dropdown for the aircraft picker: our own trigger + menu with
// priority and fallback optgroups, instead of a native <select>.
function AircraftDropdown({ selected, priorityAircraft, fallbackAircraft, onSelect }) {
	const [open, setOpen] = useState(false)
	const ref = useRef(null)

	useEffect(() => {
		if (!open) return
		function handleClickOutside(event) {
			if (ref.current && !ref.current.contains(event.target)) setOpen(false)
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [open])

	const showFallback = priorityAircraft.length === 0 && fallbackAircraft.length > 0

	return (
		<div className='dispatch-dropdown' ref={ref}>
			<button type='button' className='dispatch-dropdown-trigger' onClick={() => setOpen((o) => !o)}>
				{selected ? (
					<>
						<span className='dispatch-dropdown-reg'>{selected.registration}</span>
						<span className='dispatch-dropdown-type'>{AIRCRAFT_NAMES[selected.aircraft_type] || selected.aircraft_type}</span>
					</>
				) : (
					<span className='dispatch-dropdown-placeholder'>Select aircraft…</span>
				)}
				<i
					className={`fa-solid fa-chevron-down dispatch-dropdown-chevron${open ? ' dispatch-dropdown-chevron--open' : ''}`}
					aria-hidden='true'
				></i>
			</button>
			{open && (
				<div className='dispatch-dropdown-menu'>
					{priorityAircraft.length > 0 && (
						<div className='dispatch-dropdown-group'>
							<p className='dispatch-dropdown-group-label'>Priority aircraft</p>
							{priorityAircraft.map((a) => (
								<button
									key={a.id}
									type='button'
									className={`dispatch-dropdown-option${selected && selected.id === a.id ? ' dispatch-dropdown-option--selected' : ''}`}
									onClick={() => {
										onSelect(a.id)
										setOpen(false)
									}}
								>
									<span className='dispatch-dropdown-option-reg'>{a.registration}</span>
									<span className='dispatch-dropdown-option-type'>{AIRCRAFT_NAMES[a.aircraft_type] || a.aircraft_type}</span>
								</button>
							))}
						</div>
					)}
					{showFallback && (
						<div className='dispatch-dropdown-group'>
							<p className='dispatch-dropdown-group-label'>Other available aircraft</p>
							{fallbackAircraft.map((a) => (
								<button
									key={a.id}
									type='button'
									className={`dispatch-dropdown-option${selected && selected.id === a.id ? ' dispatch-dropdown-option--selected' : ''}`}
									onClick={() => {
										onSelect(a.id)
										setOpen(false)
									}}
								>
									<span className='dispatch-dropdown-option-reg'>{a.registration}</span>
									<span className='dispatch-dropdown-option-type'>{AIRCRAFT_NAMES[a.aircraft_type] || a.aircraft_type}</span>
								</button>
							))}
						</div>
					)}
					{priorityAircraft.length === 0 && fallbackAircraft.length === 0 && (
						<p className='dispatch-dropdown-empty'>No aircraft are currently available for this route.</p>
					)}
				</div>
			)}
		</div>
	)
}

function Dispatch() {
	const { user } = useAuth()
	const { icao } = useParams()
	const planIdRef = useRef(null)
	const debounceRef = useRef(null)

	const arrivalIcao = String(icao || '').toUpperCase()

	const [destinations, setDestinations] = useState([])
	const [fleet, setFleet] = useState([])
	const [me, setMe] = useState(null)
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState('')

	const [selectedFleetId, setSelectedFleetId] = useState(null)
	const [callsign, setCallsign] = useState('')
	const [callsignStatus, setCallsignStatus] = useState('idle')
	const [flightNumber, setFlightNumber] = useState('')

	const schedule = useMemo(() => defaultSchedule(), [])
	const [date, setDate] = useState(schedule.date)
	const [time, setTime] = useState(schedule.time)
	const [costIndex, setCostIndex] = useState(6)
	const [cruiseFl, setCruiseFl] = useState('')

	const [coPilot, setCoPilot] = useState('Solo')

	const [pax, setPax] = useState('')
	const [bags, setBags] = useState('')
	const [fuel, setFuel] = useState('')
	const [alternates, setAlternates] = useState('')

	const [simOptions, setSimOptions] = useState({
		navlog: true,
		etops: false,
		stepclimbs: true,
		tlr: true,
		notams: false,
		firnot: false,
	})

	const [dispatching, setDispatching] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (!user) return
		let ignore = false
		Promise.all([
			authedGet(user, '/api/destinations'),
			authedGet(user, '/api/fleet'),
			authedGet(user, '/api/pilots/me'),
			authedGet(user, '/api/flight-plans/next-callsign'),
		])
			.then(([ds, ft, meData, next]) => {
				if (ignore) return
				setDestinations(ds)
				setFleet(ft)
				setMe(meData)
				setCallsign(next.callsign)
				setFlightNumber(next.flight_number || '')
				setCallsignStatus('available')
				setLoading(false)
			})
			.catch((err) => {
				if (ignore) return
				setLoadError(err.message)
				setLoading(false)
			})
		return () => {
			ignore = true
		}
	}, [user])

	const departure = useMemo(() => {
		const location = (me && me.current_location_icao) || HUB.icao
		if (location === HUB.icao) return HUB
		const dest = destinations.find((d) => d.icao === location)
		return dest || HUB
	}, [me, destinations])

	const arrival = useMemo(() => {
		if (arrivalIcao === HUB.icao) return HUB
		return destinations.find((d) => d.icao === arrivalIcao) || null
	}, [arrivalIcao, destinations])

	const routeValid = arrival && departure.icao !== arrival.icao

	const distanceNM = useMemo(() => {
		if (!routeValid) return 0
		return haversineNM(departure.lat, departure.lon, arrival.lat, arrival.lon)
	}, [routeValid, departure, arrival])

	const eteHours = routeValid ? estimateHours(distanceNM) : null

	const matching = useMemo(
		() => (routeValid ? matchingAircraft(fleet, destinations, departure.icao, arrival.icao) : []),
		[routeValid, fleet, destinations, departure, arrival],
	)
	const priorityAircraft = useMemo(() => matching.filter((a) => !a.in_use), [matching])
	const priorityIds = useMemo(() => new Set(matching.map((a) => a.id)), [matching])
	const fallbackAircraft = useMemo(
		() => fleet.filter((a) => !a.in_use && !priorityIds.has(a.id)),
		[fleet, priorityIds],
	)

	const selectedAircraft = selectedFleetId
		? fleet.find((a) => a.id === selectedFleetId)
		: null

	const handleCallsignChange = useCallback(
		(value) => {
			const next = value.toUpperCase()
			setCallsign(next)
			if (debounceRef.current) clearTimeout(debounceRef.current)
			if (!next) {
				setCallsignStatus('idle')
				return
			}
			if (!CALLSIGN_RE.test(next)) {
				setCallsignStatus('taken')
				return
			}
			setCallsignStatus('checking')
			debounceRef.current = setTimeout(async () => {
				try {
					const data = await authedGet(user, `/api/flight-plans/check-callsign?callsign=${encodeURIComponent(next)}`)
					setCallsignStatus(data.available ? 'available' : 'taken')
				} catch {
					setCallsignStatus('idle')
				}
			}, 400)
		},
		[user],
	)

	const handleAircraftSelect = useCallback((id) => {
		setSelectedFleetId((prev) => (prev === id ? null : id))
	}, [])

	const flightNumberOk = !flightNumber || FLIGHT_NUMBER_RE.test(flightNumber)
	const callsignOk = Boolean(callsign) && callsignStatus === 'available'
	const canCreate = routeValid && Boolean(selectedAircraft) && callsignOk && flightNumberOk && !dispatching

	async function ensurePlan() {
		if (planIdRef.current) return planIdRef.current
		const plan = await createPlan(user, {
			departure: departure.icao,
			arrival: arrival.icao,
			callsign,
			flightNumber,
		})
		planIdRef.current = plan.id
		return plan.id
	}

	async function handleCreateBooking() {
		if (!canCreate) return
		setDispatching(true)
		setError('')
		try {
			const planId = await ensurePlan()
			const dispatchParams = {
				date,
				time,
				ete_hours: eteHours != null ? Number(eteHours.toFixed(2)) : null,
				cost_index: costIndex != null ? Number(costIndex) : null,
				cruise_fl: cruiseFl,
				pax: pax ? Number(pax) : null,
				bags: bags ? Number(bags) : null,
				fuel: fuel ? Number(fuel) : null,
				alternates: alternates.trim(),
				options: { ...simOptions },
			}
			await dispatchPlan(user, planId, selectedFleetId, callsign, flightNumber, dispatchParams)
			if (selectedAircraft) {
				try {
					await generateSimBrief(user, planId, {
						registration: selectedAircraft.registration,
						aircraftType: selectedAircraft.aircraft_type,
						orig: departure.icao,
						dest: arrival.icao,
						callsign,
						flightNumber,
						date,
						time,
						eteHours,
						costIndex,
						cruiseFl,
						pax: pax ? Number(pax) : null,
						bags: bags ? Number(bags) : null,
						fuel: fuel ? Number(fuel) : null,
						alternates: alternates.trim(),
						options: simOptions,
					})
				} catch (err) {
					setError(`Booking created, but SimBrief could not start: ${err.message}`)
				}
			}
			window.location.assign(`/dashboard/booking/flight/${planId}`)
		} catch (err) {
			setError(err.message)
		} finally {
			setDispatching(false)
		}
	}

	if (!user) return null

	if (loading) {
		return (
			<div className='dashboard-wrapper'>
				<div className='dispatch-section'>
					<p className='dispatch-loading'>Loading…</p>
				</div>
			</div>
		)
	}
	if (loadError) {
		return (
			<div className='dashboard-wrapper'>
				<div className='dispatch-section'>
					<p className='dispatch-error'>{loadError}</p>
				</div>
			</div>
		)
	}
	if (!routeValid) {
		return (
			<div className='dashboard-wrapper'>
				<div className='dispatch-section'>
					<p className='dispatch-error'>
						{arrival ? 'You are already at this destination.' : 'Destination is outside the network.'}
					</p>
				</div>
			</div>
		)
	}

	const eteLabel = eteHours != null
		? `${Math.floor(eteHours)}:${String(Math.round((eteHours - Math.floor(eteHours)) * 60)).padStart(2, '0')}`
		: '—'

	return (
		<div className='dashboard-wrapper'>
			<header className='dispatch-header'>
				<div className='dispatch-header-main'>
					<p className='dispatch-ready'>
						<i className='fa-solid fa-circle-check' aria-hidden='true'></i>
						Ready to Dispatch
					</p>
					<h1 className='dispatch-route'>{departure.icao} → {arrival.icao}</h1>
					<p className='dispatch-route-meta'>
						{Math.round(distanceNM).toLocaleString('en-US')} nm
						{' · '}ETE {eteLabel}
						{' · '}Scheduled {date} {time}Z
						{' · '}Operator GrandLux
					</p>
				</div>
				<div className='dispatch-summary-grid'>
					<div className='dispatch-summary-item'>
						<span className='dispatch-summary-label'>Aircraft</span>
						<span className='dispatch-summary-value'>
							{selectedAircraft ? `${selectedAircraft.registration} · ${selectedAircraft.aircraft_type}` : '—'}
						</span>
					</div>
					<div className='dispatch-summary-item'>
						<span className='dispatch-summary-label'>Callsign</span>
						<span className='dispatch-summary-value'>
							{callsign || '—'}{flightNumber ? ` / ${flightNumber}` : ''}
						</span>
					</div>
					<div className='dispatch-summary-item'>
						<span className='dispatch-summary-label'>Co-pilot</span>
						<span className='dispatch-summary-value'>{coPilot}</span>
					</div>
					<div className='dispatch-summary-item'>
						<span className='dispatch-summary-label'>Passengers</span>
						<span className='dispatch-summary-value'>{pax || '—'}</span>
					</div>
				</div>
				<button className='dispatch-btn dispatch-btn--dispatch' onClick={handleCreateBooking} disabled={!canCreate}>
					{dispatching ? 'Dispatching flight…' : 'Dispatch Flight'}
				</button>
				{error && <p className='dispatch-error'>{error}</p>}
			</header>

			<div className='dispatch-stack'>
				<DispatchSection title='Aircraft' defaultOpen>
					<AircraftDropdown
						selected={selectedAircraft}
						priorityAircraft={priorityAircraft}
						fallbackAircraft={fallbackAircraft}
						onSelect={handleAircraftSelect}
					/>
				</DispatchSection>

				<DispatchSection title='Callsign & Flight Number' defaultOpen>
					<div className='dispatch-field-grid'>
						<Field label='Callsign'>
							<input
								className={`dispatch-input ${callsignStatus === 'taken' ? 'dispatch-input--error' : ''}`}
								value={callsign}
								onChange={(e) => handleCallsignChange(e.target.value)}
								maxLength={8}
								placeholder='GLX1'
							/>
							{callsignStatus === 'available' && (
								<span className='dispatch-status dispatch-status--ok'>
									<i className='fa-solid fa-check' aria-hidden='true'></i> Available
								</span>
							)}
							{callsignStatus === 'taken' && (
								<span className='dispatch-status dispatch-status--error'>
									<i className='fa-solid fa-x' aria-hidden='true'></i> Already in use
								</span>
							)}
						</Field>
						<Field label='Flight number'>
							<input
								className={`dispatch-input ${!flightNumberOk ? 'dispatch-input--error' : ''}`}
								value={flightNumber}
								onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
								maxLength={4}
								placeholder='1'
							/>
							{!flightNumberOk && (
								<span className='dispatch-status dispatch-status--error'>
									<i className='fa-solid fa-x' aria-hidden='true'></i> 1-4 letters/digits
								</span>
							)}
						</Field>
					</div>
				</DispatchSection>

				<DispatchSection title='Schedule & Route'>
					<div className='dispatch-field-grid'>
						<Field label='Date (UTC)'>
							<input className='dispatch-input' type='date' value={date} onChange={(e) => setDate(e.target.value)} />
						</Field>
						<Field label='Departure time (UTC)'>
							<input className='dispatch-input' type='time' value={time} onChange={(e) => setTime(e.target.value)} />
						</Field>
						<Field label='Cost index'>
							<input
								className='dispatch-input'
								type='number'
								min='0'
								value={costIndex}
								onChange={(e) => setCostIndex(Number(e.target.value))}
							/>
						</Field>
						<Field label='Cruise FL'>
							<input
								className='dispatch-input'
								type='text'
								value={cruiseFl}
								onChange={(e) => setCruiseFl(e.target.value)}
								placeholder='Auto'
							/>
						</Field>
					</div>
					<p className='dispatch-hint'>SimBrief will generate the route if one is not provided.</p>
				</DispatchSection>

				<DispatchSection title='Payload'>
					<div className='dispatch-field-grid'>
						<Field label='Passengers'>
							<input
								className='dispatch-input'
								type='number'
								min='0'
								value={pax}
								onChange={(e) => setPax(e.target.value)}
								placeholder='197'
							/>
						</Field>
						<Field label='Bags'>
							<input
								className='dispatch-input'
								type='number'
								min='0'
								value={bags}
								onChange={(e) => setBags(e.target.value)}
								placeholder='58'
							/>
						</Field>
					</div>
					<p className='dispatch-hint'>ZFW is computed by SimBrief when the OFP is generated.</p>
				</DispatchSection>

				<DispatchSection title='Co-pilot'>
					<select className='dispatch-input dispatch-select' value={coPilot} onChange={(e) => setCoPilot(e.target.value)}>
						<option value='Solo'>Solo</option>
						<option value='None'>None</option>
					</select>
					<p className='dispatch-hint'>Co-pilot mode for this flight.</p>
				</DispatchSection>

				<DispatchSection title='Fuel & Weight'>
					<div className='dispatch-field-grid'>
						<Field label='Block fuel (kg)'>
							<input
								className='dispatch-input'
								type='number'
								min='0'
								value={fuel}
								onChange={(e) => setFuel(e.target.value)}
								placeholder='Auto'
							/>
						</Field>
					</div>
					<p className='dispatch-hint'>TOW / LDW are computed by SimBrief when the OFP is generated.</p>
				</DispatchSection>

				<DispatchSection title='SimBrief Settings'>
					<label className='dispatch-field-label'>Alternates</label>
					<input
						className='dispatch-input'
						type='text'
						value={alternates}
						onChange={(e) => setAlternates(e.target.value)}
						placeholder='LICT, LICC, LICA'
					/>
					<div className='dispatch-toggle-list'>
						<ToggleRow label='Detailed navlog' checked={simOptions.navlog} onChange={(v) => setSimOptions((s) => ({ ...s, navlog: v }))} />
						<ToggleRow label='ETOPS planning' checked={simOptions.etops} onChange={(v) => setSimOptions((s) => ({ ...s, etops: v }))} />
						<ToggleRow label='Plan stepclimbs' checked={simOptions.stepclimbs} onChange={(v) => setSimOptions((s) => ({ ...s, stepclimbs: v }))} />
						<ToggleRow label='Runway analysis (TLR)' checked={simOptions.tlr} onChange={(v) => setSimOptions((s) => ({ ...s, tlr: v }))} />
						<ToggleRow label='Include NOTAMs' checked={simOptions.notams} onChange={(v) => setSimOptions((s) => ({ ...s, notams: v }))} />
						<ToggleRow label='FIR NOTAMs' checked={simOptions.firnot} onChange={(v) => setSimOptions((s) => ({ ...s, firnot: v }))} />
					</div>
				</DispatchSection>
			</div>
		</div>
	)
}

export default Dispatch
