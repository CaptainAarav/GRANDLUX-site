import { useScrollReveal } from '../hooks/useScrollReveal'

function Dashboard() {
	const ref = useScrollReveal()
	return (
		<h1 ref={ref} className="reveal reveal-fade-up">Dashboard</h1>
	)
}

export default Dashboard