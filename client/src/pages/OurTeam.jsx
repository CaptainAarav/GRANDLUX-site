import { useScrollReveal } from '../hooks/useScrollReveal'
import './OurTeam.css'

const teamGroups = [
	{
		title: 'Our Owners',
		subtitle: 'The leadership behind GrandLux',
		members: [
			{ name: 'JW89', role: 'Owner & CEO', image: '/staff/team-jw89.png' },
			{ name: 'Rotate & Fly', role: 'Owner', image: '/staff/team-rotateandfly.jpg' },
			{ name: 'Bus5top', role: 'Owner', image: '/staff/team-bus5top.png' },
		],
	},
	{
		title: 'Developers and Admins',
		subtitle: 'Building and running the network',
		members: [
			{ name: 'Captain Aarav', role: 'Lead developer and Admin', image: '/staff/team-captain_aarav.png' },
			{ name: 'Starnumber', role: 'Developer & Admin', image: '/staff/team-starnumber.png' },
			{ name: 'Mqrc_', role: 'Admin', image: '/staff/team-Mqrc_.png' },
		],
	},
	{
		title: 'Partners',
		subtitle: 'Working alongside us',
		members: [
			{ name: 'LuxPlanes', role: 'Partner and Admin', image: '/staff/team-luxplanes.png' },
		],
	},
]

function OurTeam() {
	const titleRef = useScrollReveal()
	const subtitleRef = useScrollReveal()

	return (
		<section className="team-section">
			<h1 ref={titleRef} className="team-title reveal reveal-fade-up">Meet our team</h1>
			<h2 ref={subtitleRef} className="team-subtitle reveal reveal-fade-up">Our Team that run this beautiful VA</h2>

			{teamGroups.map((group) => (
				<TeamGroup group={group} key={group.title} />
			))}
		</section>
	)
}

function TeamGroup({ group }) {
	const titleRef = useScrollReveal()
	const subtitleRef = useScrollReveal()

	return (
		<div className="team-group">
			<h3 ref={titleRef} className="team-group-title reveal reveal-fade-up">{group.title}</h3>
			{group.subtitle && <p ref={subtitleRef} className="team-group-subtitle reveal reveal-fade-up">{group.subtitle}</p>}
			<div className="team-grid">
				{group.members.map((member) => (
					<TeamCard key={member.name} member={member} />
				))}
			</div>
		</div>
	)
}

function TeamCard({ member }) {
	const ref = useScrollReveal()
	return (
		<article ref={ref} className="team-card reveal reveal-fade-up">
			<img src={member.image} alt={member.name} className="team-card-image" />
			<h3 className="team-card-name">{member.name}</h3>
			<p className="team-card-role">{member.role}</p>
			{member.description && <p className="team-card-desc">{member.description}</p>}
		</article>
	)
}

export default OurTeam
