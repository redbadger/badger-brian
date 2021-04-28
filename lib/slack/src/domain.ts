import { SlackReply, composeSlackReply as coreComposeSlackReply } from './core';
import { fetchManager } from './infrastructure';


async function composeSlackReply(
  userName: String,
  getManager: (userName: String) => Promise<String>
): Promise<SlackReply> {
  const manager = await fetchManager(userName)
  return coreComposeSlackReply(userName, manager)
}

export { composeSlackReply }
