const slackReply = (userName: String, manager: String) => {
    return {
        "response_type": "in_channel",
        "text": `The manager of ${userName} is ${manager}`
    }
}

export { slackReply }
