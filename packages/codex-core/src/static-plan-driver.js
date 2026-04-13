export function createStaticPlanDriver(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new TypeError('Static plan driver requires a non-empty steps array.')
  }

  let index = 0

  return {
    id: 'static-plan-driver',
    async nextTurn() {
      const step = steps[index]
      index += 1

      if (!step) {
        return {
          message: 'Static plan complete.',
          complete: true,
          toolCalls: []
        }
      }

      return {
        message: step.message ?? '',
        complete: Boolean(step.complete),
        toolCalls: step.toolCalls ?? []
      }
    }
  }
}
