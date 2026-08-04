// Single source of truth for the "genuinely active" rule.
//
// A flight plan is blocking only while:
//   - it's in_progress and its flight is still reporting (last_ping_at
//     within 24 hours), or
//   - it's pending and was dispatched within the last 24 hours (reserved,
//     but not yet started).
//
// Anything older than 24 hours in either state releases the resource
// automatically — no manual cleanup step. The same condition is shared by:
//   - GET /api/fleet          (what the picker displays)
//   - PATCH /:id/dispatch     (what actually gets enforced)
//   - GET /api/flight-plans/active (smart-entry redirect)
//   - callsign availability checks
// so the pieces can never drift apart.
//
// All helpers return a full `EXISTS ( SELECT 1 ... )` expression.

function activeConditionExpr(keyRef, keyColumn, excludePlanRef) {
	const exclude = excludePlanRef ? `AND fp.id <> ${excludePlanRef}` : ''
	return `(
		fp.${keyColumn} = ${keyRef} ${exclude}
		AND (
			(fp.status = 'in_progress' AND fl.last_ping_at > now() - interval '24 hours')
			OR
			(fp.status = 'pending' AND fp.dispatched_at > now() - interval '24 hours')
		)
	)`
}

function genuinelyActiveExistsSql(fleetRef, excludePlanRef) {
	return `EXISTS (
		SELECT 1
		FROM flight_plans fp
		LEFT JOIN flights fl ON fl.flight_plan_id = fp.id
		WHERE ${activeConditionExpr(fleetRef, 'fleet_id', excludePlanRef)}
	)`
}

function genuinelyActiveCallsignExistsSql(callsignRef, excludePlanRef) {
	return `EXISTS (
		SELECT 1
		FROM flight_plans fp
		LEFT JOIN flights fl ON fl.flight_plan_id = fp.id
		WHERE ${activeConditionExpr(callsignRef, 'callsign', excludePlanRef)}
	)`
}

function genuinelyActivePlanExistsSql(pilotRef, excludePlanRef) {
	return `EXISTS (
		SELECT 1
		FROM flight_plans fp
		LEFT JOIN flights fl ON fl.flight_plan_id = fp.id
		WHERE ${activeConditionExpr(pilotRef, 'pilot_uid', excludePlanRef)}
	)`
}

module.exports = {
	genuinelyActiveExistsSql,
	genuinelyActiveCallsignExistsSql,
	genuinelyActivePlanExistsSql,
}
