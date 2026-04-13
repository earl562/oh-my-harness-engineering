export function registerTools(tools) {
  return new Map(tools.map((tool) => [tool.name, tool]))
}

export function listToolNames(registry) {
  return [...registry.keys()]
}
