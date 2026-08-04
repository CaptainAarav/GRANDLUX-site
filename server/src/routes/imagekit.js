const express = require('express')
const crypto = require('crypto')
const verifyToken = require('../middleware/verifyToken')

const router = express.Router()

router.use(verifyToken)

// Signature for ImageKit's client-side upload. The browser POSTs the file
// directly to ImageKit along with these parameters; the signature is
// HMAC-SHA1(privateKey, token + expire), base64-encoded.
router.get('/auth', (req, res) => {
	const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
	const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
	if (!publicKey || !privateKey) {
		return res.status(503).json({ error: 'ImageKit is not configured on the server' })
	}
	const token = crypto.randomUUID()
	const expire = Math.floor(Date.now() / 1000) + 60 * 60
	const signature = Buffer.from(
		crypto.createHmac('sha1', privateKey).update(`${token}${expire}`).digest()
	).toString('base64')
	res.json({
		publicKey,
		urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
		token,
		expire,
		signature,
	})
})

module.exports = router
