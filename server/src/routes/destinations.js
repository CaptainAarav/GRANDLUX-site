const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const { pool } = require('../db')
const { countryForIcao } = require('../icaoCountries')

const router = express.Router()

router.use(verifyToken)

router.get('/', async (req, res, next) => {
	try {
		const result = await pool.query(
			"SELECT icao, name, lat, lon, aircraft_type, notes FROM destinations WHERE active = true ORDER BY name"
		)
		const rows = result.rows.map((dest) => ({ ...dest, country: countryForIcao(dest.icao) }))
		res.json(rows)
	} catch (err) {
		next(err)
	}
})

module.exports = router
