import { NavLink } from 'react-router-dom'
import { useState } from "react";
import './Login.css'
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

function GetStarted() {
	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [error, setError] = useState("")
	const redirectPort = new URLSearchParams(window.location.search).get('redirect_port')

	async function completeLogin(userCredential) {
		const token = await userCredential.user.getIdToken()
		if (redirectPort) {
			window.location.href = `http://127.0.0.1:${redirectPort}/?token=${token}`
		} else {
			window.location.href = '/'
		}
	}

	async function handleSignupSubmit(e) {
		e.preventDefault()
		setError('')

		if (password !== confirmPassword) {
			setError("Passwords don't match")
			return
		}

		try {
			await setPersistence(auth, browserLocalPersistence)
			const userCredential = await createUserWithEmailAndPassword(auth, email, password)
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
				<h2 className="subtitle">Get Started</h2>
				{error && <p className="login-error">{error}</p>}

				<form onSubmit={handleSignupSubmit} className="auth-form">
					<div className="name-inputs-container">
						<div className="input-container">
							<label htmlFor="first-name-input">First Name</label>
							<input id="first-name-input" className="input-box" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
						</div>
						<div className="input-container">
							<label htmlFor="last-name-input">Last Name</label>
							<input id="last-name-input" className="input-box" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
						</div>
					</div>
					<div className="input-container">
						<label htmlFor="email-input">Email Address</label>
						<input id="email-input" className="input-box" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" />
					</div>
					<div className="input-container">
						<label htmlFor="password-input">Password</label>
						<div className="password-input-wrapper">
							<input value={password} onChange={e => setPassword(e.target.value)} id="password-input" className="input-box" type={showPassword ? "text" : "password"} placeholder="Create a password" />
							<i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} password-toggle-icon`} onClick={() => setShowPassword(!showPassword)}></i>
						</div>
					</div>
					<div className="input-container">
						<label htmlFor="confirm-password-input">Confirm Password</label>
						<div className="password-input-wrapper">
							<input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} id="confirm-password-input" className="input-box" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter your password" />
							<i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} password-toggle-icon`} onClick={() => setShowConfirmPassword(!showConfirmPassword)}></i>
						</div>
					</div>
					<div className="alignment-container">
						<button type="submit" className="login-btn">Sign Up</button>
					</div>
				</form>

				<div className="divider-container">
					<div className="line"></div>
					<p className="divider-text">or</p>
					<div className="line"></div>
				</div>

				<button type="button" onClick={handleGoogleClick} className="google-btn">
					<i className="fa-brands fa-google"></i>
					<p className="btn-text">Sign up with Google</p>
				</button>

				<p>Already have an account? <NavLink className="sign-up-link" to="/login">Log in</NavLink></p>
			</div>
		</div>
	)
}

export default GetStarted