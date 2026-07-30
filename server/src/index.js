const express = require('express')
const cors = require('cors')
const flightsRouter = require('./routes/flights')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/flights', flightsRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))