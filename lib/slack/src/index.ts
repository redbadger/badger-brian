import express from 'express'
import fetch from 'node-fetch';

const app = express()

// These environment variables are injected automatically into the container by dapr
const daprPort = process.env.DAPR_HTTP_PORT;
//const daprGRPCPort = process.env.DAPR_GRPC_PORT;

const port = process.env.PORT || 3000

app.get('/ping', async (_req, res) => {
  //res.send('pong')
  const response = await fetch(`http://localhost:${daprPort}/v1.0/invoke/hr.hr/method/ping`)
  const body = await response.text()
  res.send("Respose from hr api: " + body)

})

app.listen(port, () => console.log(`http://localhost:${port}`))
