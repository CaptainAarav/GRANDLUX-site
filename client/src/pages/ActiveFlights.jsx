import { useScrollReveal } from '../hooks/useScrollReveal'

function ActiveFlights() {
    const ref = useScrollReveal()
    return (
        <h1 ref={ref} className="reveal reveal-fade-up">Active Flights</h1>
    )
}

export default ActiveFlights
