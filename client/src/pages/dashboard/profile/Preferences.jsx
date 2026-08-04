import { useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import './Preferences.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'
const DEFAULT_PFP = '/default-pfp.jpg'

async function apiFetch(user, path, options = {}) {
	const token = await user.getIdToken()
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${token}`,
			...(options.headers || {}),
		},
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) throw new Error(data.error || 'Request failed')
	return data
}

function Preferences() {
	const { user } = useAuth()
	const [me, setMe] = useState(null)
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState('')

	const [profile, setProfile] = useState({ first_name: '', last_name: '', callsign: '' })
	const [profileSaving, setProfileSaving] = useState(false)
	const [profileMsg, setProfileMsg] = useState({ ok: '', error: '' })

	const [distanceUnit, setDistanceUnit] = useState('nm')
	const [emailNotifications, setEmailNotifications] = useState(true)
	const [settingsMsg, setSettingsMsg] = useState({ ok: '', error: '' })

	const [uploading, setUploading] = useState(false)
	const [pfpError, setPfpError] = useState('')

	const [userid, setUserid] = useState('')
	const [useridSaving, setUseridSaving] = useState(false)
	const [useridMsg, setUseridMsg] = useState({ ok: '', error: '' })

	useEffect(() => {
		if (!user) return
		let ignore = false
		apiFetch(user, '/api/pilots/me')
			.then((data) => {
				if (ignore) return
				setMe(data)
				setProfile({
					first_name: data.first_name || '',
					last_name: data.last_name || '',
					callsign: data.callsign || '',
				})
				setDistanceUnit(data.distance_unit || 'nm')
				setEmailNotifications(data.email_notifications !== false)
				setUserid(data.simbrief_userid || '')
				setLoading(false)
			})
			.catch((err) => {
				if (ignore) return
				setLoadError(err.message)
				setLoading(false)
			})
		return () => {
			ignore = true
		}
	}, [user])

	async function handleProfileSave() {
		setProfileSaving(true)
		setProfileMsg({ ok: '', error: '' })
		try {
			const body = {}
			if (profile.first_name.trim()) body.first_name = profile.first_name.trim()
			if (profile.last_name.trim()) body.last_name = profile.last_name.trim()
			if (profile.callsign.trim()) body.callsign = profile.callsign.trim()
			const res = await apiFetch(user, '/api/pilots/me/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			setMe((m) => ({ ...m, ...res }))
			setProfileMsg({ ok: 'Profile saved.', error: '' })
		} catch (err) {
			setProfileMsg({ ok: '', error: err.message })
		} finally {
			setProfileSaving(false)
		}
	}

	async function handleSettingsSave() {
		setSettingsMsg({ ok: '', error: '' })
		try {
			const res = await apiFetch(user, '/api/pilots/me/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ distance_unit: distanceUnit, email_notifications: emailNotifications }),
			})
			setMe((m) => ({ ...m, ...res }))
			setSettingsMsg({ ok: 'Preferences saved.', error: '' })
		} catch (err) {
			setSettingsMsg({ ok: '', error: err.message })
		}
	}

	async function handleFileSelected(e) {
		const file = e.target.files && e.target.files[0]
		e.target.value = ''
		if (!file) return
		setUploading(true)
		setPfpError('')
		try {
			const auth = await apiFetch(user, '/api/imagekit/auth')
			const ext = file.name.split('.').pop() || 'jpg'
			const form = new FormData()
			form.append('file', file)
			form.append('fileName', `avatar-${Date.now()}.${ext}`)
			form.append('publicKey', auth.publicKey)
			form.append('token', auth.token)
			form.append('expire', String(auth.expire))
			form.append('signature', auth.signature)
			const up = await fetch(IMAGEKIT_UPLOAD_URL, { method: 'POST', body: form })
			const upData = await up.json()
			if (!up.ok) throw new Error(upData.message || 'Upload failed')
			const res = await apiFetch(user, '/api/pilots/me/pfp', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pfp_url: upData.url }),
			})
			setMe((m) => ({ ...m, pfp_url: res.pfp_url }))
		} catch (err) {
			setPfpError(err.message)
		} finally {
			setUploading(false)
		}
	}

	async function handleUseridSave() {
		setUseridSaving(true)
		setUseridMsg({ ok: '', error: '' })
		try {
			const res = await apiFetch(user, '/api/pilots/me/simbrief', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userid: userid.trim() }),
			})
			setMe((m) => ({ ...m, simbrief_userid: res.simbrief_userid }))
			setUseridMsg({ ok: 'Account linked.', error: '' })
		} catch (err) {
			setUseridMsg({ ok: '', error: err.message })
		} finally {
			setUseridSaving(false)
		}
	}

	if (loading) {
		return (
			<div className='dashboard-wrapper'>
				<h1>Preferences</h1>
				<p className='preferences-hint'>Loading…</p>
			</div>
		)
	}

	return (
		<div className='dashboard-wrapper'>
			<h1>Preferences</h1>
			{loadError && <p className='preferences-error'>{loadError}</p>}

			<section className='preferences-section'>
				<h2 className='preferences-section-title'>Profile picture</h2>
				<p className='preferences-hint'>Upload a photo to display across the app.</p>
				<div className='preferences-pfp-row'>
					<img className='preferences-pfp' src={(me && me.pfp_url) || DEFAULT_PFP} alt='Profile' />
					<label className='preferences-btn preferences-btn--file'>
						{uploading ? 'Uploading…' : 'Choose photo'}
						<input type='file' accept='image/*' onChange={handleFileSelected} disabled={uploading} />
					</label>
				</div>
				{pfpError && <p className='preferences-error'>{pfpError}</p>}
			</section>

			<section className='preferences-section'>
				<h2 className='preferences-section-title'>Name & callsign</h2>
				<div className='preferences-grid'>
					<label className='preferences-field-label'>First name</label>
					<input
						className='preferences-input'
						type='text'
						value={profile.first_name}
						onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
						maxLength={50}
					/>
					<label className='preferences-field-label'>Last name</label>
					<input
						className='preferences-input'
						type='text'
						value={profile.last_name}
						onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
						maxLength={50}
					/>
					<label className='preferences-field-label'>Callsign</label>
					<input
						className='preferences-input'
						type='text'
						value={profile.callsign}
						onChange={(e) => setProfile((p) => ({ ...p, callsign: e.target.value.toUpperCase() }))}
						maxLength={20}
						placeholder='GLX…'
					/>
				</div>
				<button className='preferences-btn' onClick={handleProfileSave} disabled={profileSaving}>
					{profileSaving ? 'Saving…' : 'Save profile'}
				</button>
				{profileMsg.ok && <p className='preferences-success'>{profileMsg.ok}</p>}
				{profileMsg.error && <p className='preferences-error'>{profileMsg.error}</p>}
			</section>

			<section className='preferences-section'>
				<h2 className='preferences-section-title'>Preferences</h2>
				<label className='preferences-field-label'>Distance unit</label>
				<select className='preferences-select' value={distanceUnit} onChange={(e) => setDistanceUnit(e.target.value)}>
					<option value='nm'>Nautical miles</option>
					<option value='sm'>Statute miles</option>
					<option value='km'>Kilometres</option>
				</select>
				<label className='preferences-toggle-row'>
					<input
						type='checkbox'
						checked={emailNotifications}
						onChange={(e) => setEmailNotifications(e.target.checked)}
					/>
					<span>
						<strong>Email notifications</strong>
						<p className='preferences-hint'>Receive updates about your bookings and flights by email.</p>
					</span>
				</label>
				<button className='preferences-btn' onClick={handleSettingsSave}>
					Save preferences
				</button>
				{settingsMsg.ok && <p className='preferences-success'>{settingsMsg.ok}</p>}
				{settingsMsg.error && <p className='preferences-error'>{settingsMsg.error}</p>}
			</section>

			<section className='preferences-section'>
				<h2 className='preferences-section-title'>Link Navigraph</h2>
				<p className='preferences-hint'>
					Linking your Navigraph/SimBrief account lets the dispatch flow generate a real SimBrief
					operational flight plan for each booking. Enter your SimBrief user id or username.
				</p>
				<div className='preferences-row'>
					<input
						className='preferences-input'
						type='text'
						value={userid}
						onChange={(e) => setUserid(e.target.value)}
						placeholder='SimBrief user id'
						maxLength={64}
					/>
					<button className='preferences-btn' onClick={handleUseridSave} disabled={useridSaving || !userid.trim()}>
						{useridSaving ? 'Saving…' : 'Save'}
					</button>
				</div>
				{useridMsg.ok && <p className='preferences-success'>{useridMsg.ok}</p>}
				{useridMsg.error && <p className='preferences-error'>{useridMsg.error}</p>}
			</section>
		</div>
	)
}

export default Preferences
