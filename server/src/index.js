require('dotenv').config()
const express = require('express')
const cors = require('cors')
const admin = require('firebase-admin')
const serviceAccount = require('../serviceAccountKey.json')

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
})

const app = express()
app.use(cors())
app.use(express.json())