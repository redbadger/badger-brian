import express from 'express'

const app = express()

const port = process.env.PORT || 3000

app.get('/ping', (_req, res) => {
  res.send('pong')
})

app.listen(port, () => console.log(`http://localhost:${port}`))
