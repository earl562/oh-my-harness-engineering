export function buildRoute(method, pathName, handler) {
  return {
    method,
    path: pathName,
    handler
  }
}

export const routes = [
  buildRoute('GET', '/status', 'statusHandler')
]
