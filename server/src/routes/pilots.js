const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const { pool } = require('../db')

const router = express.Router()

const STATS_QUERY = `
SELECT
	COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) / 3600.0), 0)::float8 AS total_hours,
	COUNT(*)::int AS total_flights,
	COALESCE(SUM(distance_nm), 0)::float8 AS total_distance_nm,
	(SELECT COUNT(*)::int FROM pilot_countries WHERE pilot_uid = $1) AS total_countries_visited,
	(SELECT AVG(landing_rate_fpm)::float8 FROM flights
		WHERE pilot_uid = $1 AND ended_at IS NOT NULL AND landing_rate_fpm IS NOT NULL) AS average_landing_rate_fpm
FROM flights
WHERE pilot_uid = $1 AND ended_at IS NOT NULL`

router.use(verifyToken)

router.get('/me', async (req, res, next) => {
	try {
		await pool.query(
			'INSERT INTO pilots (firebase_uid) VALUES ($1) ON CONFLICT (firebase_uid) DO NOTHING',
			[req.pilotId]
		)
		const pilotRes = await pool.query(
			'SELECT first_name, last_name, callsign, pfp_url, current_location_icao FROM pilots WHERE firebase_uid = $1',
			[req.pilotId]
		)
		const statsRes = await pool.query(STATS_QUERY, [req.pilotId])
		res.json({
			firebase_uid: req.pilotId,
			...pilotRes.rows[0],
			...statsRes.rows[0]
		})
	} catch (err) {
		next(err)
	}
})

router.get('/me/flights', async (req, res, next) => {
	try {
		const result = await pool.query(
			'SELECT id, started_at, ended_at, distance_nm, departure_icao, arrival_icao FROM flights WHERE pilot_uid = $1 AND ended_at IS NOT NULL ORDER BY started_at DESC',
			[req.pilotId]
		)
		res.json(result.rows)
	} catch (err) {
		next(err)
	}
})

router.patch('/me/location', async (req, res, next) => {
	try {
		const icao = typeof req.body.icao === 'string' ? req.body.icao.trim().toUpperCase() : ''
		if (!/^[A-Z0-9]{4}$/.test(icao)) {
			return res.status(400).json({ error: 'Valid 4-character icao is required' })
		}
		const isHub = icao === 'ELLX'
		if (!isHub) {
			const destRes = await pool.query(
				'SELECT 1 FROM destinations WHERE icao = $1 AND active = true',
				[icao]
			)
			if (destRes.rowCount === 0) {
				return res.status(400).json({ error: 'Destination is outside the network' })
			}
		}
		const result = await pool.query(
			'UPDATE pilots SET current_location_icao = $1 WHERE firebase_uid = $2 RETURNING current_location_icao',
			[icao, req.pilotId]
		)
		res.json({ current_location_icao: result.rows[0].current_location_icao })
	} catch (err) {
		next(err)
	}
})

module.exports = router
