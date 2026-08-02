import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth } from '../../hooks/useAuth'
import { formatDistance, formatHours } from '../../lib/format'
import './Booking.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const OWM_API_KEY = (import.meta.env.VITE_OWM_API_KEY || '').trim()

const HUB = { icao: 'ELLX', name: 'Luxembourg (Hub)', lat: 49.6233, lon: 6.2044 }
const HUB_DEST = { ...HUB, aircraft_type: [], notes: null, country: 'LU' }

const COUNTRY_NAMES = {
	AE: 'United Arab Emirates',
	CH: 'Switzerland',
	ES: 'Spain',
	GB: 'United Kingdom',
	GI: 'Gibraltar',
	NO: 'Norway',
	PL: 'Poland',
	PT: 'Portugal',
	RO: 'Romania',
}

function countryName(code) {
	return COUNTRY_NAMES[code] || code
}

const EARTH_RADIUS_NM = 3440.065
const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI

function haversineNM(lat1, lon1, lat2, lon2) {
	const dLat = toRad(lat2 - lat1)
	const dLon = toRad(lon2 - lon1)
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
	return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a))
}

function estimateHours(distanceNM) {
	return distanceNM / 450 + 0.5
}

// Returns [lat, lon] pairs — Leaflet's L.marker/L.polyline order, NOT [lon, lat].
function greatCirclePath(lat1, lon1, lat2, lon2, segments = 64) {
	const phi1 = toRad(lat1)
	const phi2 = toRad(lat2)
	const lam1 = toRad(lon1)
	const lam2 = toRad(lon2)
	const d = Math.acos(Math.min(1, Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(lam2 - lam1)))
	const coords = []
	for (let i = 0; i <= segments; i += 1) {
		if (d < 1e-9) {
			coords.push([lat1, lon1])
			continue
		}
		const f = i / segments
		const A = Math.sin((1 - f) * d) / Math.sin(d)
		const B = Math.sin(f * d) / Math.sin(d)
		const x = A * Math.cos(phi1) * Math.cos(lam1) + B * Math.cos(phi2) * Math.cos(lam2)
		const y = A * Math.cos(phi1) * Math.sin(lam1) + B * Math.cos(phi2) * Math.sin(lam2)
		const z = A * Math.sin(phi1) + B * Math.sin(phi2)
		coords.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))])
	}
	return coords
}

function makeMarkerHtml(icao, isHub) {
	const iconClass = isHub ? 'fa-house' : 'fa-plane-departure'
	return (
		`<span class="glx-marker-circle"><i class="fa-solid ${iconClass} glx-marker-icon"></i></span>` +
		`<span class="glx-marker-label">${icao}</span>`
	)
}

function makeMarkerIcon(icao, isHub) {
	return L.divIcon({
		className: `glx-marker${isHub ? ' glx-marker--hub' : ''}`,
		html: makeMarkerHtml(icao, isHub),
		iconSize: [36, 36],
		iconAnchor: [18, 18],
	})
}

function makePilotIcon(icao) {
	return L.divIcon({
		className: 'glx-marker glx-marker--pilot',
		html:
			'<span class="glx-marker-circle glx-marker-circle--pilot"><i class="fa-solid fa-person glx-marker-icon"></i></span>' +
			`<span class="glx-marker-label">${icao}</span>`,
		iconSize: [36, 36],
		iconAnchor: [18, 18],
	})
}

const ROUTE_DEFAULT = { color: '#c8262c', weight: 1.2, opacity: 0.35, interactive: false }
const ROUTE_SELECTED = { color: '#c8262c', weight: 3, opacity: 0.95, interactive: false }

const OWM_BASE = 'https://tile.openweathermap.org/map'
const OWM_LAYERS = [
	{ id: 'wind', label: 'Wind', layer: 'wind_new' },
	{ id: 'precipitation', label: 'Precip', layer: 'precipitation_new' },
	{ id: 'clouds', label: 'Clouds', layer: 'clouds_new' },
	{ id: 'temperature', label: 'Temp', layer: 'temp_new' },
	{ id: 'pressure', label: 'Pressure', layer: 'pressure_new' },
]

