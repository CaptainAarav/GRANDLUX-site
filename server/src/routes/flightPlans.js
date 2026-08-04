const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const { pool, ensurePilot } = require('../db')
const {
	genuinelyActiveExistsSql,
	genuinelyActiveCallsignExistsSql,
	genuinelyActivePlanExistsSql,
} = require('../activeAircraft')

const router = express.Router()

router.use(verifyToken)

const CALLSIGN_RE = /^[A-Z0-9]{3,8}$/
const FLIGHT_NUMBER_RE = /^[A-Z0-9]{1,4}$/

function parseOptionalCallsign(body) {
	const raw = body.callsign
	if (raw == null || raw === '') return { callsign: null, flightNumber: null }
	const callsign = String(raw).trim().toUpperCase()
	const flightNumber = body.flight_number != null && body.flight_number !== ''
		? String(body.flight_number).trim().toUpperCase()
		: null
	if (!CALLSIGN_RE.test(callsign)) {
		return { error: 'Callsign must be 3-8 uppercase letters/digits' }
	}
	if (flightNumber != null && !FLIGHT_NUMBER_RE.test(flightNumber)) {
		return { error: 'Flight number must be 1-4 uppercase letters/digits' }
	}
	return { callsign, flightNumber }
}

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
		const { callsign, flightNumber, error } = parseOptionalCallsign(req.body)
		if (error) return res.status(400).json({ error })
		if (callsign) {
			const taken = await pool.query(
				`SELECT 1 WHERE ${genuinelyActiveCallsignExistsSql('$1')}`,
				[callsign]
			)
			if (taken.rows.length > 0) {
				return res.status(409).json({ error: 'This callsign is already in use' })
			}
		}
		await ensurePilot(req.pilotId)
		const result = await pool.query(
			'INSERT INTO flight_plans (pilot_uid, departure_icao, arrival_icao, callsign, flight_number) VALUES ($1, $2, $3, $4, $5) RETURNING id, departure_icao, arrival_icao, status, callsign, flight_number',
			[req.pilotId, departure, arrival, callsign, flightNumber]
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

// The plan a pilot is "genuinely flying" right now: pending but dispatched
// within 24h, or in_progress with a recent ping. Powers the smart-entry
// redirect on /dashboard/booking — if this exists the map is skipped and the
// pilot is sent straight to their flight details.
router.get('/active', async (req, res, next) => {
	try {
		const result = await pool.query(
			`SELECT fp.id, fp.departure_icao, fp.arrival_icao, fp.status, fp.fleet_id, fp.dispatched_at, fp.callsign, fp.flight_number
			 FROM flight_plans fp
			 WHERE ${genuinelyActivePlanExistsSql('$1')}
			 ORDER BY fp.created_at DESC
			 LIMIT 1`,
			[req.pilotId]
		)
		res.json(result.rows[0] || null)
	} catch (err) {
		next(err)
	}
})

// Smallest free GLX callsign in the format GLX + 2 digits + 1 letter
// (GLX11A). Once every 2-digit combination is taken it falls back to GLX +
// 1 digit + 2 letters (GLX1AA). Callsigns are reused as soon as their flight
// completes — availability is what gates reuse, not a monotonically
// increasing counter. The returned flight_number is the callsign suffix
// (e.g. "11A").
async function nextCallsign(pool) {
	for (let n = 1; n <= 99; n += 1) {
		const digits = String(n).padStart(2, '0')
		for (let i = 0; i < 26; i += 1) {
			const code = `${digits}${String.fromCharCode(65 + i)}`
			const callsign = `GLX${code}`
			const taken = await pool.query(
				`SELECT 1 WHERE ${genuinelyActiveCallsignExistsSql('$1')}`,
				[callsign]
			)
			if (taken.rows.length === 0) return { callsign, flight_number: code }
		}
	}
	for (let n = 1; n <= 9; n += 1) {
		for (let i = 0; i < 26; i += 1) {
			for (let j = 0; j < 26; j += 1) {
				const code = `${n}${String.fromCharCode(65 + i)}${String.fromCharCode(65 + j)}`
				const callsign = `GLX${code}`
				const taken = await pool.query(
					`SELECT 1 WHERE ${genuinelyActiveCallsignExistsSql('$1')}`,
					[callsign]
				)
				if (taken.rows.length === 0) return { callsign, flight_number: code }
			}
		}
	}
	return null
}

router.get('/next-callsign', async (req, res, next) => {
	try {
		const next = await nextCallsign(pool)
		if (!next) return res.status(409).json({ error: 'No callsigns available' })
		res.json(next)
	} catch (err) {
		next(err)
	}
})

// Debounced availability check while the pilot edits the callsign field.
router.get('/check-callsign', async (req, res, next) => {
	try {
		const callsign = String(req.query.callsign || '').trim().toUpperCase()
		if (!CALLSIGN_RE.test(callsign)) {
			return res.status(400).json({ error: 'Callsign must be 3-8 uppercase letters/digits' })
		}
		const taken = await pool.query(
			`SELECT 1 WHERE ${genuinelyActiveCallsignExistsSql('$1')}`,
			[callsign]
		)
		res.json({ callsign, available: taken.rows.length === 0 })
	} catch (err) {
		next(err)
	}
})

// Full details for the flight page: plan + aircraft + the flight row (real
// metrics once complete). Ownership-checked.
router.get('/:id', async (req, res, next) => {
	try {
		const id = Number(req.params.id)
		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ error: 'Invalid flight plan id' })
		}
		const planRes = await pool.query(
			`SELECT fp.id, fp.pilot_uid, fp.departure_icao, fp.arrival_icao, fp.status, fp.created_at, fp.fleet_id, fp.dispatched_at, fp.callsign, fp.flight_number, fp.dispatch_params, fp.simbrief_ofp,
				f.registration, f.aircraft_type
			 FROM flight_plans fp
			 LEFT JOIN fleet f ON f.id = fp.fleet_id
			 WHERE fp.id = $1`,
			[id]
		)
		const plan = planRes.rows[0]
		if (!plan || plan.pilot_uid !== req.pilotId) {
			return res.status(404).json({ error: 'Flight plan not found' })
		}
		const flightRes = await pool.query(
			`SELECT id, started_at, ended_at, distance_nm, landing_rate_fpm, last_ping_at
			 FROM flights
			 WHERE flight_plan_id = $1
			 ORDER BY started_at DESC
			 LIMIT 1`,
			[id]
		)
		const { pilot_uid, ...planData } = plan
		res.json({
			plan: planData,
			flight: flightRes.rows[0] || null,
		})
	} catch (err) {
		next(err)
	}
})

