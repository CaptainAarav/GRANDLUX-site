// Intersection of the aircraft types served on both legs of a route. A route's
// aircraft_type array is priority/preferred, not exclusive — any other active
// tail can be dispatched as a fallback when every priority aircraft is in use.
export function validTypesForRoute(destinations, departureIcao, arrivalIcao) {
	const rows = destinations.filter(
		(d) => d.icao === departureIcao || d.icao === arrivalIcao,
	)
	if (rows.length === 0) return null
	let valid = null
	for (const row of rows) {
		const types = new Set(row.aircraft_type)
		valid = valid === null ? types : new Set([...valid].filter((t) => types.has(t)))
	}
	return [...valid]
}

export function matchingAircraft(fleet, destinations, departureIcao, arrivalIcao) {
	const valid = validTypesForRoute(destinations, departureIcao, arrivalIcao)
	return fleet.filter((a) => valid === null || valid.includes(a.aircraft_type))
}
