import { NavLink } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from "react";
import { useScrollReveal } from '../hooks/useScrollReveal'
import './Login.css'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

function Login() {
	const { user, loading } = useAuth()
	const modalRef = useScrollReveal({ threshold: 0.05 })
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [rememberMe, setRememberMe] = useState(false)
	const [error, setError] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [pending2FA, setPending2FA] = useState(false)
	const [otp, setOtp] = useState(["", "", "", "", "", ""])
	const [otpError, setOtpError] = useState("")
	const [forgotSent, setForgotSent] = useState(false)
	const [sendingOtp, setSendingOtp] = useState(false)
	const otpRefs = useRef([])
	const redirectPort = new URLSearchParams(window.location.search).get('redirect_port')

	const completeLogin = useCallback(async (firebaseUser) => {
		const token = await firebaseUser.getIdToken()
		if (redirectPort) {
			window.location.href = `http://127.0.0.1:${redirectPort}/?token=${token}`
		} else {
			window.location.href = '/dashboard'
		}
	}, [redirectPort])

	const AUTH_SERVER = import.meta.env.VITE_API_URL || 'http://localhost:4000'

	useEffect(() => {
		if (!loading && user && !pending2FA) {
			completeLogin(user).catch((err) => setError(err.message))
		}
	}, [user, loading, completeLogin, pending2FA])

	async function handleEmailSubmit(e) {
		e.preventDefault()
		setError('')
		try {
			await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
			await signInWithEmailAndPassword(auth, email, password)
			setSendingOtp(true)
			const res = await fetch(`${AUTH_SERVER}/api/auth/send-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			})
			await res.json()
			setSendingOtp(false)
			setPending2FA(true)
		} catch (err) {
			setError(err.message)
		}
	}

	async function handleOtpSubmit() {
		const code = otp.join("")
		if (code.length !== 6) {
			setOtpError("Please enter the full 6-digit code")
			return
		}
		setOtpError("")
		try {
			const res = await fetch(`${AUTH_SERVER}/api/auth/verify-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp: code }),
			})
			const data = await res.json()
			if (!data.verified) {
				setOtpError("Invalid or expired code")
				return
			}
			const firebaseUser = auth.currentUser
			if (firebaseUser) {
				completeLogin(firebaseUser)
			} else {
				setError("Session expired — please log in again")
				setPending2FA(false)
			}
		} catch {
			setOtpError("Failed to verify code. Try again.")
		}
	}

	function handleOtpChange(index, value) {
		if (value && !/^\d$/.test(value)) return
		const newOtp = [...otp]
		newOtp[index] = value
		setOtp(newOtp)
		if (value && index < 5) {
			otpRefs.current[index + 1].focus()
		}
	}

	function handleOtpKeyDown(index, e) {
		if (e.key === "Backspace" && !otp[index] && index > 0) {
			otpRefs.current[index - 1].focus()
		}
		if (e.key === "Enter") {
			handleOtpSubmit()
		}
	}

	async function handleForgotPassword(e) {
		e.preventDefault()
		if (!email) {
			setError("Enter your email address first")
			return
		}
		setError("")
		try {
			await sendPasswordResetEmail(auth, email)
			setForgotSent(true)
		} catch (err) {
			setError(err.message)
		}
	}

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

	if (forgotSent) {
		return (
			<div className="background">
				<div ref={modalRef} className="modal reveal reveal-fade-up">
					<div className="modal-form">
						<div className="title-container">
							<img className="logo" src="/logos/grandlux-logo.png" />
							<h1 className="title">GrandLux</h1>
						</div>
						<h2 className="subtitle">Check Your Email</h2>
						<p style={{ fontFamily: "Inter, sans-serif", color: "#6A6A6A", textAlign: "center", fontSize: "14px" }}>
							A password reset link has been sent to <strong>{email}</strong>.
						</p>
						<button className="login-btn" onClick={() => setForgotSent(false)}>Back to Log In</button>
					</div>
					<div className="modal-liveries">
						<div className="liveries-container">
							<img src="/liverys/a320-grandlux-livery.png" className="livery-plane livery-a320" />
							<img src="/liverys/grandlux-737-livery.png" className="livery-plane livery-737" />
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (pending2FA) {
		return (
			<div className="background">
				<div ref={modalRef} className="modal reveal reveal-fade-up">
					<div className="modal-form">
						<div className="title-container">
							<img className="logo" src="/logos/grandlux-logo.png" />
							<h1 className="title">GrandLux</h1>
						</div>
						<h2 className="subtitle">Verify Your Identity</h2>
						<p className="otp-sent-text">A verification code was sent to {email}</p>
						{otpError && <p className="otp-error">{otpError}</p>}
						<div className="otp-container">
							<div className="otp-input-row">
								{otp.map((digit, i) => (
									<input
										key={i}
										ref={(el) => { otpRefs.current[i] = el }}
										className="otp-input"
										type="text"
										inputMode="numeric"
										maxLength={1}
										value={digit}
										onChange={(e) => handleOtpChange(i, e.target.value)}
										onKeyDown={(e) => handleOtpKeyDown(i, e)}
									/>
								))}
							</div>
							<div className="otp-actions">
								<button className="login-btn" onClick={handleOtpSubmit}>Verify</button>
								<button className="otp-back-btn" onClick={() => { setPending2FA(false); auth.signOut() }}>Cancel</button>
							</div>
						</div>
					</div>
					<div className="modal-liveries">
						<div className="liveries-container">
							<img src="/liverys/a320-grandlux-livery.png" className="livery-plane livery-a320" />
							<img src="/liverys/grandlux-737-livery.png" className="livery-plane livery-737" />
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="background">
			<div ref={modalRef} className="modal reveal reveal-fade-up">
				<div className="modal-form">
					<div className="title-container">
						<img className="logo" src="/logos/grandlux-logo.png" />
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
								<a className="forgot-password-link" href="" onClick={handleForgotPassword}>Forgot password?</a>
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
							<button type="submit" className="login-btn" disabled={sendingOtp}>{sendingOtp ? "Sending code..." : "Log In"}</button>
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
						<img src="/liverys/a320-grandlux-livery.png" className="livery-plane livery-a320" />
						<img src="/liverys/grandlux-737-livery.png" className="livery-plane livery-737" />
					</div>
				</div>
			</div>
		</div>
	)
}

export default Login