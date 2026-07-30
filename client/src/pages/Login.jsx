import { NavLink } from 'react-router-dom'
import { useState, useEffect, useCallback } from "react";
import './Login.css'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuth } from '../useAuth'

function Login() {
	const { user, loading } = useAuth()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [rememberMe, setRememberMe] = useState(false)
	const [error, setError] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const redirectPort = new URLSearchParams(window.location.search).get('redirect_port')

	const completeLogin = useCallback(async (firebaseUser) => {
		const token = await firebaseUser.getIdToken()
		if (redirectPort) {
			window.location.href = `http://127.0.0.1:${redirectPort}/?token=${token}`
		} else {
			window.location.href = '/'
		}
	}, [redirectPort])

	useEffect(() => {
		if (!loading && user) {
			completeLogin(user).catch((err) => setError(err.message))
		}
	}, [user, loading, completeLogin])

	async function handleEmailSubmit(e) {
		e.preventDefault()
		setError('')
		try {
			await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
			const userCredential = await signInWithEmailAndPassword(auth, email, password)
			completeLogin(userCredential.user)
		} catch (err) {
			setError(err.message)
		}
	}

	const AUTH_SERVER = import.meta.env.VITE_API_URL || 'http://localhost:4000'

	function handleOAuthRedirect(provider) {
		const redirectPort = new URLSearchParams(window.location.search).get('redirect_port')
		let url = `${AUTH_SERVER}/api/auth/${provider}/login`
		if (redirectPort) url += `?redirect_port=${redirectPort}`
		window.location.href = url
	}

	async function handleGoogleClick() {
		setError('')
		try {
			const userCredential = await signInWithPopup(auth, googleProvider)
			completeLogin(userCredential.user)
		} catch (err) {
			setError(err.message)
		}
	}

	return (
		<div className="background">
			<div className="modal">
				<div className="modal-form">
					<div className="title-container">
						<img className="logo" src="/grandlux-logo.png" />
						<h1 className="title">GrandLux</h1>
					</div>
					<h2 className="subtitle">Welcome Back</h2>
					{error && <p className="login-error">{error}</p>}

					<form onSubmit={handleEmailSubmit} className="auth-form">
						<div className="input-container">
							<label htmlFor="email-input">Email Address</label>
							<input id="email-input" className="input-box" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" />
						</div>
						<div className="input-container">
							<div className="password-text-container">
								<label htmlFor="password-input">Password</label>
								<a className="forgot-password-link" href="">Forgot password?</a>
							</div>
							<div className="password-input-wrapper">
								<input value={password} onChange={e => setPassword(e.target.value)} id="password-input" className="input-box" type={showPassword ? "text" : "password"} placeholder="Enter your password" />
								<i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} password-toggle-icon`} onClick={() => setShowPassword(!showPassword)}></i>
							</div>
						</div>
						<div className="alignment-container">
							<div className="remember-me-container">
								<input checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} id="remember-me-radio" type="checkbox" className="remember-checkbox" />
								<label htmlFor="remember-me-radio">Remember me</label>
							</div>
							<button type="submit" className="login-btn">Log In</button>
						</div>
					</form>

					<div className="divider-container">
						<div className="line"></div>
						<p className="divider-text">or</p>
						<div className="line"></div>
					</div>

					<div className="oauth-buttons">
						<button type="button" onClick={handleGoogleClick} className="google-btn">
							<i className="fa-brands fa-google"></i>
							<p className="btn-text">Sign in with Google</p>
						</button>
						<button type="button" onClick={() => handleOAuthRedirect('discord')} className="oauth-btn discord-btn">
							<i className="fa-brands fa-discord"></i>
							<p className="btn-text">Sign in with Discord</p>
						</button>
						<button type="button" onClick={() => handleOAuthRedirect('vatsim')} className="oauth-btn vatsim-btn">
							<i className="fa-solid fa-plane"></i>
							<p className="btn-text">Sign in with VATSIM</p>
						</button>
					</div>

					<p>Is it your first time? <NavLink className="sign-up-link" to="/getstarted">Sign up</NavLink></p>
				</div>
				<div className="modal-liveries">
					<div className="liveries-container">
						<img src="/a320-grandlux-livery.png" className="livery-plane livery-a320" />
						<img src="/grandlux-737-livery.png" className="livery-plane livery-737" />
					</div>
				</div>
			</div>
		</div>
	)
}

export default Login