import express from 'express'
import scraper from './routes/Scraper.js'
import cors from 'cors'

const app = express()
const port = 4000

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['content-type', 'Authorization'],
  credentials: true
}))

app.use(express.json())

app.use('/Scraper', scraper)

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`)
})
