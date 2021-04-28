import express, { response } from 'express'
import fetch from 'node-fetch';
import { getUserName } from './core';
import { fetchManager } from './infrastructure';
import { composeSlackReply } from './domain';

const app = express()

const port = process.env.PORT || 3001

// This decodes application/x-www-form-urlencoded data, turning the request.body
// in to an object.
app.use(express.urlencoded({ extended: true }))

app.get('/hello', async (_req, res) => {
  res.send("world")
})

app.get('/ping', async (_req, res) => {
  const response = await fetch(`http://localhost:${daprPort}/v1.0/invoke/hr.hr/method/ping`)
  const body = await response.text()
  res.send("Respose from hr api: " + body)

})

app.post('/getManager', async (req, res) => {
  console.log(req.body)

  // todo: validate the inputs

  // todo: authentication - validate that request comes from red badger slack

  // todo: currently this will be '@cedd.burge' or similar, we will probably want to convert it
  // into to something else at some point (probably cedd.burge@redbadger.com)
  const userName = getUserName(req.body)

  const slackReply = await composeSlackReply(userName, fetchManager)

  // todo: if there is an error, catch it and retur a 200 with some explanatory text, as per
  // slack guidelines at https://api.slack.com/interactivity/slash-commands#responding_with_errors
  res.json(slackReply)

  // Instead of / as well as returning a response, you can also post to an endpoint.
  // This allows longer reponse times, conversations, and things like that
  // await fetch(req.body.response_url, {
  //   "body": JSON.stringify({ "text": chatMessage }),
  //   "method": "POST"
  // })

})

// This environment variable is injected automatically into the container by dapr
// DAPR_GRPC_PORT is also injected, although we don't use it
const daprPort = process.env.DAPR_HTTP_PORT;

app.listen(port, () => console.log(`http://localhost:${port}`))


