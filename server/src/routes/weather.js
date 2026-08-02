const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const { pool } = require('../db')
const { risksFromOwmEntry } = require('../weatherRisk')

const router = express.Router()

router.use(verifyToken)

const HUB_COORDS = { lat: 49.6233, lon: 6.2044 }

async function airportCoords(icao) {
	if (icao === 'ELLX') return HUB_COORDS
	const result = await pool.query('SELECT lat, lon FROM destinations WHERE icao = $1', [icao])
	if (result.rows.length === 0) return null
	return { lat: Number(result.rows[0].lat), lon: Number(result.rows[0].lon) }
}

async function fetchMetar(icao) {
	const response = await fetch(
		`https://aviationweather.gov/api/data/metar?format=json&ids=${encodeURIComponent(icao)}`,
		{ signal: AbortSignal.timeout(10000) }
	)
	if (!response.ok) {
		throw new Error('Weather provider unavailable')
	}
	const text = await response.text()
	const data = text.trim() ? JSON.parse(text) : []
	const report = Array.isArray(data) ? data[0] : null
	if (!report || !report.rawOb) {
		return { icao, metar: null, name: null }
	}
	return { icao, metar: report.rawOb, name: report.name || null, obsTime: report.obsTime || null }
}

async function fetchOwmRisks(icao) {
	const key = process.env.OWM_API_KEY
	if (!key) return null
	try {
		const coords = await airportCoords(icao)
		if (!coords) return null
		const response = await fetch(
			`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${key}&units=metric`,
			{ signal: AbortSignal.timeout(10000) }
		)
		if (!response.ok) return null
		const data = await response.json()
		const entry = Array.isArray(data.list) ? data.list[0] : null
		if (!entry) return null
		return risksFromOwmEntry(entry)
	} catch {
		return null
	}
}

router.get('/:icao', async (req, res, next) => {
	const icao = String(req.params.icao || '').trim().toUpperCase()
	if (!/^[A-Z]{4}$/.test(icao)) {
		return res.status(400).json({ error: 'Invalid ICAO code' })
	}
	try {
		const metar = await fetchMetar(icao)
		const risks = await fetchOwmRisks(icao)
		res.json({
			...metar,
			icing: risks ? risks.icing : null,
			turbulence: risks ? risks.turbulence : null,
			estimated: true,
		})
	} catch (err) {
		res.status(502).json({ error: 'Weather provider unavailable' })
	}
})

module.exports = router
