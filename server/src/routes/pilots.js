const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const pool = require('../db')

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
			'SELECT first_name, last_name, callsign, pfp_url FROM pilots WHERE firebase_uid = $1',
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
			'SELECT id, started_at, ended_at, distance_nm FROM flights WHERE pilot_uid = $1 AND ended_at IS NOT NULL ORDER BY started_at DESC',
			[req.pilotId]
		)
		res.json(result.rows)
	} catch (err) {
		next(err)
	}
})

module.exports = router
