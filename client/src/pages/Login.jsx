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
					<input className="input-box" type="email" placeholder="Email" />
					<input className="input-box" type="password" placeholder="Password" />
					<div className="divider-container">
						<div className="line"></div>
						<p className="divider-text">or</p>
						<div className="line"></div>
					</div>
					<button className="google-btn">
						<i class="fa-brands fa-google"></i>
						<p className="btn-text">Sign in with Google</p>
					</button>
					<p>Is it your first time? <NavLink className="sign-up-link" to="/getstarted">Sign up</NavLink></p>
				</div>
			</div>
		</>

	)
}

export default Login