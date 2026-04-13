export const EVAL_RUBRIC = [
  {
    key: 'completion',
    label: 'Task completion',
    description: 'Did the harness actually finish the requested task with the expected artifacts or explanation?'
  },
  {
    key: 'edit_reliability',
    label: 'Edit reliability',
    description: 'How precisely did the harness make changes without collateral edits or stale assumptions?'
  },
  {
    key: 'context_efficiency',
    label: 'Context efficiency',
    description: 'Did the harness gather only the context it needed and keep output bounded?'
  },
  {
    key: 'latency_cost',
    label: 'Latency and cost',
    description: 'How many turns, tool calls, and likely tokens were needed for the result?'
  },
  {
    key: 'long_horizon_stability',
    label: 'Long-horizon stability',
    description: 'How well does the harness continue making progress without drift or brittle retries?'
  },
  {
    key: 'steerability',
    label: 'Human steerability',
    description: 'Can a human understand, inspect, and redirect what the harness is doing?'
  },
  {
    key: 'sandbox_strength',
    label: 'Sandbox strength',
    description: 'How clearly and safely does the harness enforce boundaries around files, commands, and network access?'
  },
  {
    key: 'observability',
    label: 'Observability',
    description: 'Does the trace make turns, tool calls, failures, and policy decisions visible enough for comparison?'
  }
]
