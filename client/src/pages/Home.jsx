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
        </>
    )
}

export default Home