const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const SIMBRIEF_TYPE = {
	'A320 CEO': 'A320',
	A32N: 'A20N',
	'A21N LR': 'A21N',
	'A21N NEO': 'A21N',
	B738: 'B738',
	B38M: 'B38M',
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function simbriefType(aircraftType) {
	return SIMBRIEF_TYPE[aircraftType] || aircraftType
}

function toSimbriefDate(iso) {
	const [y, m, d] = iso.split('-').map(Number)
	return `${String(d).padStart(2, '0')}${MONTHS[m - 1]}${String(y).slice(2)}`
}

// The callsign is GLX + a flight-number suffix (2 digits + 1 letter, e.g.
// "11A", or 1 digit + 2 letters, e.g. "1AA"). If the flight number is the
// callsign suffix, the airline prefix is whatever precedes it (GLX).
export function callsignParts(callsign, flightNumber) {
	if (flightNumber && (callsign || '').endsWith(flightNumber)) {
		return { airline: callsign.slice(0, -flightNumber.length) || callsign, fltnum: flightNumber }
	}
	const airline = (callsign || '').replace(/[0-9]+$/, '') || callsign
	return { airline, fltnum: flightNumber || '' }
}

// Builds the hidden form posted to SimBrief's OFP loader. The API key
// validation only involves orig + dest + type + timestamp + outputpage, so the
// rest of the fields are free dispatch options: schedule, payload, fuel,
// alternates, and the SimBrief settings toggles.
export function buildSimBriefFields({
	planId,
	auth,
	registration,
	aircraftType,
	orig,
	dest,
	callsign,
	flightNumber,
	date,
	time,
	eteHours,
	costIndex,
	cruiseFl,
	pax,
	bags,
	fuel,
	alternates,
	options,
}) {
	const type = simbriefType(aircraftType)
	const [depH, depM] = time.split(':').map((n) => Number(n))
	const { airline, fltnum } = callsignParts(callsign, flightNumber)
	const fields = {
		orig,
		dest,
		type,
		reg: registration,
		static_id: String(planId),
		apicode: auth.apicode,
		outputpage: auth.outputpage,
		timestamp: auth.timestamp,
		airline,
		fltnum,
		date: toSimbriefDate(date),
		deph: depH,
		depm: depM,
		units: 'KGS',
		maps: 'detail',
		navlog: options.navlog ? 1 : 0,
		etops: options.etops ? 1 : 0,
		stepclimbs: options.stepclimbs ? 1 : 0,
		tlr: options.tlr ? 1 : 0,
		notams: options.notams ? 1 : 0,
		firnot: options.firnot ? 1 : 0,
	}
	if (eteHours != null) {
		fields.steh = Math.floor(eteHours)
		fields.stem = Math.round((eteHours - Math.floor(eteHours)) * 60)
	}
	if (costIndex != null) fields.ci = costIndex
	if (cruiseFl) fields.fl = cruiseFl
	if (pax) fields.pax = pax
	if (bags) fields.bags = bags
	if (fuel) fields.fuel = fuel
	if (alternates) fields.alternates = alternates
	return fields
}

async function fetchOfp(user, planId) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}/api/simbrief/fetch-ofp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify({ plan_id: planId }),
	})
	return res.ok
}

// Opens the SimBrief OFP loader popup with the built fields, waits for the
// popup to close, then polls SimBrief until the OFP has been published.
export async function generateSimBrief(user, planId, params) {
	const { orig, dest, aircraftType } = params
	const outputpage = `${window.location.origin}/dashboard/booking/flight/${planId}`
	const token = await user.getIdToken()
	const res = await fetch(
		`${API_BASE}/api/simbrief/auth-code?orig=${encodeURIComponent(orig)}&dest=${encodeURIComponent(dest)}&type=${encodeURIComponent(simbriefType(aircraftType))}&outputpage=${encodeURIComponent(outputpage)}`,
		{ headers: { Authorization: `Bearer ${token}` } }
	)
	const auth = await res.json()
	if (!res.ok) throw new Error(auth.error || 'Could not start SimBrief')

	const popup = window.open('about:blank', 'SBworker', 'width=600,height=315')
	if (!popup) throw new Error('Please disable your pop-up blocker to generate a flight plan')

	const form = document.createElement('form')
	form.setAttribute('method', 'get')
	form.setAttribute('action', 'https://www.simbrief.com/ofp/ofp.loader.api.php')
	form.setAttribute('target', 'SBworker')
	const fields = buildSimBriefFields({ planId, auth, outputpage, ...params })
	for (const [name, value] of Object.entries(fields)) {
		const input = document.createElement('input')
		input.setAttribute('type', 'hidden')
		input.setAttribute('name', name)
		input.setAttribute('value', String(value))
		form.appendChild(input)
	}
	document.body.appendChild(form)
	form.submit()
	form.remove()

	// The popup closes itself when generation finishes.
	await new Promise((resolve) => {
		const started = Date.now()
		const timer = setInterval(() => {
			if (popup.closed || Date.now() - started > 120000) {
				clearInterval(timer)
				resolve()
			}
		}, 500)
	})

	// SimBrief needs a moment to publish the OFP file; poll until it shows up.
	for (let i = 0; i < 8; i += 1) {
		if (await fetchOfp(user, planId)) return
		await delay(2500)
	}
	throw new Error('SimBrief finished but the flight plan could not be retrieved yet')
}
