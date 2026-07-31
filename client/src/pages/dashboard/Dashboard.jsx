import './Dashboard.css'

function Dashboard() {
	return (
		<div className='dashboard-wrapper'>

			<section className="profile-info-container">
				<img className='user-pfp' src="/default-pfp.jpg" />
				<div className='profile-text-container'>
					<h2 className='welcome-message'>Welcome back,</h2>
					<h1 className='user-name'>Aarav Sahni</h1>
					<p className='rank-title'>Rank</p>
					<div className='badge-container'>
						<h3 className='user-rank'>First Officer</h3>	
						<img className='user-badge' src="/pilot_badges/first_officer.png" />
					</div>
				</div>
			</section>

			<section className='user-stats-container'>

				<div className='stat-card'>
					<i className="fa-regular fa-clock"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Total Flight Hours</h3>
						<p className='stat-card-stat'>98h 15m</p>
					</div>
				</div>
				<div className='stat-card'>
					<i className="fa-regular fa-paper-plane"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Total Flights</h3>
						<p className='stat-card-stat'>45</p>
						<p className='stat-card-detail'>All time</p>
					</div>
				</div>
				<div className='stat-card'>
					<i className="fa-regular fa-map"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Total Distance</h3>
						<p className='stat-card-stat'>36,842 NM</p>
						<p className='stat-card-detail'>All time</p>
					</div>
				</div>
				<div className='stat-card'>
					<i className="fa-regular fa-star"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Total Points</h3>
						<p className='stat-card-stat'>10,663</p>
						<p className='stat-card-detail'>All time</p>
					</div>
				</div>
				<div className='stat-card'>
					<i className="fa-regular fa-flag"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Countries Visited</h3>
						<p className='stat-card-stat'>23</p>
						<p className='stat-card-detail'>All time</p>
					</div>
				</div>

			</section>

		</div>
	)
}

export default Dashboard
