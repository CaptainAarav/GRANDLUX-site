require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const flightsRouter = require('./routes/flights')
const authRouter = require('./routes/auth')
const pilotsRouter = require('./routes/pilots')

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/flights', flightsRouter)
app.use('/api/auth', authRouter)
app.use('/api/pilots', pilotsRouter)

app.use((err, req, res, next) => {
	console.error('Unhandled error:', err)
	res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
