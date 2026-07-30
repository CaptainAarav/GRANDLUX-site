import React from "react";
import { NavLink } from 'react-router-dom'
import { useState, useEffect } from "react";
import './Login.css'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

function Login() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [rememberMe, setRememberMe] = useState(false)
	const [error, setError] = useState("")
	const [redirectPort, setRedirectPort] = useState(null)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		setRedirectPort(params.get('redirect_port'))
	}, [])

	async function completeLogin(userCredential) {
		const token = await userCredential.user.getIdToken()
		if (redirectPort) {
			window.location.href = `http://127.0.0.1:${redirectPort}/?token=${token}`
		} else {
			window.location.href = '/'
		}
	}

	async function handleEmailSubmit(e) {
		e.preventDefault()
		setError('')
		try {
			await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
			const userCredential = await signInWithEmailAndPassword(auth, email, password)
			completeLogin(userCredential)
		} catch (err) {
			setError(err.message)
		}
	}

	async function handleGoogleClick() {
		setError('')
		try {
			const userCredential = await signInWithPopup(auth, googleProvider)
			completeLogin(userCredential)
		} catch (err) {
			setError(err.message)
		}
	}

	return (
		<div className="background">
			<div className="modal">
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
						<input value={password} onChange={e => setPassword(e.target.value)} id="password-input" className="input-box" type="password" placeholder="Enter your password" />
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

				<button type="button" onClick={handleGoogleClick} className="google-btn">
					<i className="fa-brands fa-google"></i>
					<p className="btn-text">Sign in with Google</p>
				</button>

				<p>Is it your first time? <NavLink className="sign-up-link" to="/getstarted">Sign up</NavLink></p>
			</div>
		</div>
	)
}

export default Login