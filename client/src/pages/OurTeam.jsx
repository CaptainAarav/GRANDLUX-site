import { useScrollReveal } from '../hooks/useScrollReveal'
import './OurTeam.css'

const team = [
    { name: 'JW89', role: 'Owner & CEO', image: '/staff/team-jw89.png' },
    { name: 'Rotate & Fly', role: 'Owner', image: '/staff/team-rotateandfly.jpg' },
    { name: 'Bus5top', role: 'Owner', image: '/staff/team-bus5top.png' },
    { name: 'Captain Aarav', role: 'Developer', image: '/staff/team-captain_aarav.png' }
]

function OurTeam() {
    const titleRef = useScrollReveal()
    const subtitleRef = useScrollReveal()

    return (
        <section className="team-section">
            <h1 ref={titleRef} className="team-title reveal reveal-fade-up">Meet our team</h1>
            <h2 ref={subtitleRef} className="team-subtitle reveal reveal-fade-up">Our Team that run this beautiful VA</h2>

            <div className="team-grid">
                {team.map((member) => (
                    <TeamCard key={member.name} member={member} />
                ))}
            </div>
        </section>
    )
}

function TeamCard({ member }) {
    const ref = useScrollReveal()
    return (
        <article ref={ref} className="team-card reveal reveal-fade-up">
            <img src={member.image} alt={member.name} className="team-card-image" />
            <h3 className="team-card-name">{member.name}</h3>
            <p className="team-card-role">{member.role}</p>
        </article>
    )
}

export default OurTeam
