# Browser Use: Control-Plane Sandboxing for Web Agents

## The Problem

Browser agents create a harsher threat model than many coding agents.

They need to:

- browse untrusted sites,
- handle user authentication,
- store browser state,
- and sometimes execute code or shell commands alongside browser automation.

If the agent loop runs on the same backend that holds secrets, a compromised agent can reach API keys, storage credentials, databases, or internal services.

## The Approach

Browser Use frames the design choice as two sandboxing patterns:

1. **Isolate the tool**
   Keep the agent on your infrastructure and run dangerous operations in a sandbox the agent calls remotely.
2. **Isolate the agent**
   Run the entire agent inside a sandbox and let it reach the outside world only through a control plane.

Browser Use explicitly moved from the first pattern to the second.

In the production architecture:

- each agent session runs in its own Unikraft microVM,
- the sandbox receives only a minimal session identity,
- the control plane holds the real credentials,
- LLM calls are proxied through the control plane,
- and files sync through presigned URLs instead of raw cloud credentials.

For development and evals, the same image can run as a Docker container. That keeps the development loop simple while preserving a production path with a stronger isolation boundary.

The related authentication guidance strengthens the same idea: agents need account access, but the harness should treat credentials as brokered capabilities, not raw secrets dumped into the runtime.

## Why It Works

This pattern works because it changes what there is to steal.

If the sandbox contains no durable secrets and no privileged infrastructure access:

- a compromise is more contained,
- the agent becomes disposable,
- resume/restart is easier,
- and scaling the agent runtime becomes operationally cleaner.

The control plane also centralizes cost controls, policy, logging, and session truth. That is valuable even without a security incident.

## Trade-offs

This design is not free.

- Every external operation adds another network hop.
- You now operate both a control plane and a sandbox fleet.
- Session state design becomes stricter because the sandbox should stay disposable.
- Local development is more complex unless the system offers a faithful lower-friction fallback.

Browser Use handles that last point with a dual-mode strategy: Docker for local/evals, microVMs for production.

## Lessons for Your Harness

### 1. The sandbox should be boring to compromise

The safest runtime is one that does not contain anything valuable. That is stronger than trying to perfectly detect malicious intent.

### 2. Secret brokering is a harness feature

Authentication is not a side concern for browser or personal-assistant agents. The harness must define how cookies, tokens, 2FA flows, and session state cross the trust boundary.

### 3. Development and production can use different isolation backends

One image, one protocol, different isolation targets is a pragmatic pattern. It keeps evals and local work fast without pretending Docker and microVMs have the same trust properties.

### 4. "Isolate the tool" is a useful stepping stone, not always the end state

For retrofits, tool isolation may be enough. For higher-autonomy systems, isolating the full agent usually produces a cleaner security story.

### 5. Browser agents and coding agents are converging

Once a browser agent can execute code, download files, call tools, and coordinate state, it starts to look like a general harness problem. That means a serious harness repo should study browser and coding runtimes together, not as separate worlds.
