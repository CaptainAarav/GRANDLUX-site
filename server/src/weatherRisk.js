const KT_PER_MS = 1.943844

function computeIcingRisk(tempC, cloudCoverPct, precipPresent) {
	const cold = tempC >= -20 && tempC <= 0
	const moisture = cloudCoverPct > 50 || precipPresent
	if (!cold || !moisture) return 'low'
	if (tempC >= -10 && tempC <= 0) return 'high'
	return 'moderate'
}

function computeTurbulenceRisk(windKt) {
	if (windKt > 40) return 'high'
	if (windKt > 25) return 'moderate'
	return 'low'
}

function risksFromOwmEntry(entry) {
	const tempC = entry && entry.main ? entry.main.temp : null
	const cloudCoverPct = entry && entry.clouds ? entry.clouds.all : null
	const windKt = entry && entry.wind && entry.wind.speed != null ? entry.wind.speed * KT_PER_MS : null
	if (tempC == null || cloudCoverPct == null || windKt == null) return null
	const rain = entry.rain ? Number(entry.rain['3h'] || 0) : 0
	const snow = entry.snow ? Number(entry.snow['3h'] || 0) : 0
	const precipPresent = rain > 0 || snow > 0 || (entry.pop != null && entry.pop >= 0.5)
	return {
		icing: computeIcingRisk(tempC, cloudCoverPct, precipPresent),
		turbulence: computeTurbulenceRisk(windKt),
	}
}

module.exports = { computeIcingRisk, computeTurbulenceRisk, risksFromOwmEntry }
