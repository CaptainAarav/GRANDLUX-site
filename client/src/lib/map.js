import L from 'leaflet'

export const EARTH_RADIUS_NM = 3440.065
const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI

export function haversineNM(lat1, lon1, lat2, lon2) {
	const dLat = toRad(lat2 - lat1)
	const dLon = toRad(lon2 - lon1)
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
	return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a))
}

export function estimateHours(distanceNM) {
	return distanceNM / 450 + 0.5
}

// Returns [lat, lon] pairs — Leaflet's L.marker/L.polyline order, NOT [lon, lat].
export function greatCirclePath(lat1, lon1, lat2, lon2, segments = 64) {
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

export function makeMarkerHtml(icao, isHub) {
	const iconClass = isHub ? 'fa-house' : 'fa-plane-departure'
	return (
		`<span class="glx-marker-circle"><i class="fa-solid ${iconClass} glx-marker-icon"></i></span>` +
		`<span class="glx-marker-label">${icao}</span>`
	)
}

export function makeMarkerIcon(icao, isHub) {
	return L.divIcon({
		className: `glx-marker${isHub ? ' glx-marker--hub' : ''}`,
		html: makeMarkerHtml(icao, isHub),
		iconSize: [36, 36],
		iconAnchor: [18, 18],
	})
}

export function makePilotIcon(icao) {
	return L.divIcon({
		className: 'glx-marker glx-marker--pilot',
		html:
			'<span class="glx-marker-circle glx-marker-circle--pilot"><i class="fa-solid fa-person glx-marker-icon"></i></span>' +
			`<span class="glx-marker-label">${icao}</span>`,
		iconSize: [36, 36],
		iconAnchor: [18, 18],
	})
}

export const ROUTE_DEFAULT = { color: '#c8262c', weight: 1.2, opacity: 0.35, interactive: false }
export const ROUTE_SELECTED = { color: '#c8262c', weight: 3, opacity: 0.95, interactive: false }
