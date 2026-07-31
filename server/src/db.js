require('dotenv').config()

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
})

async function ensurePilot(pilotUid) {
	await pool.query(
		'INSERT INTO pilots (firebase_uid) VALUES ($1) ON CONFLICT (firebase_uid) DO NOTHING',
		[pilotUid]
	)
}

module.exports = { pool, ensurePilot }
