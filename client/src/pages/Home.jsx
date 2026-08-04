import { NavLink } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useAuth } from '../hooks/useAuth'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import './Home.css'

function Home() {
    const { user, loading } = useAuth()
    const beginningsRef = useScrollReveal()
    const partnershipRef = useScrollReveal()
    const contactRef = useScrollReveal()

    return (
        <>
            <section className="hero-section">
                <img src="/liverys/grandlux-737-livery.png" className="hero-plane hero-plane-737" />
                <img src="/liverys/a320-grandlux-livery.png" className="hero-plane hero-plane-a320" />
                <img src="/logos/grandlux-logo.png" alt="logo" className="hero-logo" />
                <h1 className="hero-title">GrandLux</h1>
                <h2 className="hero-subtitle">The Luxembourgish way of flying with perfection</h2>
                <section className="hero-btns-container">
                    {loading
                        ? <div className="hero-loading"><i className="fa-solid fa-circle-notch fa-spin"></i></div>
                        : user
                            ? <button className="hero-btn" onClick={() => signOut(auth)}>Log Out</button>
                            : <>
                                <NavLink className="hero-btn hero-btn--flag" to="/getstarted">Join Now</NavLink>
                                <NavLink className="hero-btn" to="/login">Log In</NavLink>
                            </>
                    }
                </section>
            </section>
            <section ref={beginningsRef} className="beginnings-section reveal reveal-fade-up">
                <img src="/logos/FLX-logo.png" alt="FLX logo" className="FLX-logo" />
                <div className="section-text-container">
                    <h2 className="section-title">OUR BEGINNING</h2>
                    <p className="section-text">
                        At first we wanted to launch the airline as FLX but that didn't really work out so we called it GRANDLUX. After a lot of work we got through it so here we are in our launching state stay tuned for updates on our nice VA.
                    </p>
                </div>
            </section>
            <section ref={partnershipRef} className="parternship-section reveal reveal-fade-up">
                <div className="section-text-container">
                        <h2 className="section-title">PARTNERSHIPS</h2>
                        <p className="section-text">
                            Currently we have an ongoing partnership with LuxPlanes, A big thank you to him to make this happen. We have a lot in common bringing the aviation community closer to poeple that don't have a lot of knowlege in the field of aviation.
                        </p>
                </div>
                <img src="/logos/partnership-logo.png" alt="parternship-logo" className="partnership-logo" />
            </section>
            <section ref={contactRef} className="contact-section reveal reveal-fade-up">
                <div className="contact-container">
                    <i className="fa-solid fa-envelope"></i>
                    <p className="contact-title">Email</p>
                    <a className="email-link" href="mailto:info@grandlux.lu">info@grandlux.lu</a>
                </div>
                <div className="contact-container">
                    <i className="fa-regular fa-thumbs-up"></i>
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