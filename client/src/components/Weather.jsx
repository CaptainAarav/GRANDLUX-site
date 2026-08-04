export function RiskBadge({ label, value }) {
	const risk = value ? value.toLowerCase() : null
	return (
		<span className={`booking-risk${risk ? ` booking-risk--${risk}` : ' booking-risk--none'}`}>
			Estimated {label} risk: {risk ? risk.charAt(0).toUpperCase() + risk.slice(1) : 'unavailable'}
		</span>
	)
}

export function WeatherStatus({ status, metar, icing, turbulence }) {
	if (status === 'loading') {
		return <p className='booking-weather-value booking-weather-value--muted'>Loading…</p>
	}
	if (status === 'error' || (!metar && !icing && !turbulence)) {
		return <p className='booking-weather-value booking-weather-value--muted'>Weather unavailable</p>
	}
	return (
		<div className='booking-weather-block-body'>
			{metar ? <code className='booking-weather-value'>{metar}</code> : null}
			<div className='booking-risks'>
				<RiskBadge label='icing' value={icing} />
				<RiskBadge label='turbulence' value={turbulence} />
			</div>
		</div>
	)
}
