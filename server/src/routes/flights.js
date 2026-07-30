const express = require('express')
const verifyToken = require('../middleware/verifyToken')

const router = express.Router()

router.post('/ping', verifyToken, (req, res) => {
	const { lat, lng, altitude, heading, speed } = req.body
	if (lat != null && (typeof lat !== 'number' || lat < -90 || lat > 90)) {
		return res.status(400).json({ error: 'Invalid lat' })
	}
	if (lng != null && (typeof lng !== 'number' || lng < -180 || lng > 180)) {
		return res.status(400).json({ error: 'Invalid lng' })
	}
	console.log('Ping from pilot:', req.pilotId)
	console.log('Data:', req.body)
	res.json({ status: 'ok' })
})

module.exports = router
