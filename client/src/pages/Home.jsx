import React from 'react'
import { NavLink } from 'react-router-dom'
import './Home.css'

function Home() {
    return (
        <>
            <section className="hero-section">
                <img src="/grandlux-logo.png" alt="logo" className="hero-logo" />
                <h1 className="hero-title">GrandLux</h1>
                <h2 className="hero-subtitle">The Luxembourgish way of flying with perfection</h2>
                <section className="hero-btns-container">
                    <NavLink className="hero-btn" to="/getstarted">Get Started</NavLink>
                    <NavLink className="hero-btn" to="/login">Log In</NavLink>
                </section>
            </section>
            <section className="beginnings-section">
                <img src="/FLX-logo.png" alt="FLX logo" className="FLX-logo" />
                <div className="section-text-container">
                    <h2 className="section-title">OUR BEGINNING</h2>
                    <p className="section-text">
                        At first we wanted to launch the airline as FLX but that didn't really work out so we called it GRANDLUX. After a lot of work we got through it so here we are in our launching state stay tuned for updates on our nice VA.
                    </p>
                </div>
            </section>
            <section className="parternship-section">
                <div className="section-text-container">
                        <h2 className="section-title">PARTNERSHIPS</h2>
                        <p className="section-text">
                            Currently we have an ongoing partnership with LuxPlanes, A big thank you to him to make this happen. We have a lot in common bringing the aviation community closer to poeple that don't have a lot of knowlege in the field of aviation.
                        </p>
                </div>
                <img src="/partnership-logo.png" alt="parternship-logo" className="partnership-logo" />
            </section>
            <section className="contact-section">
                <div className="contact-container">
                    <i className="fa-solid fa-envelope"></i>
                    <p className="contact-title">Email</p>
                    <a className="email-link" href="mailto:info@grandlux.lu">info@grandlux.lu</a>
                </div>
                <div className="contact-container">
                    <i className="fa-jelly-fill fa-regular fa-thumbs-up"></i>
                    <p className="contact-title">Socials</p>
                    <div className="social-links">
                        <a href="https://www.youtube.com/@jw8974.1?si=fkTOjJielpoq7hCM"><i className="fa-brands fa-youtube"></i></a>
                        <a href="https://discord.com/invite/WRZGezPtqd"><i className="fa-brands fa-discord"></i></a>
                        <a href="https://tiktok.com/@grandlux.lu"><i className="fa-brands fa-tiktok"></i></a>
                        <a href="https://www.instagram.com/grandlux.lu?igsh=MWNueDEzdXFtNWE1cA%3D%3D"><i className="fa-brands fa-instagram"></i></a>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Home