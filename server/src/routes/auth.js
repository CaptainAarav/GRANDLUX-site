const express = require('express')
const axios = require('axios')
const { auth } = require('../firebase')

const router = express.Router()

const CLIENT_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

async function createOrUpdateFirebaseUser(uid, displayName, photoURL, extraClaims) {
	try {
		await auth.getUser(uid)
	} catch {
		await auth.createUser({ uid, displayName, photoURL })
	}
	await auth.updateUser(uid, { displayName, photoURL })
	return auth.createCustomToken(uid, extraClaims)
}

router.get('/discord/login', (req, res) => {
	const redirectPort = req.query.redirect_port || ''
	const state = JSON.stringify({ clientOrigin: CLIENT_ORIGIN, redirectPort })
	const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/discord/callback`
	const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify&state=${encodeURIComponent(state)}`
	res.redirect(url)
})

router.get('/discord/callback', async (req, res) => {
	const { code, state } = req.query
	let clientOrigin = CLIENT_ORIGIN
	let redirectPort = ''
	try { const s = JSON.parse(state); clientOrigin = s.clientOrigin || CLIENT_ORIGIN; redirectPort = s.redirectPort || '' } catch {}
	try {
		const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/discord/callback`
		const tokenRes = await axios.post('https://discord.com/api/oauth2/token',
			new URLSearchParams({
				client_id: process.env.DISCORD_CLIENT_ID,
				client_secret: process.env.DISCORD_CLIENT_SECRET,
				code,
				grant_type: 'authorization_code',
				redirect_uri: redirectUri,
			}),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
		)
		const userRes = await axios.get('https://discord.com/api/users/@me', {
			headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
		})
		const u = userRes.data
		const uid = `discord:${u.id}`
		const displayName = u.global_name || u.username
		const photoURL = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : ''
		const firebaseToken = await createOrUpdateFirebaseUser(uid, displayName, photoURL, { provider: 'discord' })
		const params = new URLSearchParams({ token: firebaseToken, provider: 'discord' })
		if (redirectPort) params.set('redirect_port', redirectPort)
		res.redirect(`${clientOrigin}/auth/callback?${params}`)
	} catch (err) {
		console.error('Discord OAuth error:', err.response?.data || err.message)
		res.redirect(`${clientOrigin}/auth/callback?error=discord_auth_failed`)
	}
})

router.get('/vatsim/login', (req, res) => {
	const redirectPort = req.query.redirect_port || ''
	const state = JSON.stringify({ clientOrigin: CLIENT_ORIGIN, redirectPort })
	const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/vatsim/callback`
	const url = `https://auth.vatsim.net/oauth/authorize?client_id=${process.env.VATSIM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=vatsim_details+email&state=${encodeURIComponent(state)}`
	res.redirect(url)
})

router.get('/vatsim/callback', async (req, res) => {
	const { code, state } = req.query
	let clientOrigin = CLIENT_ORIGIN
	let redirectPort = ''
	try { const s = JSON.parse(state); clientOrigin = s.clientOrigin || CLIENT_ORIGIN; redirectPort = s.redirectPort || '' } catch {}
	try {
		const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/vatsim/callback`
		const tokenRes = await axios.post('https://auth.vatsim.net/oauth/token',
			new URLSearchParams({
				client_id: process.env.VATSIM_CLIENT_ID,
				client_secret: process.env.VATSIM_CLIENT_SECRET,
				code,
				grant_type: 'authorization_code',
				redirect_uri: redirectUri,
			}),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
		)
		const userRes = await axios.get('https://auth.vatsim.net/api/user', {
			headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
		})
		const u = userRes.data.data.user
		const uid = `vatsim:${u.id}`
		const displayName = `${u.name_first} ${u.name_last}`
		const photoURL = ''
		const firebaseToken = await createOrUpdateFirebaseUser(uid, displayName, photoURL, {
			provider: 'vatsim',
			cid: u.id,
		})
		const params = new URLSearchParams({ token: firebaseToken, provider: 'vatsim' })
		if (redirectPort) params.set('redirect_port', redirectPort)
		res.redirect(`${clientOrigin}/auth/callback?${params}`)
	} catch (err) {
		console.error('VATSIM OAuth error:', err.response?.data || err.message)
		res.redirect(`${clientOrigin}/auth/callback?error=vatsim_auth_failed`)
	}
})

module.exports = router
