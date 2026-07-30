import { useScrollReveal } from '../hooks/useScrollReveal'
import './OurFleet.css'

function OurFleet() {
    const titleRef = useScrollReveal()
    const a320CardRef = useScrollReveal()
    const a320TextRef = useScrollReveal()
    const b738CardRef = useScrollReveal()
    const b738TextRef = useScrollReveal()

    return (
        <div className="fleet-page">
            <h1 ref={titleRef} className="fleet-heading reveal reveal-fade-up">Aircraft we operate</h1>

            <div className="fleet-aircraft">
                <div ref={a320CardRef} className="fleet-card reveal reveal-fade-up">
                    <img src="/a320-grandlux-livery.png" alt="A320-200" className="fleet-image" />
                </div>
                <div ref={a320TextRef} className="fleet-text reveal reveal-fade-up">
                    <h2 className="fleet-aircraft-title">A320-200</h2>
                    <p className="fleet-description">
                        The A320-200 is the backbone of our short to medium haul operations. With its quiet cabin, advanced fly-by-wire technology, and exceptional fuel efficiency, it delivers a smooth and comfortable ride across Europe. Whether you are flying into a major hub or a regional airport, the A320 handles it all with ease, but lets be honest 737 is better.
                    </p>
                </div>
            </div>

            <div className="fleet-aircraft">
                <div ref={b738CardRef} className="fleet-card reveal reveal-fade-up">
                    <img src="/grandlux-737-livery.png" alt="737-800" className="fleet-image" />
                </div>
                <div ref={b738TextRef} className="fleet-text reveal reveal-fade-up">
                    <h2 className="fleet-aircraft-title">B737-800</h2>
                    <p className="fleet-description">
                        The 737-800 is the workhorse we trust to get the job done. It is reliable, proven, and tougher than a Luxembourg winter. Some say it has been around since the dawn of aviation, but we say if it is not broken, why fix it? Besides, it pairs perfectly with a good coffee and a strong crosswind landing. Just dont land it like the people at VRYR.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default OurFleet
