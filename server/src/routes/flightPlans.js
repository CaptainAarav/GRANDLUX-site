const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const { pool, ensurePilot } = require('../db')

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
			"SELECT id, departure_icao, arrival_icao FROM flight_plans WHERE pilot_uid = $1 AND status = 'pending' ORDER BY created_at DESC",
			[req.pilotId]
		)
		res.json(result.rows)
	} catch (err) {
		next(err)
	}
})

module.exports = router
