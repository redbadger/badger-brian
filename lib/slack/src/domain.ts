import { SlackReply, composeSlackReply as coreComposeSlackReply } from './core';


async function composeSlackReply(
  userName: String,
  fetchManager: (userName: String) => Promise<String>
): Promise<SlackReply> {
  const manager = await fetchManager(userName)
  return coreComposeSlackReply(userName, manager)
}

export { composeSlackReply }
