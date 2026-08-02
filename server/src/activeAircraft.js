// Single source of truth for the "genuinely active" (in use) aircraft rule.
//
// A fleet aircraft is blocking only while:
//   - it's linked to an in_progress flight plan whose flight is still
//     reporting (last_ping_at within 24 hours), or
//   - it's linked to a pending plan that was dispatched within the last
//     24 hours (reserved, but not yet started).
//
// Anything older than 24 hours in either state releases the aircraft
// automatically — no manual cleanup step. This same SQL is imported by both
// GET /api/fleet (what the picker displays) and PATCH /api/flight-plans/:id/
// dispatch (what actually gets enforced), so the two can never drift apart.
//
// Returns a full `EXISTS ( SELECT 1 ... )` expression.
//
//   - fleetRef: SQL expression for the aircraft id in scope of the query,
//     e.g. 'f.id' in the fleet listing or a parameter placeholder.
//   - excludePlanRef: optional SQL expression for a flight plan id to
//     exclude from the check (used by the dispatch guard so the caller's
//     own plan doesn't count against itself).
function genuinelyActiveExistsSql(fleetRef, excludePlanRef) {
	const exclude = excludePlanRef ? `AND fp.id <> ${excludePlanRef}` : ''
	return `EXISTS (
		SELECT 1
		FROM flight_plans fp
		LEFT JOIN flights fl ON fl.flight_plan_id = fp.id
		WHERE fp.fleet_id = ${fleetRef} ${exclude}
		  AND (
			  (fp.status = 'in_progress' AND fl.last_ping_at > now() - interval '24 hours')
			  OR
			  (fp.status = 'pending' AND fp.dispatched_at > now() - interval '24 hours')
		  )
	)`
}

module.exports = { genuinelyActiveExistsSql }
