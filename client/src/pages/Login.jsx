import React from "react";
import { NavLink } from 'react-router-dom'
import './Login.css'

function Login() {
	return (
		<>
			<div className="background">
				<div className="modal">
					<div className="title-container">
						<img className="logo" src="/grandlux-logo.png" />
						<h1 className="title">GrandLux</h1>
					</div>
					<h2 className="subtitle">Welcome Back</h2>
					<div className="input-container">
						<label for="email-input">Email Address</label>
						<input id="email-input" className="input-box" type="email" placeholder="your.email@example.com" />
					</div>
					<div className="input-container">
						<div className="password-text-container">
							<label for="password-input">Password</label>
							<a className="forgot-password-link" href="">Forgot password?</a>
						</div>
						<input id="password-input" className="input-box" type="password" placeholder="Enter your password" />
					</div>
					<div className="alignment-container">
						<div className="remember-me-container">
							<input id="remember-me-radio" type="checkbox" className="remember-checkbox" />
							<label for="remember-me-radio">Remember me</label>
						</div>
						<button className="login-btn">Log In</button>
					</div>
					<div className="divider-container">
						<div className="line"></div>
						<p className="divider-text">or</p>
						<div className="line"></div>
					</div>
					<button className="google-btn">
						<i class="fa-brands fa-google"></i>
						<p className="btn-text">Sign in with Google</p>
					</button>
					<p>Is it your first time? <NavLink className="sign-up-link" to="/getstarted">Get Started</NavLink></p>
				</div>
			</div>
		</>
	)
}

export default Login