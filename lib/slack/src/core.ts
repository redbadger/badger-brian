interface SlackReply {
    response_type: String,
    text: String
}

// Slack sends application/x-www-form-urlencoded data, example in exampleRequest.txt
// Details at https://api.slack.com/interactivity/slash-commands#app_command_handling
// This function expects this to be decoded in to an object (express does this
// automatically very easily), example below.
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
const getUserName = (body: any) => {
    return body.text
}

const composeSlackReply = (userName: String, manager: String) => {
    return {
        "response_type": "in_channel",
        "text": `The manager of ${userName} is ${manager}`
    }
}

export { SlackReply, composeSlackReply, getUserName }
