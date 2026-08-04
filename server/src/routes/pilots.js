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
			'SELECT first_name, last_name, callsign, pfp_url, current_location_icao, simbrief_userid, distance_unit, email_notifications FROM pilots WHERE firebase_uid = $1',
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
			`SELECT fl.id, fl.started_at, fl.ended_at, fl.distance_nm, fl.landing_rate_fpm, fl.departure_icao, fl.arrival_icao,
				fp.callsign, fp.flight_number, f.registration, f.aircraft_type
			 FROM flights fl
			 LEFT JOIN flight_plans fp ON fp.id = fl.flight_plan_id
			 LEFT JOIN fleet f ON f.id = fp.fleet_id
			 WHERE fl.pilot_uid = $1 AND fl.ended_at IS NOT NULL
			 ORDER BY fl.started_at DESC`,
			[req.pilotId]
		)
		res.json(result.rows)
	} catch (err) {
		next(err)
	}
})

router.patch('/me/profile', async (req, res, next) => {
	try {
		const first = typeof req.body.first_name === 'string' ? req.body.first_name.trim() : undefined
		const last = typeof req.body.last_name === 'string' ? req.body.last_name.trim() : undefined
		const callsign = typeof req.body.callsign === 'string' ? req.body.callsign.trim().toUpperCase() : undefined
		if (first !== undefined && (!first || first.length > 50)) {
			return res.status(400).json({ error: 'First name must be 1-50 characters' })
		}
		if (last !== undefined && (!last || last.length > 50)) {
			return res.status(400).json({ error: 'Last name must be 1-50 characters' })
		}
		if (callsign !== undefined && !/^[A-Z0-9 _.-]{1,20}$/.test(callsign)) {
			return res.status(400).json({ error: 'Callsign must be 1-20 letters, digits, or -_.' })
		}
		const fields = []
		const values = []
		if (first !== undefined) {
			fields.push(`first_name = $${values.length + 1}`)
			values.push(first)
		}
		if (last !== undefined) {
			fields.push(`last_name = $${values.length + 1}`)
			values.push(last)
		}
		if (callsign !== undefined) {
			fields.push(`callsign = $${values.length + 1}`)
			values.push(callsign)
		}
		if (fields.length === 0) {
			return res.status(400).json({ error: 'Nothing to update' })
		}
		values.push(req.pilotId)
		const result = await pool.query(
			`UPDATE pilots SET ${fields.join(', ')} WHERE firebase_uid = $${values.length}
			 RETURNING first_name, last_name, callsign`,
			values
		)
		res.json(result.rows[0])
	} catch (err) {
		next(err)
	}
})

router.patch('/me/settings', async (req, res, next) => {
	try {
		const distanceUnit = req.body.distance_unit
		if (distanceUnit !== undefined && !['nm', 'sm', 'km'].includes(distanceUnit)) {
			return res.status(400).json({ error: 'distance_unit must be nm, sm, or km' })
		}
		const emailNotifications = req.body.email_notifications
		if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') {
			return res.status(400).json({ error: 'email_notifications must be a boolean' })
		}
		const fields = []
		const values = []
		if (distanceUnit !== undefined) {
			fields.push(`distance_unit = $${values.length + 1}`)
			values.push(distanceUnit)
		}
		if (emailNotifications !== undefined) {
			fields.push(`email_notifications = $${values.length + 1}`)
			values.push(emailNotifications)
		}
		if (fields.length === 0) {
			return res.status(400).json({ error: 'Nothing to update' })
		}
		values.push(req.pilotId)
		const result = await pool.query(
			`UPDATE pilots SET ${fields.join(', ')} WHERE firebase_uid = $${values.length}
			 RETURNING distance_unit, email_notifications`,
			values
		)
		res.json(result.rows[0])
	} catch (err) {
		next(err)
	}
})

router.patch('/me/pfp', async (req, res, next) => {
	try {
		const pfpUrl = typeof req.body.pfp_url === 'string' ? req.body.pfp_url.trim() : ''
		let parsed
		try {
			parsed = new URL(pfpUrl)
		} catch {
			return res.status(400).json({ error: 'A valid profile picture URL is required' })
		}
		if (!/^https?:$/.test(parsed.protocol)) {
			return res.status(400).json({ error: 'A valid profile picture URL is required' })
		}
		const result = await pool.query(
			'UPDATE pilots SET pfp_url = $1 WHERE firebase_uid = $2 RETURNING pfp_url',
			[pfpUrl, req.pilotId]
		)
		res.json({ pfp_url: result.rows[0].pfp_url })
	} catch (err) {
		next(err)
	}
})

router.patch('/me/simbrief', async (req, res, next) => {
	try {
		const userid = typeof req.body.userid === 'string' ? req.body.userid.trim() : ''
		if (!/^[A-Za-z0-9_-]{1,64}$/.test(userid)) {
			return res.status(400).json({ error: 'A valid SimBrief user id is required' })
		}
		const result = await pool.query(
			'UPDATE pilots SET simbrief_userid = $1 WHERE firebase_uid = $2 RETURNING simbrief_userid',
			[userid, req.pilotId]
		)
		res.json({ simbrief_userid: result.rows[0].simbrief_userid })
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
