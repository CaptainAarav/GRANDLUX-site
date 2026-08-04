import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth } from '../../../hooks/useAuth'
import { formatDistance, formatDuration, formatHours } from '../../../lib/format'
import { haversineNM, greatCirclePath, makeMarkerIcon, ROUTE_SELECTED, estimateHours } from '../../../lib/map'
import { generateSimBrief } from '../../../lib/simbrief'
import '../Booking.css'
import './FlightDetails.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const HUB = { icao: 'ELLX', name: 'Luxembourg (Hub)', lat: 49.6233, lon: 6.2044 }

const STATUS_LABEL = {
	pending: 'Pending',
	in_progress: 'In Progress',
	flown: 'Flown',
}

async function authedGet(user, path) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error(`Failed to load ${path}`)
	return res.json()
}

async function fetchWeather(user, icao) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/weather/${icao}`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.error || 'Weather unavailable')
	return data
}

function pick(obj, ...paths) {
	for (const path of paths) {
		const value = path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
		if (value != null && value !== '' && value !== '0') return value
	}
	return null
}

function formatUtc(ms) {
	const d = new Date(ms)
	return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

// Modern SimBrief JSON gives times as ISO timestamps (e.g. 2026-08-03T18:20:00Z)
// and older/legacy bodies as "HH:MM" strings. Render both as HH:MMZ.
function formatOfpTime(value) {
	if (value == null) return null
	const ms = Date.parse(value)
	if (!Number.isNaN(ms)) return `${formatUtc(ms)}Z`
	const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(value).trim())
	return match ? `${match[1].padStart(2, '0')}:${match[2]}` : String(value)
}

function asArray(value) {
	if (value == null) return []
	return Array.isArray(value) ? value : [value]
}

function formatCruise(value) {
	if (value == null) return null
	const n = Number(value)
	if (Number.isNaN(n)) return value
	return `FL${Math.round(n / 100)}`
}

function formatCountdown(ms) {
	const total = Math.max(0, ms)
	const days = Math.floor(total / 86400000)
	const hours = Math.floor((total % 86400000) / 3600000)
	const minutes = Math.floor((total % 3600000) / 60000)
	if (days > 0) return `${days}d ${hours}h`
	if (hours > 0) return `${hours}h ${minutes}m`
	return `${minutes}m`
}

function InfoRow({ label, value }) {
	return (
		<div className='vamsys-row'>
			<span className='vamsys-row-label'>{label}</span>
			<span className='vamsys-row-value'>{value == null || value === '' ? '—' : value}</span>
		</div>
	)
}

function InfoCard({ title, subtitle, children }) {
	return (
		<section className='vamsys-card'>
			<header className='vamsys-card-header'>
				<h2 className='vamsys-card-title'>{title}</h2>
				{subtitle && <span className='vamsys-card-subtitle'>{subtitle}</span>}
			</header>
			{children}
		</section>
	)
}

function FlightInformationCard({ plan, destinations, distanceNM, ofp, depWeather, arrWeather, schedMs, staMs, eteLabel }) {
	const depDest = plan.departure_icao === HUB.icao
		? HUB
		: destinations.find((d) => d.icao === plan.departure_icao)
	const arrDest = plan.arrival_icao === HUB.icao
		? HUB
		: destinations.find((d) => d.icao === plan.arrival_icao)
	const depName = pick(ofp, 'origin.name') || depDest?.name || plan.departure_icao
	const arrName = pick(ofp, 'destination.name') || arrDest?.name || plan.arrival_icao
	const etd = formatOfpTime(pick(ofp, 'times.est_off', 'times.sched_off'))
	const eta = formatOfpTime(pick(ofp, 'times.est_on', 'times.sched_on'))
	const duration = eteLabel || pick(ofp, 'times.est_time_enroute', 'times.sched_time_enroute')
	const distance = pick(ofp, 'general.route_distance', 'general.gc_distance')
	return (
		<InfoCard title='Flight Information'>
			<div className='vamsys-fields'>
				<InfoRow label='Callsign' value={plan.callsign || pick(ofp, 'atc.callsign')} />
				<InfoRow label='Flight Number' value={plan.flight_number || pick(ofp, 'general.flight_number')} />
				<InfoRow label='Booking #' value={`#${plan.id}`} />
				<InfoRow label='Route #' value={plan.flight_number || pick(ofp, 'general.flight_number')} />
				<InfoRow label='Departure' value={`${depName} (${plan.departure_icao})`} />
				<InfoRow label='Arrival' value={`${arrName} (${plan.arrival_icao})`} />
				<InfoRow label='STD' value={schedMs ? `${formatUtc(schedMs)}Z` : formatOfpTime(pick(ofp, 'times.sched_off'))} />
				<InfoRow label='STA' value={staMs ? `${formatUtc(staMs)}Z` : formatOfpTime(pick(ofp, 'times.sched_on'))} />
				<InfoRow label='ETD' value={etd} />
				<InfoRow label='ETA' value={eta} />
				<InfoRow label='Duration' value={duration} />
				<InfoRow label='Distance' value={typeof distance === 'number' ? formatDistance(distance) : formatDistance(distanceNM)} />
				<InfoRow
					label={`METAR · ${plan.departure_icao}`}
					value={depWeather.status === 'done' ? depWeather.metar : pick(ofp, 'origin.metar')}
				/>
				<InfoRow
					label={`METAR · ${plan.arrival_icao}`}
					value={arrWeather.status === 'done' ? arrWeather.metar : pick(ofp, 'destination.metar')}
				/>
			</div>
		</InfoCard>
	)
}