function owmTileUrl(layer) {
	return `${OWM_BASE}/${layer}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`
}

async function createFlightPlan(user, departureIcao, arrivalIcao) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/flight-plans`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ departure_icao: departureIcao, arrival_icao: arrivalIcao }),
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.error || 'Failed to create flight plan')
	return data
}

async function fetchMe(user) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/pilots/me`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.error || 'Failed to load pilot')
	return data
}

async function patchLocation(user, icao) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/pilots/me/location`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ icao }),
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.error || 'Failed to update location')
	return data
}

async function fetchDestinations(user) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/destinations`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.error || 'Failed to load destinations')
	return data
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

function RiskBadge({ label, value }) {
	const risk = value ? value.toLowerCase() : null
	return (
		<span className={`booking-risk${risk ? ` booking-risk--${risk}` : ' booking-risk--none'}`}>
			Estimated {label} risk: {risk ? risk.charAt(0).toUpperCase() + risk.slice(1) : 'unavailable'}
		</span>
	)
}

function WeatherStatus({ status, metar, icing, turbulence }) {
	if (status === 'loading') {
		return <p className='booking-weather-value booking-weather-value--muted'>Loading…</p>
	}
	if (status === 'error' || (!metar && !icing && !turbulence)) {
		return <p className='booking-weather-value booking-weather-value--muted'>Weather unavailable</p>
	}
	return (
		<div className='booking-weather-block-body'>
			{metar ? <code className='booking-weather-value'>{metar}</code> : null}
			<div className='booking-risks'>
				<RiskBadge label='icing' value={icing} />
				<RiskBadge label='turbulence' value={turbulence} />
			</div>
		</div>
	)
}

