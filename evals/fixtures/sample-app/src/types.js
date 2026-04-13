/**
 * @typedef {object} PolyConfig
 * @property {string} appName
 * @property {number} port
 */

export function createPolyConfig(overrides = {}) {
  return {
    appName: 'sample-app',
    port: 3000,
    ...overrides
  }
}
