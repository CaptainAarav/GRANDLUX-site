import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '../firebase'

function AuthCallback() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const token = searchParams.get('token')
	const redirectPort = searchParams.get('redirect_port')
	const paramError = searchParams.get('error')
	const [status, setStatus] = useState(paramError ? 'error' : token ? 'success' : 'error')
	const done = useRef(false)

	useEffect(() => {
		if (done.current) return
		if (paramError) {
			done.current = true
			setTimeout(() => navigate('/login'), 5000)
			return
		}
		if (!token) {
			done.current = true
			setTimeout(() => navigate('/login'), 5000)
			return
		}
		done.current = true
		signInWithCustomToken(auth, token)
			.then(() => setStatus('success'))
			.catch(() => setStatus('error'))
	}, [token, redirectPort, paramError, navigate])

	useEffect(() => {
		if (status === 'success') {
			const t = setTimeout(() => {
				if (redirectPort) {
					window.location.href = `http://127.0.0.1:${redirectPort}/?token=${token}`
				} else {
					navigate('/')
				}
			}, 5000)
			return () => clearTimeout(t)
		}
		if (status === 'error') {
			const t = setTimeout(() => navigate('/login'), 5000)
			return () => clearTimeout(t)
		}
	}, [status, redirectPort, token, navigate])

	return (
		<div className="background">
			<div className="modal">
				<div className="modal-form">
					<h2>{status === 'success' ? 'Signing you in...' : 'Authentication failed'}</h2>
					{status === 'error' && <p>{paramError || 'No token received'}</p>}
				</div>
			</div>
		</div>
	)
}

export default AuthCallback
