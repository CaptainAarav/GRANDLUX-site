const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const { pool, ensurePilot } = require('../db')
const { genuinelyActiveExistsSql } = require('../activeAircraft')

const router = express.Router()

router.use(verifyToken)

router.post('/', async (req, res, next) => {
	try {
		const departure = typeof req.body.departure_icao === 'string'
			? req.body.departure_icao.trim().toUpperCase()
			: ''
		const arrival = typeof req.body.arrival_icao === 'string'
			? req.body.arrival_icao.trim().toUpperCase()
			: ''
		if (!/^[A-Z0-9]{4}$/.test(departure) || !/^[A-Z0-9]{4}$/.test(arrival)) {
			return res.status(400).json({ error: 'Valid 4-character departure_icao and arrival_icao are required' })
		}
		await ensurePilot(req.pilotId)
		const result = await pool.query(
			'INSERT INTO flight_plans (pilot_uid, departure_icao, arrival_icao) VALUES ($1, $2, $3) RETURNING id, departure_icao, arrival_icao, status',
			[req.pilotId, departure, arrival]
		)
		res.status(201).json(result.rows[0])
	} catch (err) {
		next(err)
	}
})

router.get('/mine', async (req, res, next) => {
	try {
		const result = await pool.query(
			'SELECT id, departure_icao, arrival_icao FROM flight_plans WHERE pilot_uid = $1 AND status = \'pending\' ORDER BY created_at DESC',
			[req.pilotId]
		)
		res.json(result.rows)
	} catch (err) {
		next(err)
	}
})

router.patch('/:id/dispatch', async (req, res, next) => {
	const id = Number(req.params.id)
	if (!Number.isInteger(id) || id <= 0) {
		return res.status(400).json({ error: 'Invalid flight plan id' })
	}
	const fleetId = Number(req.body.fleet_id)
	if (!Number.isInteger(fleetId) || fleetId <= 0) {
		return res.status(400).json({ error: 'Valid fleet_id is required' })
	}
	try {
		// Any active fleet aircraft may be dispatched: a route's aircraft_type
		// list is priority/preferred, not exclusive — when every priority
		// aircraft is in use the pilot may fall back to any other tail. The
		// real constraints are that the tail is active and not already taken.
		// Locking the fleet row serializes concurrent dispatches of the same
		// tail so two pilots racing for one registration can't both win.
		const client = await pool.connect()
		try {
			await client.query('BEGIN')
			const fleetResult = await client.query(
				'SELECT id, registration FROM fleet WHERE id = $1 AND active = true FOR UPDATE',
				[fleetId]
			)
			const aircraft = fleetResult.rows[0]
			if (!aircraft) {
				await client.query('ROLLBACK')
				return res.status(400).json({ error: 'Fleet aircraft not found' })
			}
			const planResult = await client.query(
				'SELECT id, pilot_uid, status FROM flight_plans WHERE id = $1',
				[id]
			)
			const plan = planResult.rows[0]
			if (!plan || plan.pilot_uid !== req.pilotId || plan.status !== 'pending') {
				await client.query('ROLLBACK')
				return res.status(404).json({ error: 'Flight plan not found' })
			}
			const takenResult = await client.query(
				`SELECT 1 WHERE ${genuinelyActiveExistsSql('$1', '$2')}`,
				[fleetId, id]
			)
			if (takenResult.rows.length > 0) {
				await client.query('ROLLBACK')
				return res.status(409).json({ error: 'This aircraft is currently in use' })
			}
			const result = await client.query(
				'UPDATE flight_plans SET fleet_id = $1, dispatched_at = now() WHERE id = $2 RETURNING id, departure_icao, arrival_icao, status, fleet_id, dispatched_at',
				[fleetId, id]
			)
			await client.query('COMMIT')
			res.json(result.rows[0])
		} catch (err) {
			await client.query('ROLLBACK')
			next(err)
		} finally {
			client.release()
		}
	} catch (err) {
		next(err)
	}
})

module.exports = router
