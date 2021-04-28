import express, { response } from 'express'
import fetch from 'node-fetch';
import { slackReply } from './core';

const app = express()

const port = process.env.PORT || 3001

app.use(express.urlencoded({ extended: true }))

app.get('/hello', async (_req, res) => {
  res.send("world")
})

app.get('/ping', async (_req, res) => {
  const response = await fetch(`http://localhost:${daprPort}/v1.0/invoke/hr.hr/method/ping`)
  const body = await response.text()
  res.send("Respose from hr api: " + body)

})

// We consider this to be the 'domain' layer in the onion architecture

// This is expecting a request from slack, with application/x-www-form-urlencoded data like below.
// Details at https://api.slack.com/interactivity/slash-commands#app_command_handling
// This (encoded) data is also saved as exampleRequest.txt for local testing with curl
// {
//   token: 'YOlSzbHSkwCPwdqZ3eHbHW1U',
//   team_id: 'T02A80YKK',
//   team_domain: 'redbadger',
//   channel_id: 'D01R6L9NQ3S',
//   channel_name: 'directmessage',
//   user_id: 'U01QP0VJWJG',
//   user_name: 'cedd.burge',
//   command: '/get_manager',
//   text: '@cedd.burge',
//   api_app_id: 'A01SHH2QF8S',
//   is_enterprise_install: 'false',
//   response_url: 'https://hooks.slack.com/commands/T02A80YKK/2001166095842/CZprfzCQr6UoWSc5d0DiZivb',
//   trigger_id: '2024969546880.2348032665.16dbba515458bbd713a6e1216cf16bbd'
// }
app.post('/getManager', async (req, res) => {
  console.log(req.body)

  // todo: validate the inputs

  // todo: currently this will be '@cedd.burge' or similar, we will probably want to convert it
  // into to something else here (probably cedd.burge@redbadger.com)
  const userName = req.body.text

  // const hr_response = await fetch(`http://localhost:${daprPort}/v1.0/invoke/hr.hr/method/graphql`, {
  //   "body": JSON.stringify(
  //     {
  //       "query": managerQuery,
  //       "variables": { userId: req.body.user_name }
  //     }),
  //   "method": "POST",
  // })

  // const hr_body = await hr_response.json()

  // const manager = hr_body.data.human.manager.name
  const manager = 'cedd'

  // todo: if there is an error, catch it and retur a 200 with some explanatory text, as per
  // slack guidelines at https://api.slack.com/interactivity/slash-commands#responding_with_errors
  res.json(slackReply(userName, manager))

  // Instead of / as well as returning a response, you can also post to an endpoint.
  // This allows longer reponse times, conversations, and things like that
  // await fetch(req.body.response_url, {
  //   "body": JSON.stringify({ "text": chatMessage }),
  //   "method": "POST"
  // })

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