function Booking() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const mapContainerRef = useRef(null)
	const mapRef = useRef(null)
	const markersRef = useRef([])
	const routeRef = useRef({})
	const weatherTileRef = useRef(null)
	const destinationsRef = useRef([])
	const selectedRef = useRef(null)

	const [destinations, setDestinations] = useState([])
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState('')
	const [selected, setSelected] = useState(null)
	const [bookingError, setBookingError] = useState('')
	const [creating, setCreating] = useState(false)
	const [weather, setWeather] = useState({})

	const [filters, setFilters] = useState({ aircraft: '', country: '' })
	const [filtersOpen, setFiltersOpen] = useState(false)

	const [weatherOp, setWeatherOp] = useState(null)
	const [weatherLoading, setWeatherLoading] = useState(false)

	const [currentLocationIcao, setCurrentLocationIcao] = useState(HUB.icao)
	const [jumpMode, setJumpMode] = useState(false)
	const [jumping, setJumping] = useState(false)
	const jumpModeRef = useRef(false)

	useEffect(() => {
		jumpModeRef.current = jumpMode
	}, [jumpMode])

	useEffect(() => {
		if (!user) return
		let ignore = false
		Promise.all([fetchDestinations(user), fetchMe(user)])
			.then(([destData, meData]) => {
				if (ignore) return
				destinationsRef.current = destData
				setDestinations(destData)
				setCurrentLocationIcao(meData.current_location_icao || HUB.icao)
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

	function handleRetry() {
		setLoading(true)
		setLoadError('')
		Promise.all([fetchDestinations(user), fetchMe(user)])
			.then(([destData, meData]) => {
				destinationsRef.current = destData
				setDestinations(destData)
				setCurrentLocationIcao(meData.current_location_icao || HUB.icao)
				setLoading(false)
			})
			.catch((err) => {
				setLoadError(err.message)
				setLoading(false)
			})
	}

	const matchesFiltersWith = useCallback((f, dest) => {
		const okAircraft = !f.aircraft || (Array.isArray(dest.aircraft_type) && dest.aircraft_type.includes(f.aircraft))
		const okCountry = !f.country || (dest.country && dest.country === f.country)
		return okAircraft && okCountry
	}, [])

	const visibleDestinations = useMemo(
		() => destinations.filter((dest) => matchesFiltersWith(filters, dest)),
		[destinations, filters, matchesFiltersWith],
	)
	const aircraftOptions = useMemo(
		() => [...new Set(destinations.flatMap((d) => d.aircraft_type))].sort(),
		[destinations],
	)
	const countryOptions = useMemo(
		() => [...new Set(destinations.map((d) => d.country).filter(Boolean))].sort(),
		[destinations],
	)

	const departure = useMemo(() => {
		if (currentLocationIcao === HUB.icao) return HUB
		const dest = destinations.find((d) => d.icao === currentLocationIcao)
		return dest || HUB
	}, [currentLocationIcao, destinations])

	const isAtHub = departure.icao === HUB.icao

	function setFilter(dim, value) {
		const nextFilters = { ...filters, [dim]: value }
		setFilters(nextFilters)
		if (selected && !matchesFiltersWith(nextFilters, selected)) {
			setSelected(null)
			selectedRef.current = null
		}
	}

	function clearFilters() {
		setFilters({ aircraft: '', country: '' })
	}

	const handleSelect = useCallback((dest) => {
		setSelected(dest)
		setBookingError('')
		selectedRef.current = dest.icao
		const map = mapRef.current
		if (!map) return
		const poly = routeRef.current[dest.icao]
		if (poly) {
			map.fitBounds(poly.getBounds(), { padding: [60, 60], maxZoom: 6 })
		}
	}, [])

	const toggleJump = useCallback(() => {
		setJumpMode((mode) => !mode)
		setBookingError('')
	}, [])

	const handleJumpTarget = useCallback(async (icao) => {
		setBookingError('')
		setJumping(true)
		try {
			await patchLocation(user, icao)
			setCurrentLocationIcao(icao)
			setJumpMode(false)
			setSelected((prev) => {
				if (prev && prev.icao === icao) {
					selectedRef.current = null
					return null
				}
				return prev
			})
		} catch (err) {
			setBookingError(err.message)
		} finally {
			setJumping(false)
		}
	}, [user])

	const handleJumpClick = useCallback(() => {
		if (selected) {
			handleJumpTarget(selected.icao)
		} else {
			toggleJump()
		}
	}, [selected, handleJumpTarget, toggleJump])

	useEffect(() => {
		if (!jumpMode) return
		const onKey = (e) => {
			if (e.key === 'Escape') {
				setJumpMode(false)
				setBookingError('')
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [jumpMode])

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return
		const map = L.map(mapContainerRef.current, {
			center: [HUB.lat, HUB.lon],
			zoom: 3,
		})
		L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
			maxZoom: 19,
			subdomains: 'abcd',
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		}).addTo(map)
		mapRef.current = map
		requestAnimationFrame(() => map.invalidateSize())
		return () => {
			markersRef.current = []
			routeRef.current = {}
			map.remove()
			mapRef.current = null
			weatherTileRef.current = null
		}
	}, [])

	useEffect(() => {
		const map = mapRef.current
		if (!map || destinations.length === 0) return
		markersRef.current.forEach((entry) => map.removeLayer(entry.marker))
		markersRef.current = []
		Object.values(routeRef.current).forEach((poly) => map.removeLayer(poly))
		routeRef.current = {}

		const hubMarker = L.marker([HUB.lat, HUB.lon], {
			icon: isAtHub ? makePilotIcon(HUB.icao) : makeMarkerIcon(HUB.icao, true),
		}).addTo(map)
		hubMarker.getElement().dataset.icao = HUB.icao
		hubMarker.on('click', () => {
			if (jumpModeRef.current) {
				handleJumpTarget(HUB.icao)
			} else if (!isAtHub) {
				handleSelect(HUB_DEST)
			}
		})
		markersRef.current.push({ icao: HUB.icao, marker: hubMarker })

		visibleDestinations.forEach((dest) => {
			const isCurrent = dest.icao === departure.icao
			const muted = !isAtHub && !isCurrent
			const marker = L.marker([dest.lat, dest.lon], {
				icon: isCurrent ? makePilotIcon(dest.icao) : makeMarkerIcon(dest.icao, false),
			}).addTo(map)
			if (muted) marker.getElement().classList.add('glx-marker--muted')
			marker.getElement().dataset.icao = dest.icao
			marker.on('click', () => {
				if (jumpModeRef.current) {
					handleJumpTarget(dest.icao)
				} else if (isAtHub && !isCurrent) {
					handleSelect(dest)
				} else if (!isAtHub && !isCurrent) {
					setBookingError(`From ${departure.icao} you can only fly back to the hub.`)
				}
			})
			markersRef.current.push({ icao: dest.icao, marker })

			if (isAtHub) {
				const poly = L.polyline(greatCirclePath(departure.lat, departure.lon, dest.lat, dest.lon), ROUTE_DEFAULT).addTo(map)
				routeRef.current[dest.icao] = poly
			}
		})

		if (!isAtHub) {
			const poly = L.polyline(greatCirclePath(departure.lat, departure.lon, HUB.lat, HUB.lon), ROUTE_DEFAULT).addTo(map)
			routeRef.current[HUB.icao] = poly
		}

		markersRef.current.forEach(({ icao, marker }) => {
			marker.getElement().classList.toggle('glx-marker--selected', icao === selectedRef.current)
		})
		Object.entries(routeRef.current).forEach(([icao, poly]) => {
			poly.setStyle(icao === selectedRef.current ? ROUTE_SELECTED : ROUTE_DEFAULT)
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visibleDestinations, departure, isAtHub])

	useEffect(() => {
		if (!selected) return
		let ignore = false
		Promise.allSettled([
			fetchWeather(user, departure.icao),
			fetchWeather(user, selected.icao),
		]).then(([depRes, arrRes]) => {
			if (ignore) return
			setWeather((prev) => ({
				...prev,
				[departure.icao]: depRes.status === 'fulfilled'
					? { status: 'done', metar: depRes.value.metar || null, icing: depRes.value.icing || null, turbulence: depRes.value.turbulence || null }
					: { status: 'error', metar: null, icing: null, turbulence: null },
				[selected.icao]: arrRes.status === 'fulfilled'
					? { status: 'done', metar: arrRes.value.metar || null, icing: arrRes.value.icing || null, turbulence: arrRes.value.turbulence || null }
					: { status: 'error', metar: null, icing: null, turbulence: null },
			}))
		})
		return () => {
			ignore = true
		}
	}, [user, selected, departure])

	useEffect(() => {
		const map = mapRef.current
		if (!map) return
		if (!weatherOp || !OWM_API_KEY) {
			if (weatherTileRef.current) {
				map.removeLayer(weatherTileRef.current)
				weatherTileRef.current = null
			}
			return
		}
		const layer = OWM_LAYERS.find((l) => l.id === weatherOp)
		if (!layer) return
		const url = owmTileUrl(layer.layer)
		if (weatherTileRef.current) {
			weatherTileRef.current.setUrl(url)
		} else {
			const tile = L.tileLayer(url, { opacity: 0.7, zIndex: 500, maxZoom: 9 })
			tile.on('loading', () => setWeatherLoading(true))
			tile.on('load', () => setWeatherLoading(false))
			tile.on('tileerror', () => setWeatherLoading(false))
			tile.on('remove', () => setWeatherLoading(false))
			tile.addTo(map)
			weatherTileRef.current = tile
		}
	}, [weatherOp])

	useEffect(() => {
		markersRef.current.forEach(({ icao, marker }) => {
			marker.getElement().classList.toggle('glx-marker--selected', icao === selectedRef.current)
		})
		Object.entries(routeRef.current).forEach(([icao, poly]) => {
			poly.setStyle(icao === selectedRef.current ? ROUTE_SELECTED : ROUTE_DEFAULT)
		})
	}, [selected, visibleDestinations])

	const handleRandom = useCallback(() => {
		const options = isAtHub
			? visibleDestinations.filter((d) => d.icao !== departure.icao)
			: [HUB_DEST]
		if (options.length === 0) return
		const dest = options[Math.floor(Math.random() * options.length)]
		handleSelect(dest)
	}, [visibleDestinations, departure.icao, isAtHub, handleSelect])

	async function handleContinue() {
		if (!selected) return
		setBookingError('')
		setCreating(true)
		try {
			await createFlightPlan(user, departure.icao, selected.icao)
			navigate('/dashboard/profile/flights')
		} catch (err) {
			setBookingError(err.message)
		} finally {
			setCreating(false)
		}
	}

	const distance = selected ? haversineNM(departure.lat, departure.lon, selected.lat, selected.lon) : 0
	const durationHours = selected ? estimateHours(distance) : 0
	const depWeather = weather[departure.icao] || { status: 'loading', metar: null, icing: null, turbulence: null }
	const arrWeather = selected
		? weather[selected.icao] || { status: 'loading', metar: null, icing: null, turbulence: null }
		: { status: 'idle', metar: null, icing: null, turbulence: null }
	const isFiltered = Boolean(filters.aircraft) || Boolean(filters.country)

	const activeLayer = OWM_LAYERS.find((l) => l.id === weatherOp)

	const weatherMapControls = (
		<div className='booking-weather-map'>
			<div className='booking-weather-map-header'>
				<i className='fa-solid fa-map-location-dot booking-weather-map-icon'></i>
				<h3>Weather map</h3>
			</div>
			{weatherLoading && activeLayer && OWM_API_KEY && (
				<div className='weather-loading'>
					<i className='fa-solid fa-spinner fa-spin'></i>
					Loading {activeLayer.label} data…
				</div>
			)}
			<div className='layer-switcher'>
				<button className={`layer-chip${weatherOp === null ? ' active' : ''}`} onClick={() => setWeatherOp(null)}>
					Off
				</button>
				{OWM_LAYERS.map((layer) => (
					<button
						key={layer.id}
						className={`layer-chip${weatherOp === layer.id ? ' active' : ''}`}
						onClick={() => setWeatherOp(layer.id)}
						disabled={!OWM_API_KEY}
					>
						{layer.label}
					</button>
				))}
			</div>
			{OWM_API_KEY ? (
				weatherOp !== null && (
					<p className='forecast-note'>Live conditions only</p>
				)
			) : (
				<div className='weather-key-hint'>Weather maps need VITE_OWM_API_KEY</div>
			)}
		</div>
	)

	return (
		<div className='dashboard-wrapper booking-page'>
			<div className='booking-container'>
				<aside className='booking-panel'>
					<h2 className='booking-title'>New Booking</h2>
					{selected ? (
						<>
							<div className='booking-route'>
								<span className='booking-route-code'>{departure.icao}</span>
								<i className='fa-solid fa-arrow-right-long booking-route-arrow'></i>
								<span className='booking-route-code'>{selected.icao}</span>
							</div>
							<p className='booking-route-name'>{departure.name} → {selected.name}</p>
							<div className='booking-facts'>
								<div className='booking-fact'>
									<i className='fa-solid fa-route booking-fact-icon'></i>
									<div>
										<span className='booking-fact-label'>Distance</span>
										<span className='booking-fact-value'>{formatDistance(distance)}</span>
									</div>
								</div>
								<div className='booking-fact'>
									<i className='fa-solid fa-clock booking-fact-icon'></i>
									<div>
										<span className='booking-fact-label'>Est. duration</span>
										<span className='booking-fact-value'>{formatHours(durationHours)}</span>
									</div>
								</div>
								<div className='booking-fact'>
									<i className='fa-solid fa-plane booking-fact-icon'></i>
									<div>
										<span className='booking-fact-label'>Aircraft</span>
										<span className='booking-fact-value'>{selected.aircraft_type.length ? selected.aircraft_type.join(', ') : '—'}</span>
									</div>
								</div>
							</div>
							{selected.notes && (
								<div className='booking-note'>
									<i className='fa-solid fa-triangle-exclamation'></i>
									<span>{selected.notes}</span>
								</div>
							)}
							<div className='booking-weather'>
								<div className='booking-weather-header'>
									<i className='fa-solid fa-cloud-sun booking-weather-icon'></i>
									<h3>Weather</h3>
								</div>
								<div className='booking-weather-block'>
									<span className='booking-weather-label'>Departure · {departure.icao}</span>
									<WeatherStatus
										status={depWeather.status}
										metar={depWeather.metar}
										icing={depWeather.icing}
										turbulence={depWeather.turbulence}
									/>
								</div>
								<div className='booking-weather-block'>
									<span className='booking-weather-label'>Arrival · {selected.icao}</span>
									<WeatherStatus
										status={arrWeather.status}
										metar={arrWeather.metar}
										icing={arrWeather.icing}
										turbulence={arrWeather.turbulence}
									/>
								</div>
								<p className='booking-risk-note'>
									Icing and turbulence risk are rough estimates from temperature, moisture, and wind data NOT official forecast guidance.
								</p>
							</div>
							{weatherMapControls}
							<button className='booking-btn booking-continue' onClick={handleContinue} disabled={creating}>
								{creating ? (
									'Creating…'
								) : (
									<><i className='fa-solid fa-check booking-continue-icon'></i>Continue</>
								)}
							</button>
							<button className={`booking-btn booking-jump${jumpMode ? ' booking-jump--active' : ''}`} onClick={handleJumpClick} disabled={jumping}>
								{jumpMode ? 'Cancel Jump' : selected ? `Jump to ${selected.icao}` : 'Jump'}
							</button>
						</>
					) : (
						<>
							<div className='booking-empty'>
								<div className='booking-leg-card'>
									<span className='booking-leg-label'>Departure</span>
									<span className='booking-leg-value'>{departure.icao} · {departure.name}</span>
								</div>
								<div className='booking-leg-card booking-leg-card--arrival'>
									<span className='booking-leg-label'>Arrival</span>
									<span className='booking-leg-value booking-leg-value--placeholder'>
										{isAtHub ? 'Select on the map' : `Select the hub · ${HUB.icao}`}
									</span>
								</div>
								<button className='booking-random' onClick={handleRandom}>
									<i className='fa-solid fa-dice booking-random-icon'></i>
									Pick random destination
								</button>
							</div>
							{weatherMapControls}
							<button className={`booking-btn booking-jump${jumpMode ? ' booking-jump--active' : ''}`} onClick={handleJumpClick} disabled={jumping}>
								{jumpMode ? 'Cancel Jump' : 'Jump'}
							</button>
						</>
					)}
					{bookingError && <p className='booking-error'>{bookingError}</p>}
				</aside>
				<div className={`booking-map${jumpMode ? ' booking-map--jump' : ''}`} ref={mapContainerRef}>
					{loading && <div className='booking-map-overlay'>Loading destinations…</div>}
					{loadError && (
						<div className='booking-map-overlay'>
							<p className='booking-error'>{loadError}</p>
							<button className='booking-btn' onClick={handleRetry}>Retry</button>
						</div>
					)}
					<div className='map-toolbar'>
						<button className='map-filter-btn' onClick={() => setFiltersOpen((open) => !open)}>
							<i className='fa-solid fa-sliders map-filter-icon'></i>
							Filters · {visibleDestinations.length} destinations
							{isFiltered && <span className='map-filter-dot'></span>}
						</button>
						{filtersOpen && (
							<div className='map-filter-panel'>
								<div className='filter-section'>
									<span className='filter-section-label'>Aircraft type</span>
									<select
										className='filter-select'
										value={filters.aircraft}
										onChange={(e) => setFilter('aircraft', e.target.value)}
									>
										<option value=''>All aircraft</option>
										{aircraftOptions.map((type) => (
											<option key={type} value={type}>{type}</option>
										))}
									</select>
								</div>
								<div className='filter-section'>
									<span className='filter-section-label'>Country</span>
									<select
										className='filter-select'
										value={filters.country}
										onChange={(e) => setFilter('country', e.target.value)}
									>
										<option value=''>All countries</option>
										{countryOptions.map((code) => (
											<option key={code} value={code}>{countryName(code)}</option>
										))}
									</select>
								</div>
								<button className='filter-clear' onClick={clearFilters}>Clear all</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default Booking
