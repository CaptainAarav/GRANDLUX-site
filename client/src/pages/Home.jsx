import React from 'react'
import './Home.css'

function Home() {
    return (
        <>
            <section className="hero-section">
                <img src="/grandlux-logo.png" alt="logo" className="hero-logo" />
                <h1 className="hero-title">GrandLux</h1>
                <h2 className="hero-subtitle"><em>The Luxembourgish way of flying with perfection</em></h2>
            </section>
            <section className="beginnings-section">
                <img src="/FLX-logo.png" alt="FLX logo" className="FLX-logo" />
                <div className="beginnings-text-container">
                    <h2 className="beginnigns-text-title">OUR BEGINNING</h2>
                    <p className="beginnings-text">
                        At first we wanted to launch the airline as FLX but that didn't really work out so we called it GRANDLUX. After a lot of work we got through it so here we are in our launching state stay tuned for updates on our nice VA.
                    </p>
                </div>
            </section>
            <section className="parternship-section">
                <div className="partership-text-container">
                    <h2 className="partnership-text-title">PARTNERSHIPS</h2>
                    <p className="partnership-text">
                        Currently we have an ongoing partnership with LuxPlanes, A big thank you to him to make this happen. We have a lot in common bringing the aviation community closer to poeple that don't have a lot of knowlege in the field of aviation.
                    </p>
                </div>
                <img src="/partnership-logo.png" alt="parternship-logo" className="partnership-logo" />
            </section>
        </>
    )
}

export default Home