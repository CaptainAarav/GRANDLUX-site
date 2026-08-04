import { matchingAircraft } from '../lib/aircraft'

// Shared aircraft selection used by the Flights dispatch list and the booking
// dispatch page. Shows priority aircraft first (in-use ones greyed out), and
// when every priority aircraft is taken, offers any other available tail.
function DispatchPicker({
	fleet,
	destinations,
	departureIcao,
	arrivalIcao,
	value,
	onChange,
	disabled = false,
}) {
	const priority = matchingAircraft(fleet, destinations, departureIcao, arrivalIcao)
	const priorityFree = priority.filter((a) => !a.in_use)
	const showFallback = priorityFree.length === 0
	const fallback = showFallback ? fleet.filter((a) => !a.in_use) : []
	const empty = priority.length === 0 && fallback.length === 0

	return (
		<div className='dispatch'>
			<div className='dispatch-row'>
				<select
					className='dispatch-select'
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled || empty}
				>
					<option value=''>Select aircraft…</option>
					<optgroup label='Priority aircraft'>
						{priority.map((a) => (
							<option key={a.id} value={a.registration} disabled={a.in_use}>
								{a.registration} · {a.aircraft_type}{a.in_use ? ' — in use' : ''}
							</option>
						))}
					</optgroup>
					{showFallback && fallback.length > 0 && (
						<optgroup label='Other available aircraft'>
							{fallback.map((a) => (
								<option key={a.id} value={a.registration}>
									{a.registration} · {a.aircraft_type}
								</option>
							))}
						</optgroup>
					)}
				</select>
			</div>
			{!showFallback && priority.some((a) => a.in_use) && (
				<p className='dispatch-hint'>Greyed-out aircraft are already in use and can't be assigned.</p>
			)}
			{showFallback && fallback.length > 0 && (
				<p className='dispatch-hint'>All priority aircraft are in use — you can dispatch any other available aircraft instead.</p>
			)}
			{empty && (
				<p className='dispatch-hint'>No aircraft are currently available for this route.</p>
			)}
		</div>
	)
}

export default DispatchPicker
