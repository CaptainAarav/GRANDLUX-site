export function formatHours(hours) {
	const h = Math.floor(hours)
	const m = Math.round((hours - h) * 60)
	return `${h}h ${m}m`
}

export function formatDistance(nm) {
	return `${Math.round(nm).toLocaleString('en-US')} NM`
}

export function formatDuration(startedAt, endedAt) {
	const totalMinutes = Math.max(0, Math.floor((new Date(endedAt) - new Date(startedAt)) / 60000))
	const h = Math.floor(totalMinutes / 60)
	const m = totalMinutes % 60
	return `${h}h ${m}m`
}

export function formatDate(iso) {
	return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
