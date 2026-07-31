const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const pool = require('../db')
const { countryForIcao } = require('../icaoCountries')

const router = express.Router()

const EARTH_RADIUS_NM = 3440.065

function haversineNm(lat1, lon1, lat2, lon2) {
	const toRad = (deg) => (deg * Math.PI) / 180
	const dLat = toRad(lat2 - lat1)
	const dLon = toRad(lon2 - lon1)
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
	return EARTH_RADIUS_NM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function parseIcao(value) {
	return typeof value === 'string' ? value.trim().toUpperCase().slice(0, 4) : null
}

function validFlightId(value) {
	const id = Number(value)
	return Number.isInteger(id) && id > 0 ? id : null
}

router.post('/start', verifyToken, async (req, res, next) => {
	try {
		const departureIcao = parseIcao(req.body.departure_icao)
		const arrivalIcao = parseIcao(req.body.arrival_icao)
		const result = await pool.query(
			'INSERT INTO flights (pilot_uid, departure_icao, arrival_icao) VALUES ($1, $2, $3) RETURNING id',
			[req.pilotId, departureIcao, arrivalIcao]
		)
		res.status(201).json({ flight_id: result.rows[0].id })
	} catch (err) {
		next(err)
	}
})

router.post('/ping', verifyToken, async (req, res, next) => {
	try {
		const flightId = validFlightId(req.body.flight_id)
		if (flightId == null) {
			return res.status(400).json({ error: 'Invalid flight_id' })
		}
		const lat = req.body.lat
		const lon = req.body.lon != null ? req.body.lon : req.body.lng
		if (lat != null && (typeof lat !== 'number' || lat < -90 || lat > 90)) {
			return res.status(400).json({ error: 'Invalid lat' })
		}
		if (lon != null && (typeof lon !== 'number' || lon < -180 || lon > 180)) {
			return res.status(400).json({ error: 'Invalid lon' })
		}
		const altAgl = req.body.alt_agl
		const vvi = req.body.vvi_fpm
		if (altAgl != null && typeof altAgl !== 'number') {
			return res.status(400).json({ error: 'Invalid alt_agl' })
		}
		if (vvi != null && typeof vvi !== 'number') {
			return res.status(400).json({ error: 'Invalid vvi_fpm' })
		}

		const flightRes = await pool.query(
			'SELECT id, pilot_uid, last_lat, last_lon, last_alt_agl, landing_rate_fpm FROM flights WHERE id = $1',
			[flightId]
		)
		if (flightRes.rowCount === 0 || flightRes.rows[0].pilot_uid !== req.pilotId) {
			return res.status(404).json({ error: 'Flight not found' })
		}
		const flight = flightRes.rows[0]

		let distanceToAdd = 0
		if (
			flight.last_lat != null &&
			flight.last_lon != null &&
			lat != null &&
			lon != null
		) {
			distanceToAdd = haversineNm(flight.last_lat, flight.last_lon, lat, lon)
		}

		let landingRate = null
		if (
			flight.landing_rate_fpm == null &&
			flight.last_alt_agl != null &&
			flight.last_alt_agl > 10 &&
			altAgl != null &&
			altAgl <= 10 &&
			vvi != null
		) {
			landingRate = vvi
		}

		await pool.query(
			`UPDATE flights SET
				distance_nm = distance_nm + $2,
				last_lat = COALESCE($3, last_lat),
				last_lon = COALESCE($4, last_lon),
				last_alt_agl = COALESCE($5, last_alt_agl),
				landing_rate_fpm = COALESCE(landing_rate_fpm, $6)
			 WHERE id = $1 AND pilot_uid = $7`,
			[flightId, distanceToAdd, lat ?? null, lon ?? null, altAgl ?? null, landingRate, req.pilotId]
		)

		res.json({ status: 'ok' })
	} catch (err) {
		next(err)
	}
})

router.post('/end', verifyToken, async (req, res, next) => {
	try {
		const flightId = validFlightId(req.body.flight_id)
		if (flightId == null) {
			return res.status(400).json({ error: 'Invalid flight_id' })
		}
		const result = await pool.query(
			`UPDATE flights SET ended_at = now()
			 WHERE id = $1 AND pilot_uid = $2
			 RETURNING departure_icao, arrival_icao`,
			[flightId, req.pilotId]
		)
		if (result.rowCount === 0) {
			return res.status(404).json({ error: 'Flight not found' })
		}
		const flight = result.rows[0]
		for (const icao of [flight.departure_icao, flight.arrival_icao]) {
			const country = icao ? countryForIcao(icao) : null
			if (!country) continue
			await pool.query(
				'INSERT INTO pilot_countries (pilot_uid, country_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
				[req.pilotId, country]
			)
		}
		res.json({ status: 'ok' })
	} catch (err) {
		next(err)
	}
})

module.exports = router
