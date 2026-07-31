import { Link } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
	return (
		<div className='dashboard-wrapper'>
			<img className="dash-plane dash-plane-737" src="/liverys/grandlux-737-livery.png" alt="" />
			<img className="dash-plane dash-plane-a320" src="/liverys/a320-grandlux-livery.png" alt="" />

			<section className="profile-info-container">
				<img className='user-pfp' src="/default-pfp.jpg" />
				<div className='profile-text-container'>
					<h2 className='welcome-message'>Welcome back,</h2>
					<h1 className='user-name'>Aarav Sahni</h1>
					<div className='badge-container'>
						<div className='badge-text-container'>
							<p className='rank-title'>Rank</p>
							<h3 className='user-rank'>First Officer</h3>
						</div>
						<img className='user-badge' src="/pilot_badges/first_officer.png" />
					</div>
				</div>
			</section>

			<section className='dashboard-container'>

				<div className='stat-card'>
					<i className="fa-regular fa-clock"></i>
					<div className='stat-card-text-container'>
						<h3 className='stat-card-title'>Total Flight Hours</h3>
						<p className='stat-card-stat'>98h 15m</p>
						<p className='stat-card-detail'>All time</p>
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

			<section className='dashboard-container'>
				<Link to="/dashboard" className='dashboard-btn'>
					<i className="fa-regular fa-paper-plane"></i>
					<div className='btn-card-text-container'>
						<h3 className='btn-card-title'>Make a Booking</h3>
						<p className='btn-card-subtitle'>Create a new booking</p>
					</div>
				</Link>
				<Link to="/flights" className='dashboard-btn'>
					<i className="fa-regular fa-calendar"></i>
					<div className='btn-card-text-container'>
						<h3 className='btn-card-title'>Your Flights</h3>
						<p className='btn-card-subtitle'>View your upcoming and past flights</p>
					</div>
				</Link>
				<Link to="/dashboard/notams" className='dashboard-btn'>
					<i className="fa-solid fa-exclamation"></i>
					<div className='btn-card-text-container'>
						<h3 className='btn-card-title'>NOTAMs</h3>
						<p className='btn-card-subtitle'>View latest operational NOTAMS</p>
					</div>
				</Link>
				<Link to="/dashboard/documents" className='dashboard-btn'>
					<i className="fa-regular fa-file"></i>
					<div className='btn-card-text-container'>
						<h3 className='btn-card-title'>Documents</h3>
						<p className='btn-card-subtitle'>Learn how to operate GrandLux Aircraft</p>
					</div>
				</Link>
			</section>

			<section className='recent-flights-container'>
				<div className='recent-flights-header'>
					<h2 className='recent-flights-title'>Recent flights</h2>
					<Link to="/flights" className='view-all-flights-btn'>
						View All Flights <i className="fa-solid fa-arrow-right"></i>
					</Link>
				</div>
				<div className='recent-flights-table-container'>
					<table className='recent-flights-table'>
						<thead>
							<tr>
								<th>Callsign</th>
								<th>Route</th>
								<th>Aircraft</th>
								<th>Time</th>
								<th>Air Time</th>
								<th>Pax</th>
								<th>Status</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>GRX101</td>
								<td>EGLL → LUXL</td>
								<td>A320-200</td>
								<td>14:30</td>
								<td>1h 45m</td>
								<td>150</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
							<tr>
								<td>GRX220</td>
								<td>LUXL → LFPG</td>
								<td>737-800</td>
								<td>09:15</td>
								<td>0h 58m</td>
								<td>172</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
							<tr>
								<td>GRX087</td>
								<td>EDDF → LUXL</td>
								<td>A320-200</td>
								<td>18:40</td>
								<td>1h 12m</td>
								<td>138</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
							<tr>
								<td>GRX233</td>
								<td>LUXL → EHAM</td>
								<td>737-800</td>
								<td>07:55</td>
								<td>1h 05m</td>
								<td>165</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
							<tr>
								<td>GRX118</td>
								<td>EIDW → LUXL</td>
								<td>A320-200</td>
								<td>16:20</td>
								<td>1h 55m</td>
								<td>149</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
							<tr>
								<td>GRX242</td>
								<td>LUXL → LEBL</td>
								<td>A320-200</td>
								<td>11:40</td>
								<td>2h 05m</td>
								<td>178</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
							<tr>
								<td>GRX076</td>
								<td>LOWW → LUXL</td>
								<td>737-800</td>
								<td>20:10</td>
								<td>1h 15m</td>
								<td>155</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
							<tr>
								<td>GRX261</td>
								<td>LUXL → LIRF</td>
								<td>A320-200</td>
								<td>13:25</td>
								<td>1h 50m</td>
								<td>168</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
							<tr>
								<td>GRX094</td>
								<td>EKCH → LUXL</td>
								<td>737-800</td>
								<td>15:35</td>
								<td>1h 30m</td>
								<td>142</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
							<tr>
								<td>GRX289</td>
								<td>LUXL → LGAV</td>
								<td>737-800</td>
								<td>09:50</td>
								<td>2h 35m</td>
								<td>181</td>
								<td><span className='status-badge status-completed'>Completed</span></td>
								<td><i className="fa-regular fa-eye"></i></td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</div>
	)
}

export default Dashboard
