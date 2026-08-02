const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const { pool } = require('../db')
const { genuinelyActiveExistsSql } = require('../activeAircraft')

const router = express.Router()

router.use(verifyToken)

router.get('/', async (req, res, next) => {
	try {
		const result = await pool.query(
			`SELECT f.id, f.registration, f.aircraft_type,
				${genuinelyActiveExistsSql('f.id')} AS in_use
			 FROM fleet f
			 WHERE f.active = true
			 ORDER BY f.registration`
		)
		res.json(result.rows)
	} catch (err) {
		next(err)
	}
})

module.exports = router
