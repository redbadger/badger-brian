import express, { response } from 'express'
import fetch from 'node-fetch';

const app = express()

const port = process.env.PORT || 3001

app.get('/ping', async (_req, res) => {
  const response = await fetch(`http://localhost:${daprPort}/v1.0/invoke/hr.hr/method/ping`)
  const body = await response.text()
  res.send("Respose from hr api: " + body)

})

// This is currently designed as a Rest endpoint, but the next stage is to integrate it with
// slack, which probably invovles implementing the slack /command callback (to receive a POST
// request with urlencoded body as described in 
// https://api.slack.com/interactivity/slash-commands#app_command_handling)
app.get('/:userId/manager', async (req, res) => {
  // We will probably want to use relay or something later as the GraphQl usage gets more 
  // complex, but I think hand rolling things is fine for now
  const response = await fetch(`http://localhost:${daprPort}/v1.0/invoke/hr.hr/method/graphql`, {
    "body": JSON.stringify(
      {
        "query": managerQuery,
        "variables": { userId: req.params.userId }
      }),
    "method": "POST",
  })
  const body = await response.json()

  res.send("Respose from hr api: " + body.data.human.manager.name)
})

app.listen(port, () => console.log(`http://localhost:${port}`))

// This environment variable is injected automatically into the container by dapr
// DAPR_GRPC_PORT is also injected, although we don't use it
const daprPort = process.env.DAPR_HTTP_PORT;

const managerQuery =
  `query ManagerOf($userId: String!){
    human(id: $userId) {
      id
      name
      manager {
        id
        name
      }
    }
  }`