function PilotInformationCard({ plan, ofp, dispatchParams }) {
	const units = pick(ofp, 'params.units') || 'kgs'
	const suffix = units === 'lbs' ? 'lbs' : 'kg'
	const costIndex = pick(ofp, 'general.costindex') || dispatchParams?.cost_index
	const cruiseFl = formatCruise(pick(ofp, 'general.initial_altitude')) || dispatchParams?.cruise_fl
	const pax = pick(ofp, 'weights.pax_count') || dispatchParams?.pax
	const bags = pick(ofp, 'weights.bag_count') || dispatchParams?.bags
	const freight = pick(ofp, 'weights.cargo')
	const mass = (value) => (value == null ? null : `${Number(value).toLocaleString('en-US')} ${suffix}`)
	const reg = plan.registration || pick(ofp, 'aircraft.reg')
	const type = plan.aircraft_type || pick(ofp, 'aircraft.icao_code') || pick(ofp, 'aircraft.name')
	return (
		<InfoCard title='Pilot Information'>
			<div className='vamsys-fields'>
				<InfoRow label='Aircraft' value={reg ? `${reg} · ${type}` : type} />
				<InfoRow label='Cost Index' value={costIndex} />
				<InfoRow label='Cruise Flight Level' value={cruiseFl} />
				<InfoRow label='Passengers' value={pax} />
				<InfoRow label='Luggage' value={bags} />
				<InfoRow label='Freight' value={mass(freight)} />
			</div>
		</InfoCard>
	)
}

function RouteCard({ ofp }) {
	const scheduled = pick(ofp, 'general.route', 'atc.route', 'api_params.route')
	const remarks = asArray(pick(ofp, 'general.dx_rmk', 'general.sys_rmk'))
	const elements = asArray(pick(ofp, 'navlog'))
	return (
		<InfoCard title='Route'>
			<div className='vamsys-fields'>
				<InfoRow label='Scheduled' value={scheduled} />
				<InfoRow label='Tracked' value={null} />
				{elements.length > 0 && (
					<InfoRow
						label='Navlog'
						value={elements.map((el) => pick(el, 'ident', 'name') || '·').join(' ')}
					/>
				)}
				<InfoRow label='Remarks' value={remarks.length > 0 ? remarks.join(', ') : null} />
			</div>
		</InfoCard>
	)
}

