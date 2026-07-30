const express = require('express')
const verifyToken = require('../middleware/verifyToken')

const router = express.Router()

router.post('/ping', verifyToken, (req, res) => {
	console.log('Ping from pilot:', req.pilotId)
	console.log('Data:', req.body)
	res.json({ status: 'ok' })
})

module.exports = router