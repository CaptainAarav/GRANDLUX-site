const { auth } = require('../firebase')

async function verifyToken(req, res, next) {
	const authHeader = req.headers.authorization
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'No token provided' })
	}
	const token = authHeader.split('Bearer ')[1]
	try {
		const decoded = await auth.verifyIdToken(token)
		req.pilotId = decoded.uid
		next()
	} catch (err) {
		res.status(401).json({ error: 'Invalid token' })
	}
}

module.exports = verifyToken