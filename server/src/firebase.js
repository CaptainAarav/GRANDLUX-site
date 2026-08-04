const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

// Render deploys read the full service account JSON from the
// FIREBASE_SERVICE_ACCOUNT env var (the gitignored serviceAccountKey.json
// file only exists locally). The env var takes precedence; otherwise fall
// back to the local file so `npm start` keeps working unchanged in dev.
function loadServiceAccount() {
	if (process.env.FIREBASE_SERVICE_ACCOUNT) {
		return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
	}
	try {
		return require('../serviceAccountKey.json')
	} catch (err) {
		throw new Error(
			'Firebase credentials missing: set FIREBASE_SERVICE_ACCOUNT or add server/serviceAccountKey.json'
		)
	}
}

const app = initializeApp({
	credential: cert(loadServiceAccount())
})

const auth = getAuth(app)

module.exports = { auth }
