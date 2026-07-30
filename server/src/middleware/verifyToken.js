const { auth } = require('../firebase')

async function verifyToken(req, res, next) {
	const authHeader = req.headers.authorization
	console.log('Received auth header:', authHeader)

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'No token provided' })
	}

	const token = authHeader.split('Bearer ')[1]
	try {
		const decoded = await auth.verifyIdToken(token)
		req.pilotId = decoded.uid
		next()
	} catch (err) {
		console.log('Token verification failed:', err.message)
		res.status(401).json({ error: 'Invalid token' })
	}
}

module.exports = verifyToken
