import { createPolyConfig } from './types.js'

export function deepMergeConfig(base, overrides = {}) {
  return {
    ...base,
    ...overrides
  }
}

export function applyEnvOverrides(config, env = process.env) {
  return {
    ...config,
    port: env.PORT ? Number(env.PORT) : config.port
  }
}

export function loadConfig(env = process.env) {
  const base = createPolyConfig()
  return applyEnvOverrides(base, env)
}