function GroupTable({ title, rows }) {
	if (!rows || rows.length === 0) return null
	return (
		<div className='vamsys-group'>
			<h3 className='vamsys-group-title'>{title}</h3>
			<table className='vamsys-table'>
				<tbody>
					{rows.map((row) => (
						<tr key={row.label}>
							<th>{row.label}</th>
							<td>{row.value == null || row.value === '' ? '—' : row.value}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function OFPSummaryCard({ ofp }) {
	const units = pick(ofp, 'params.units') || 'kgs'
	const suffix = units === 'lbs' ? 'lbs' : 'kg'
	const depRunway = pick(ofp, 'origin.plan_rwy')
	const arrRunway = pick(ofp, 'destination.plan_rwy')
	const toRwy = pick(ofp, 'tlr.takeoff.runway.0.identifier')
	const ldgRwy = pick(ofp, 'tlr.landing.runway.0.identifier')
	const toFlaps = pick(ofp, 'tlr.takeoff.runway.0.flap_setting')
	const ldgFlaps = pick(ofp, 'tlr.landing.conditions.flap_setting')
	const v1 = pick(ofp, 'tlr.takeoff.runway.0.speeds_v1')
	const v2 = pick(ofp, 'tlr.takeoff.runway.0.speeds_v2')
	const vref = pick(ofp, 'tlr.landing.distance_dry.speeds_vref', 'tlr.landing.distance_wet.speeds_vref')
	const mass = (value) => (value == null ? null : `${Number(value).toLocaleString('en-US')} ${suffix}`)
	const speed = pick(ofp, 'atc.initial_spd', 'params.speed')
	const cruiseAlt = formatCruise(pick(ofp, 'general.initial_altitude'))
	const ete = pick(ofp, 'times.est_time_enroute', 'times.sched_time_enroute')
	const dist = pick(ofp, 'general.route_distance', 'general.gc_distance')
	const toDistance = pick(ofp, 'tlr.takeoff.runway.0.length_tora')
	const ldgDistance = pick(ofp, 'tlr.landing.distance_dry.factored_distance', 'tlr.landing.distance_wet.factored_distance')
	return (
		<InfoCard title='SimBrief OFP Summary'>
			<GroupTable
				title='Runway'
				rows={[
					{ label: 'Departure', value: depRunway || toRwy },
					{ label: 'Arrival', value: arrRunway || ldgRwy },
				]}
			/>
			<GroupTable
				title='TLR'
				rows={[
					{ label: 'Takeoff runway', value: toRwy },
					{ label: 'Takeoff distance', value: toDistance ? `${Number(toDistance).toLocaleString('en-US')} ft` : null },
					{ label: 'Landing runway', value: ldgRwy },
					{ label: 'Landing distance', value: ldgDistance ? `${Number(ldgDistance).toLocaleString('en-US')} ft` : null },
				]}
			/>
			<GroupTable
				title='Performance'
				rows={[
					{ label: 'V1', value: v1 },
					{ label: 'V2', value: v2 },
					{ label: 'Vref', value: vref },
					{ label: 'TO flaps', value: toFlaps },
					{ label: 'LDG flaps', value: ldgFlaps },
				]}
			/>
			<GroupTable
				title='Fuel'
				rows={[
					{ label: 'Taxi', value: mass(pick(ofp, 'fuel.taxi')) },
					{ label: 'Trip', value: mass(pick(ofp, 'fuel.enroute_burn')) },
					{ label: 'Contingency', value: mass(pick(ofp, 'fuel.contingency')) },
					{ label: 'Alternate', value: mass(pick(ofp, 'fuel.alternate_burn')) },
					{ label: 'Reserve', value: mass(pick(ofp, 'fuel.reserve')) },
					{ label: 'Extra', value: mass(pick(ofp, 'fuel.extra')) },
					{ label: 'Block', value: mass(pick(ofp, 'fuel.plan_ramp')) },
					{ label: 'Takeoff', value: mass(pick(ofp, 'fuel.plan_takeoff')) },
					{ label: 'Landing', value: mass(pick(ofp, 'fuel.plan_landing')) },
				]}
			/>
			<GroupTable
				title='Weights'
				rows={[
					{ label: 'ZFW', value: mass(pick(ofp, 'weights.est_zfw')) },
					{ label: 'TOW', value: mass(pick(ofp, 'weights.est_tow')) },
					{ label: 'LDW', value: mass(pick(ofp, 'weights.est_ldw')) },
				]}
			/>
			<GroupTable
				title='Speed / Time / Altitude / Distance'
				rows={[
					{ label: 'Speed', value: speed },
					{ label: 'Time enroute', value: ete },
					{ label: 'Cruise', value: cruiseAlt },
					{ label: 'Distance', value: dist ? `${formatDistance(dist)}` : null },
				]}
			/>
		</InfoCard>
	)
}

function OFPCard({ ofp, pdfUrl, rawOpen, onToggleRaw }) {
	const navigraph = ofp ? 'https://charts.navigraph.com/' : null
	return (
		<InfoCard title='SimBrief OFP'>
			<div className='vamsys-actions-row'>
				{pdfUrl && (
					<a className='vamsys-btn' href={pdfUrl} target='_blank' rel='noreferrer'>
						<i className='fa-solid fa-file-pdf'></i> Open PDF
					</a>
				)}
				<button className='vamsys-btn' disabled title='Coming soon'>
					<i className='fa-solid fa-pen-to-square'></i> Edit
				</button>
				{navigraph && (
					<a className='vamsys-btn' href={navigraph} target='_blank' rel='noreferrer'>
						<i className='fa-solid fa-map-location-dot'></i> Navigraph
					</a>
				)}
				<button className='vamsys-btn' onClick={onToggleRaw}>
					<i className={`fa-solid ${rawOpen ? 'fa-eye-slash' : 'fa-eye'}`}></i> Raw
				</button>
			</div>
			{rawOpen && (
				<pre className='flight-ofp-raw'>{JSON.stringify(ofp, null, 2)}</pre>
			)}
		</InfoCard>
	)
}

function BookingActions({ status, cancelling, callsign, onCancel, onRebook }) {
	const isPending = status === 'pending'
	return (
		<div className='vamsys-sidecard'>
			<h3 className='vamsys-sidecard-title'>Booking actions</h3>
			<div className='flight-actions'>
				<Link className='flight-action' to='/dashboard/booking?new=1'>
					<i className='fa-solid fa-plus flight-action-icon'></i>
					<span>Make additional booking</span>
				</Link>
				<button className='flight-action' disabled title='Coming soon'>
					<i className='fa-solid fa-pen-to-square flight-action-icon'></i>
					<span>Change booking details</span>
				</button>
				<button className='flight-action' disabled title='Coming soon'>
					<i className='fa-solid fa-file-lines flight-action-icon'></i>
					<span>Manual PIREP</span>
				</button>
				<button className='flight-action' disabled title='Coming soon'>
					<i className='fa-solid fa-tower-broadcast flight-action-icon'></i>
					<span>Send to VATSIM</span>
				</button>
				{callsign && (
					<a className='flight-action' href={`https://www.flightradar24.com/${encodeURIComponent(callsign)}`} target='_blank' rel='noreferrer'>
						<i className='fa-solid fa-plane flight-action-icon'></i>
						<span>Flightradar24</span>
					</a>
				)}
				{isPending && (
					<button className='flight-action' onClick={onCancel} disabled={cancelling}>
						<i className='fa-solid fa-ban flight-action-icon'></i>
						<span>{cancelling ? 'Cancelling…' : 'Cancel booking'}</span>
					</button>
				)}
				{isPending && (
					<button className='flight-action' onClick={onRebook} disabled={cancelling}>
						<i className='fa-solid fa-rotate-right flight-action-icon'></i>
						<span>{cancelling ? 'Cancelling…' : 'Cancel & rebook'}</span>
					</button>
				)}
				{!isPending && (
					<p className='flight-actions-note'>A booking can only be cancelled while it is still pending.</p>
				)}
			</div>
		</div>
	)
}

function SimBriefActions({ generating, onGenerate, pdfUrl }) {
	return (
		<div className='vamsys-sidecard'>
			<h3 className='vamsys-sidecard-title'>SimBrief actions</h3>
			<div className='flight-actions'>
				<button className='flight-action' onClick={onGenerate} disabled={generating}>
					<i className='fa-solid fa-wand-magic-sparkles flight-action-icon'></i>
					<span>{generating ? 'Generating…' : 'Generate SimBrief OFP'}</span>
				</button>
				{pdfUrl && (
					<a className='flight-action' href={pdfUrl} target='_blank' rel='noreferrer'>
						<i className='fa-solid fa-file-pdf flight-action-icon'></i>
						<span>Open OFP</span>
					</a>
				)}
				<button className='flight-action' disabled title='Coming soon'>
					<i className='fa-solid fa-pen-to-square flight-action-icon'></i>
					<span>Edit OFP</span>
				</button>
				<a className='flight-action' href='https://charts.navigraph.com/' target='_blank' rel='noreferrer'>
					<i className='fa-solid fa-map-location-dot flight-action-icon'></i>
					<span>Navigraph Charts</span>
				</a>
			</div>
		</div>
	)
}

function CompareCard({ flight, distanceNM, ofp, isComplete }) {
	const units = pick(ofp, 'params.units') || 'kgs'
	const suffix = units === 'lbs' ? 'lbs' : 'kg'
	const landingRate = isComplete && flight.landing_rate_fpm != null
		? `${Math.round(flight.landing_rate_fpm)} fpm`
		: null
	const flightTime = isComplete ? formatDuration(flight.started_at, flight.ended_at) : null
	const ofpEte = pick(ofp, 'times.est_time_enroute', 'times.sched_time_enroute')
	const ofpFuel = pick(ofp, 'fuel.enroute_burn')
	const pax = pick(ofp, 'weights.pax_count')
	const freight = pick(ofp, 'weights.cargo')
	const mass = (value) => (value == null ? null : `${Number(value).toLocaleString('en-US')} ${suffix}`)
	const stats = [
		{ label: 'Landing rate', value: landingRate, hint: isComplete ? null : 'Available once complete' },
		{ label: 'Fuel used', value: mass(ofpFuel), hint: 'OFP estimate — fuel not tracked yet' },
		{ label: 'Flight time', value: flightTime || ofpEte, hint: flightTime ? 'Actual' : 'Planned' },
		{ label: 'Distance', value: isComplete ? formatDistance(flight.distance_nm) : formatDistance(distanceNM), hint: isComplete ? 'Actual' : 'Planned' },
		{ label: 'Points', value: null, hint: 'Coming soon' },
		{ label: 'Passengers', value: pax, hint: null },
		{ label: 'Freight', value: mass(freight), hint: null },
	]
	return (
		<InfoCard title='Compare'>
			<div className='flight-stats'>
				{stats.map((stat) => (
					<div className='flight-stat' key={stat.label}>
						<span className='flight-stat-value'>{stat.value || '—'}</span>
						<span className='flight-stat-label'>{stat.label}</span>
						{stat.hint && <span className='flight-stat-hint'>{stat.hint}</span>}
					</div>
				))}
			</div>
		</InfoCard>
	)
}

function FlightDetails() {
	const { user } = useAuth()
	const { id } = useParams()
	const navigate = useNavigate()
	const mapContainerRef = useRef(null)
	const mapRef = useRef(null)

	const planId = Number(id)
	const validId = Number.isInteger(planId) && planId > 0

	const [details, setDetails] = useState(null)
	const [destinations, setDestinations] = useState([])
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState('')
	const [weather, setWeather] = useState({})
	const [cancelling, setCancelling] = useState(false)
	const [generating, setGenerating] = useState(false)
	const [actionMsg, setActionMsg] = useState('')
	const [rawOpen, setRawOpen] = useState(false)
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(timer)
	}, [])

	const fetchDetails = useCallback(
		async () => authedGet(user, `/api/flight-plans/${planId}`),
		[user, planId],
	)

	useEffect(() => {
		if (!user || !validId) return
		let ignore = false
		Promise.all([fetchDetails(), authedGet(user, '/api/destinations')])
			.then(([det, ds]) => {
				if (ignore) return
				setDetails(det)
				setDestinations(ds)
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
	}, [user, validId, fetchDetails])

	const plan = details?.plan || null
	const hasOFP = Boolean(plan?.simbrief_ofp)
	const pollActive = Boolean(plan && (plan.status === 'pending' || plan.status === 'in_progress'))
	// While the OFP is still generating, keep refreshing until it lands (or a
	// bounded window passes).
	useEffect(() => {
		if (!user || !validId || hasOFP || !pollActive) return
		let attempts = 0
		const timer = setInterval(async () => {
			attempts += 1
			try {
				const det = await fetchDetails()
				setDetails(det)
				if (det.plan.simbrief_ofp || attempts >= 12) clearInterval(timer)
			} catch {
				clearInterval(timer)
			}
		}, 5000)
		return () => clearInterval(timer)
	}, [user, validId, hasOFP, pollActive, fetchDetails])

	const flight = details?.flight || null

	useEffect(() => {
		if (!plan) return
		let ignore = false
		Promise.allSettled([fetchWeather(user, plan.departure_icao), fetchWeather(user, plan.arrival_icao)])
			.then(([dep, arr]) => {
				if (ignore) return
				setWeather({
					[plan.departure_icao]: dep.status === 'fulfilled'
						? { status: 'done', metar: dep.value.metar || null, icing: dep.value.icing || null, turbulence: dep.value.turbulence || null }
						: { status: 'error', metar: null, icing: null, turbulence: null },
					[plan.arrival_icao]: arr.status === 'fulfilled'
						? { status: 'done', metar: arr.value.metar || null, icing: arr.value.icing || null, turbulence: arr.value.turbulence || null }
						: { status: 'error', metar: null, icing: null, turbulence: null },
				})
			})
		return () => {
			ignore = true
		}
	}, [user, plan])

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return
		const map = L.map(mapContainerRef.current, { center: [HUB.lat, HUB.lon], zoom: 3 })
		L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
			maxZoom: 19,
			subdomains: 'abcd',
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		}).addTo(map)
		mapRef.current = map
		requestAnimationFrame(() => map.invalidateSize())
		return () => {
			map.remove()
			mapRef.current = null
		}
	}, [])

	useEffect(() => {
		const map = mapRef.current
		if (!map || !plan) return
		const coordsFor = (icao) => {
			if (icao === HUB.icao) return HUB
			const dest = destinations.find((d) => d.icao === icao)
			return dest || null
		}
		const dep = coordsFor(plan.departure_icao)
		const arr = coordsFor(plan.arrival_icao)
		map.eachLayer((layer) => {
			if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer)
		})
		if (!dep || !arr) return
		// When the OFP is available, trace the actual navlog waypoints instead
		// of a straight great-circle guess.
		const navlog = asArray(plan.simbrief_ofp?.navlog)
			.map((el) => ({
				lat: Number(el.pos_lat),
				lon: Number(el.pos_long),
				ident: el.ident || el.name || '',
				altitude: Number(el.altitude_feet) || 0,
			}))
			.filter((el) => Number.isFinite(el.lat) && Number.isFinite(el.lon) && el.lat !== 0 && el.lon !== 0)
		let bounds
		if (navlog.length >= 2) {
			const line = L.polyline(
				navlog.map((el) => [el.lat, el.lon]),
				{ ...ROUTE_SELECTED, opacity: 0.85 }
			).addTo(map)
			bounds = line.getBounds()
			const icon = L.divIcon({
				className: 'flight-wpt-icon',
				iconSize: [6, 6],
				iconAnchor: [3, 3],
			})
			for (const wpt of navlog) {
				L.marker([wpt.lat, wpt.lon], { icon, interactive: false }).addTo(map)
			}
			for (const [icao, pt] of [[dep.icao, dep], [arr.icao, arr]]) {
				L.marker([pt.lat, pt.lon], { icon: makeMarkerIcon(icao, icao === HUB.icao) }).addTo(map)
			}
		} else {
			const poly = L.polyline(greatCirclePath(dep.lat, dep.lon, arr.lat, arr.lon), ROUTE_SELECTED).addTo(map)
			bounds = poly.getBounds()
			L.marker([dep.lat, dep.lon], { icon: makeMarkerIcon(dep.icao, dep.icao === HUB.icao) }).addTo(map)
			L.marker([arr.lat, arr.lon], { icon: makeMarkerIcon(arr.icao, arr.icao === HUB.icao) }).addTo(map)
		}
		if (bounds) map.fitBounds(bounds, { padding: [40, 40] })
	}, [plan, destinations])

	const distanceNM = useMemo(() => {
		if (!plan) return 0
		const dep = plan.departure_icao === HUB.icao ? HUB : destinations.find((d) => d.icao === plan.departure_icao)
		const arr = plan.arrival_icao === HUB.icao ? HUB : destinations.find((d) => d.icao === plan.arrival_icao)
		if (!dep || !arr) return 0
		return haversineNM(dep.lat, dep.lon, arr.lat, arr.lon)
	}, [plan, destinations])

	const dispatchParams = plan?.dispatch_params || null
	const schedMs = useMemo(() => {
		if (!dispatchParams?.date || !dispatchParams?.time) return null
		const parsed = new Date(`${dispatchParams.date}T${dispatchParams.time}:00Z`)
		return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
	}, [dispatchParams])
	const plannedEte = distanceNM > 0 ? estimateHours(distanceNM) : null
	const eteLabel = plannedEte != null ? formatHours(plannedEte) : null
	const staMs = schedMs != null && plannedEte != null ? schedMs + plannedEte * 3600000 : null
	const countdown = schedMs != null ? schedMs - now : null
	const departed = countdown != null && countdown < 0

	const ofp = plan?.simbrief_ofp || null
	const pdfUrl = (() => {
		const dir = pick(ofp, 'files.directory')
		const link = pick(ofp, 'files.pdf.link')
		return link ? (dir ? `${dir}${link}` : link) : null
	})()

	const isComplete = Boolean(flight?.ended_at)

	async function handleCancel(rebook) {
		const message = rebook ? 'Cancel this booking and start again?' : 'Cancel this booking?'
		if (!window.confirm(message)) return
		setCancelling(true)
		setActionMsg('')
		try {
			const token = await user.getIdToken()
			const res = await fetch(`${API_BASE}/api/flight-plans/${planId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data.error || 'Could not cancel booking')
			navigate(rebook ? '/dashboard/booking?new=1' : '/dashboard/booking')
		} catch (err) {
			setActionMsg(err.message)
		} finally {
			setCancelling(false)
		}
	}

	async function handleGenerateOFP() {
		if (!dispatchParams) {
			setActionMsg('This booking has no saved dispatch parameters to regenerate from.')
			return
		}
		setGenerating(true)
		setActionMsg('')
		try {
			await generateSimBrief(user, planId, {
				registration: plan.registration,
				aircraftType: plan.aircraft_type,
				orig: plan.departure_icao,
				dest: plan.arrival_icao,
				callsign: plan.callsign,
				flightNumber: plan.flight_number,
				date: dispatchParams.date,
				time: dispatchParams.time,
				eteHours: dispatchParams.ete_hours,
				costIndex: dispatchParams.cost_index,
				cruiseFl: dispatchParams.cruise_fl,
				pax: dispatchParams.pax,
				bags: dispatchParams.bags,
				fuel: dispatchParams.fuel,
				alternates: dispatchParams.alternates,
				options: dispatchParams.options || {},
			})
		} catch (err) {
			setActionMsg(err.message)
		} finally {
			setGenerating(false)
		}
	}

	if (!user || !validId) {
		return (
			<div className='dashboard-wrapper'>
				<p className='flight-error'>Flight not found</p>
				<Link className='flight-back-link' to='/dashboard/booking'>← Back to booking</Link>
			</div>
		)
	}
	if (loading) {
		return (
			<div className='dashboard-wrapper'>
				<p className='flight-loading'>Loading…</p>
			</div>
		)
	}
	if (loadError || !plan) {
		return (
			<div className='dashboard-wrapper'>
				<p className='flight-error'>{loadError || 'Flight not found'}</p>
				<Link className='flight-back-link' to='/dashboard/booking'>← Back to booking</Link>
			</div>
		)
	}

	const depWeather = weather[plan.departure_icao] || { status: 'loading', metar: null, icing: null, turbulence: null }
	const arrWeather = weather[plan.arrival_icao] || { status: 'loading', metar: null, icing: null, turbulence: null }
	const utcNow = `${String(new Date(now).getUTCHours()).padStart(2, '0')}:${String(new Date(now).getUTCMinutes()).padStart(2, '0')}`

	return (
		<div className='dashboard-wrapper'>
			<div className='flight-details'>
				<header className='vamsys-header'>
					<div>
						<h1 className='vamsys-title'>
							{plan.callsign || 'Flight'} <span className='vamsys-title-route'>{plan.departure_icao} → {plan.arrival_icao}</span>
						</h1>
						<p className='vamsys-sub'>
							<span className={`vamsys-status vamsys-status--${plan.status}`}>{STATUS_LABEL[plan.status] || plan.status}</span>
							{plan.registration && <> · {plan.registration} · {plan.aircraft_type}</>}
						</p>
					</div>
					<div className='vamsys-header-right'>
						<div className='vamsys-clock'>
							<span className='vamsys-clock-label'>UTC</span>
							<span className='vamsys-clock-value'>{utcNow}Z</span>
						</div>
						{schedMs != null && (
							<div className='vamsys-countdown'>
								<span className='vamsys-clock-label'>Scheduled departure</span>
								<span className='vamsys-clock-value'>{departed ? 'Departed' : formatCountdown(countdown)}</span>
							</div>
						)}
						<Link className='flight-back-link' to='/dashboard/booking'>← Back to booking</Link>
					</div>
				</header>

				<div className='flight-grid'>
					<main className='flight-main'>
						<div className='flight-map' ref={mapContainerRef}></div>

						<FlightInformationCard
							plan={plan}
							destinations={destinations}
							distanceNM={distanceNM}
							ofp={ofp}
							depWeather={depWeather}
							arrWeather={arrWeather}
							schedMs={schedMs}
							staMs={staMs}
							eteLabel={eteLabel}
						/>

						<PilotInformationCard plan={plan} ofp={ofp} dispatchParams={dispatchParams} />

						<RouteCard ofp={ofp} />

						{!ofp && (
							<section className='vamsys-card'>
								<header className='vamsys-card-header'>
									<h2 className='vamsys-card-title'>SimBrief OFP</h2>
								</header>
								<p className='flight-ofp-empty'>
									{plan.status === 'pending' || plan.status === 'in_progress'
										? 'Generating OFP…'
										: 'No flight plan was generated.'}
									<span className='dispatch-hint'>Use “Generate SimBrief OFP” to create or refresh it.</span>
								</p>
							</section>
						)}
						{ofp && <OFPSummaryCard ofp={ofp} />}
						{ofp && <OFPCard ofp={ofp} pdfUrl={pdfUrl} rawOpen={rawOpen} onToggleRaw={() => setRawOpen((v) => !v)} />}

						<CompareCard flight={flight} distanceNM={distanceNM} ofp={ofp} isComplete={isComplete} />
					</main>

					<aside className='flight-sidebar'>
						<BookingActions
							status={plan.status}
							cancelling={cancelling}
							callsign={plan.callsign}
							onCancel={() => handleCancel(false)}
							onRebook={() => handleCancel(true)}
						/>
						<SimBriefActions
							generating={generating}
							onGenerate={handleGenerateOFP}
							pdfUrl={pdfUrl}
						/>
						{actionMsg && <p className='flight-error'>{actionMsg}</p>}
					</aside>
				</div>
			</div>
		</div>
	)
}

export default FlightDetails
