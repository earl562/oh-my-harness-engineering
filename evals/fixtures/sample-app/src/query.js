export function formatQuery(messages) {
  return messages
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n')
}