// Cancel a booking: deletes the pending plan, which immediately frees its
// aircraft and callsign.
router.delete('/:id', async (req, res, next) => {
	try {
		const id = Number(req.params.id)
		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ error: 'Invalid flight plan id' })
		}
		const result = await pool.query(
			'DELETE FROM flight_plans WHERE id = $1 AND pilot_uid = $2 AND status = \'pending\'',
			[id, req.pilotId]
		)
		if (result.rowCount === 0) {
			return res.status(404).json({ error: 'Flight plan not found or not cancellable' })
		}
		res.json({ status: 'ok' })
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
	const { callsign, flightNumber, error } = parseOptionalCallsign(req.body)
	if (error) return res.status(400).json({ error })
	const dispatchParams = req.body.dispatch_params
	if (dispatchParams !== undefined && (typeof dispatchParams !== 'object' || dispatchParams === null || Array.isArray(dispatchParams))) {
		return res.status(400).json({ error: 'dispatch_params must be an object' })
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
			if (callsign) {
				const callsignTaken = await client.query(
					`SELECT 1 WHERE ${genuinelyActiveCallsignExistsSql('$1', '$2')}`,
					[callsign, id]
				)
				if (callsignTaken.rows.length > 0) {
					await client.query('ROLLBACK')
					return res.status(409).json({ error: 'This callsign is already in use' })
				}
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
				`UPDATE flight_plans
				 SET fleet_id = $1,
				     dispatched_at = now(),
				     callsign = COALESCE($3, callsign),
				     flight_number = COALESCE($4, flight_number),
				     dispatch_params = COALESCE($5, dispatch_params)
				 WHERE id = $2
				 RETURNING id, departure_icao, arrival_icao, status, fleet_id, dispatched_at, callsign, flight_number, dispatch_params`,
				[fleetId, id, callsign, flightNumber, dispatchParams || null]
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
