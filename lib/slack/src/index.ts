import express, { response } from 'express'
import fetch from 'node-fetch';

const app = express()

// This environment variable is injected automatically into the container by dapr
// DAPR_GRPC_PORT is also injected, although we don't use it
const daprPort = process.env.DAPR_HTTP_PORT;

const port = process.env.PORT || 3001

app.get('/ping', async (_req, res) => {
  const response = await fetch(`http://localhost:${daprPort}/v1.0/invoke/hr.hr/method/ping`)
  const body = await response.text()
  res.send("Respose from hr api: " + body)

})

// This is designed as a Rest endpoint, although the HR api is GraphQL. I'm not sure which
// is best for this, but presumably this slack api is a Backends for Frontends type Api, in
// which case Rest, or Rpc is probably going to be more suitable that GraphQl.
app.get('/:userId/manager', async (req, res) => {
  // We will probably want to use relay or something later as the GraphQl usage gets more 
  // complex, but I think hand rolling things is fine for now
  fetch(`http://localhost:${daprPort}/v1.0/invoke/hr.hr/method/graphql`, {
    "body": JSON.stringify(
      {
        "query": managerQuery,
        "variables": { userId: req.params.userId }
      }),
    "method": "POST",
  })
    .then(response => response.json())
    .then(json => res.send("Respose from hr api: " + json.data.human.manager.name))
    .catch(error => console.log(error))
})

app.listen(port, () => console.log(`http://localhost:${port}`))

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

