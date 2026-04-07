# Voice Agent Harnesses

## What It Is

A voice agent harness converts speech to intent, executes actions, and returns synthesized speech — all with latency requirements that make the standard text-agent loop architecture unworkable. Latency is not a UX preference here; it is a functional requirement. Humans perceive pauses over 300ms as unnatural in conversation. A text agent that takes 3 seconds per turn is fine; a voice agent that takes 3 seconds per turn feels broken.

## The Voice Loop vs the Text Loop

The standard text agent loop:

```
User types → [Full text received] → LLM call → [Response complete] → Display
```

A naive voice loop (wrong):
```
User speaks → [Wait for silence] → STT → LLM call → [Wait for completion] → TTS → Play
```

This naive approach has 2-4 seconds of end-to-end latency: VAD detection delay + STT + LLM + TTS. Unusable.

The correct voice loop (Realtime API pattern):

```
User speaks ──────────────────────────────────────────
                 ↓ audio chunks stream
         [VAD + Streaming STT]
                 ↓ partial transcript
         [LLM begins processing early]
                 ↓ tokens stream as generated
         [TTS synthesizes in parallel]
                 ↓ audio chunks play immediately
Agent responds ───────────────────────────────────────
```

Every stage must be streaming and parallel. The agent starts synthesizing speech before the LLM has finished generating tokens. The user hears the beginning of the response within 300-800ms of finishing speaking.

## OpenAI Realtime API

OpenAI's Realtime API (launched late 2024) is the first production-grade voice agent infrastructure:

**Key design decisions:**
- **Single WebSocket connection** — audio in, audio out, events bidirectionally over one persistent connection
- **Native multimodal** — the model processes audio tokens directly (no separate STT step); preserves prosody, emotion, and paralinguistic cues that text transcription destroys
- **Turn detection built-in** — server-side VAD (Voice Activity Detection) with configurable thresholds; clients don't have to implement their own
- **Function calling** — full tool use works in the realtime context; the model can call a function mid-conversation and resume speech with the result
- **Interruption handling** — when the user starts talking while the agent is speaking, the server detects it, cancels the in-progress generation, and starts listening

**Event types a harness must handle:**
```
input_audio_buffer.speech_started
input_audio_buffer.speech_stopped
conversation.item.created          ← user turn or function call
response.created
response.audio.delta               ← stream audio chunks to speaker
response.function_call_arguments.delta
response.done
error
```

**Tool execution in voice context:**
```
[User speaks request]
    ↓
[Model decides to call a tool]
response.output_item.added (type: function_call)
    ↓
[Harness executes tool synchronously]
    ↓
conversation.item.create (type: function_call_output)
response.create         ← tell model to continue
    ↓
[Model resumes speaking]
```

The key constraint: tool execution must be fast (sub-500ms ideally). A slow tool call means silence during the call — jarring in a voice conversation. Harnesses either pre-cache likely lookups or show a "thinking" filler audio ("let me check on that...") while tools run.

## LiveKit and Real-Time Infrastructure

LiveKit is the leading open-source infrastructure layer for voice agents. It handles:
- WebRTC connections between clients and agent workers
- Audio mixing, echo cancellation, and noise suppression
- Worker pool management (spinning up agent instances per call)
- Room management (connecting participants)

The LiveKit Agents framework (Python) provides a voice-specific agent abstraction:

```python
from livekit.agents import AgentSession, Agent
from livekit.plugins import openai, silero

async def entrypoint(ctx: JobContext):
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=openai.STT(),
        llm=openai.realtime.RealtimeModel(),
        tts=openai.TTS(),
    )
    await session.start(ctx.room, agent=MyAgent())
```

LiveKit abstracts the WebRTC complexity; you write the agent logic, it handles the media pipeline.

## Different Constraints vs Text Agents

| Constraint | Text Agent | Voice Agent |
|-----------|-----------|------------|
| Turn latency | 1-5s acceptable | <500ms required |
| Response length | Unlimited | Short (1-3 sentences before yielding) |
| Tool execution | During turn | Must be fast (<500ms) or filler audio |
| Interruption | Not applicable | Must be handled gracefully |
| Context window | Full history | Recent turns only (speech is verbose) |
| Error display | Show error text | Must speak error in natural language |
| Multi-turn state | Message array | Plus audio buffer state |
| Streaming | Nice to have | Mandatory |

## Voice-Specific UX Patterns

**Turn-taking signals** — the agent must signal when it expects a response ("Does that work for you?") and when it's still speaking and doesn't want interruption. Text agents have no equivalent.

**Barge-in handling** — when the user interrupts (barge-in), the agent must stop speaking immediately (cancel the audio stream), acknowledge the interruption, and process the new input. Implemented at the audio level, not the LLM level.

**Filler responses** — while tools run or LLM latency is high: "Let me check on that for you..." played immediately, then the real response follows. Creates the illusion of conversation continuity.

**Prosody and pace** — voice agents should vary sentence length and rhythm to sound natural. Very long sentences delivered in a monotone feel robotic. Some harnesses inject pacing instructions into the system prompt: "Speak in short sentences. Pause naturally between topics."

**Phone-specific constraints** — PSTN phone calls (via Twilio, Telnyx) add codec limitations (8kHz audio, G.711), additional latency (50-200ms), and acoustic noise. Voice harnesses targeting phone must handle degraded audio quality.

## Framework Landscape

| Framework | Language | Notable Feature |
|-----------|---------|----------------|
| **LiveKit Agents** | Python | Full WebRTC stack, open source, production-proven |
| **Pipecat** | Python | Pipeline-based composition, 40+ integrations |
| **Vapi** | API/SDKs | Managed infrastructure for voice AI |
| **Retell AI** | API | Optimized for phone (PSTN) calls |
| **Daily.co** | API | WebRTC infrastructure with AI helpers |
| **OpenAI Realtime Agents SDK** | Python/JS | Official helper library for Realtime API |

## Voice Agent Architecture

A complete voice agent harness:

```
[Phone/WebRTC Client]
    ↓ audio stream
[Media Server (LiveKit/Daily)]
    ↓ audio chunks
[VAD] → speech boundaries
    ↓ audio segments
[STT or Native Audio LLM]
    ↓ transcripts + tokens
[LLM with tools] → function calls
    ↓
[Tool executor] → results back to LLM
    ↓ tokens
[TTS] → audio chunks
    ↓
[Media Server] → [Client]
```

The harness must manage state across all these stages simultaneously — the pipeline has multiple items in flight at once (previous TTS audio playing while next LLM tokens arrive).

## When Voice Changes Everything

The shift to voice forces architectural rethinking at every layer:

- **System prompt** — must instruct the model to speak conversationally, give short responses, and ask clarifying questions rather than dump information
- **Memory** — conversation summaries matter more (audio context is verbose); the harness must aggressively summarize older turns
- **Tool design** — every tool must return a voice-friendly response, not a markdown table or JSON blob. Tools need a `voice_response` field alongside their structured output.
- **Error recovery** — can't show a red error message; must speak a graceful recovery in natural language

## Resources

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime) — the definitive reference
- [LiveKit Agents Framework](https://docs.livekit.io/agents/) — open-source voice agent infrastructure
- [Pipecat AI](https://www.pipecat.ai/) — pipeline-based voice agent composition
- [OpenAI Realtime Agents SDK](https://github.com/openai/openai-realtime-agents) — official example implementations
- [Vapi Documentation](https://docs.vapi.ai/) — managed voice AI infrastructure
