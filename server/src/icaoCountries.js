const icaoCountries = require('./data/icao-countries.json')

const overrides = {
	LUXL: 'LU'
}

function countryForIcao(icao) {
	if (!icao || typeof icao !== 'string') return null
	const code = icao.trim().toUpperCase()
	if (!/^[A-Z0-9]{1,4}$/.test(code)) return null
	if (overrides[code]) return overrides[code]
	return icaoCountries[code.slice(0, 2)] || icaoCountries[code.slice(0, 1)] || null
}

module.exports = { countryForIcao }
