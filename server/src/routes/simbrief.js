const express = require('express')
const crypto = require('crypto')
const verifyToken = require('../middleware/verifyToken')
const { pool } = require('../db')

const router = express.Router()

router.use(verifyToken)

const FETCHER_BASE = 'https://www.simbrief.com/api/xml.fetcher.php'

// The SimBrief API key must never reach the client. The loader validates an
// `apicode` against orig + dest + type + timestamp + outputpage (with the
// http:// scheme stripped), so we compute it server-side exactly the way the
// reference simbrief.apiv1.php does.
function computeApiCode(orig, dest, type, timestamp, outputpage) {
	const outputpageCalc = String(outputpage).replace('http://', '')
	const apiKey = process.env.SIMBRIEF_API_KEY || ''
	const raw = `${apiKey}${orig}${dest}${type}${timestamp}${outputpageCalc}`
	return {
		apicode: crypto.createHash('md5').update(raw).digest('hex'),
		timestamp: String(timestamp),
		outputpage: outputpageCalc,
	}
}

async function getPilotSimbriefUserid(pilotId) {
	const result = await pool.query(
		'SELECT simbrief_userid FROM pilots WHERE firebase_uid = $1',
		[pilotId]
	)
	return result.rows[0] ? result.rows[0].simbrief_userid : null
}

router.get('/auth-code', async (req, res, next) => {
	try {
		const orig = String(req.query.orig || '').trim().toUpperCase()
		const dest = String(req.query.dest || '').trim().toUpperCase()
		const type = String(req.query.type || '').trim()
		const outputpage = String(req.query.outputpage || '').trim()
		if (!/^[A-Z0-9]{4}$/.test(orig) || !/^[A-Z0-9]{4}$/.test(dest)) {
			return res.status(400).json({ error: 'Valid orig and dest ICAO codes are required' })
		}
		if (!type) {
			return res.status(400).json({ error: 'type is required' })
		}
		if (!outputpage) {
			return res.status(400).json({ error: 'outputpage is required' })
		}
		const userid = await getPilotSimbriefUserid(req.pilotId)
		if (!userid) {
			return res.status(409).json({ error: 'Link your Navigraph/SimBrief account in Preferences first' })
		}
		const timestamp = Math.round(Date.now() / 1000)
		res.json(computeApiCode(orig, dest, type, timestamp, outputpage))
	} catch (err) {
		next(err)
	}
})

// Called by the client after the SimBrief popup closes. Pulls the generated
// OFP from SimBrief using the pilot's user id and the flight plan id as the
// permanent static_id, then stores the raw JSON on the plan so the details
// page never has to talk to SimBrief again.
router.post('/fetch-ofp', async (req, res, next) => {
	try {
		const planId = Number(req.body.plan_id)
		if (!Number.isInteger(planId) || planId <= 0) {
			return res.status(400).json({ error: 'Valid plan_id is required' })
		}
		const userid = await getPilotSimbriefUserid(req.pilotId)
		if (!userid) {
			return res.status(409).json({ error: 'Link your Navigraph/SimBrief account in Preferences first' })
		}
		const planRes = await pool.query(
			'SELECT id, pilot_uid, simbrief_ofp FROM flight_plans WHERE id = $1',
			[planId]
		)
		const plan = planRes.rows[0]
		if (!plan || plan.pilot_uid !== req.pilotId) {
			return res.status(404).json({ error: 'Flight plan not found' })
		}
		if (plan.simbrief_ofp) {
			return res.json({ ofp: plan.simbrief_ofp })
		}
		let ofp
		try {
			const url = `${FETCHER_BASE}?userid=${encodeURIComponent(userid)}&static_id=${encodeURIComponent(planId)}&json=v2`
			const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
			if (!response.ok) {
				return res.status(404).json({ error: 'Flight plan not ready yet' })
			}
			const text = await response.text()
			ofp = text.trim() ? JSON.parse(text) : null
		} catch (err) {
			return res.status(404).json({ error: 'Flight plan not ready yet' })
		}
		// Guard against storing an error-shaped body (e.g. a bad user id) as
		// if it were a real OFP — only an object carrying the modern OFP
		// sections (params + general) is treated as ready.
		const looksLikeOFP = ofp && typeof ofp === 'object' && !Array.isArray(ofp) && !ofp.error && ofp.params && ofp.general
		if (!looksLikeOFP) {
			return res.status(404).json({ error: 'Flight plan not ready yet' })
		}
		const updateRes = await pool.query(
			'UPDATE flight_plans SET simbrief_ofp = $1 WHERE id = $2 RETURNING simbrief_ofp',
			[ofp, planId]
		)
		res.json({ ofp: updateRes.rows[0].simbrief_ofp })
	} catch (err) {
		next(err)
	}
})

module.exports = router
