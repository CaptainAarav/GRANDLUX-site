import React from 'react'
import './OurTeam.css'

const team = [
    { name: 'JW89', role: 'Owner & CEO', image: '/team-jw89.png' },
    { name: 'Rotate & Fly', role: 'Owner', image: '/team-rotateandfly.jpg' },
    { name: 'Bus5top', role: 'Owner/Dev', image: '/team-bus5top.png' },
    { name: 'Captain Aarav', role: 'Developer', image: '/team-captain_aarav.png' }
]

function OurTeam() {
    return (
        <section className="team-section">
            <h1 className="team-title">Meet our team</h1>
            <h2 className="team-subtitle">Our Team that run this beatiful VA</h2>

            <div className="team-grid">
                {team.map((member) => (
                    <article className="team-card" key={member.name}>
                        <img src={member.image} alt={member.name} className="team-card-image" />
                        <h3 className="team-card-name">{member.name}</h3>
                        <p className="team-card-role">{member.role}</p>
                    </article>
                ))}
            </div>
        </section>
    )
}

export default OurTeam
