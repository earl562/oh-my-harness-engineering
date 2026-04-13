export function flushPendingToolCalls(chunks) {
  const toolCalls = []
  let pending = null

  for (const chunk of chunks) {
    if (chunk.type === 'tool_call') {
      pending = chunk
      continue
    }

    if (pending) {
      toolCalls.push(pending)
      pending = null
    }
  }

  return toolCalls
}
