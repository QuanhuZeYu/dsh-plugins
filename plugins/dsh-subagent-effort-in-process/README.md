# @deepseek-ai/dsh-subagent-effort-in-process

English | [中文](README.zh.md)

The effort backend runs each child in the current process exactly like the [spawn backend](../subagent-spawn-in-process/README.md), and additionally applies a caller-requested reasoning effort to every child model request.

## Behavior

`start(request)` delegates to [`startInProcessRun`](../subagent-in-process-driver/README.md) with no seed and awaits publication before returning. The child receives parent working-directory/session lineage and inherits the parent model unless overridden, but starts with an empty conversation. The shared driver owns depth checking, persona and tool-filter setup, structured output, required-signal cancellation, one-shot execution, result reading, and quiescent disposal.

The plugin additionally observes the `agent/request` waterfall: when the requesting agent's `AgentOptions.reasoningEffort` is set and the current proposal carries no explicit reasoning effort, the requested value is injected into the call config before dispatch. The routed adapter then validates it against the model's capabilities (`UNSUPPORTED_REASONING_EFFORT` before any model request) and logs the effective value in the child's `request/header`, so later steps and cold resume keep it. An explicitly proposed effort — from a header restore or another `agent/request` listener — always wins.

`dsh-tool-subagent` forwards the model's `reasoning_effort` tool argument as `AgentOptions.reasoningEffort` on every delegation it starts, which is how a caller requests an effort per call. Children created through any other path are unaffected unless they carry the option.

## Capabilities

Effort reuses the spawn provider class, so it advertises the same `{ outputSchema: true, depthLimit: true, toolFilter: true, persona: true }` and enforces all four features in the child's creation window.

## Config

| Key | Meaning |
|---|---|
| `providerName` | Registry name on `ctx.subagents` (default `spawn-effort`). |
| `toolName` | Model-facing delegation tool name (default `subagent_effort`). |
| `listToolName` | Model-facing model-listing tool name (default `list_models`). |

## Model Experience

### Package tools

#### What the model sees

Two tools signal the caller-selected routing for one in-process child. `subagent_effort` delegates a self-contained task with an optional `model` and `reasoning_effort` (`run_in_background: true` returns a job id collectable with `job_output` and stoppable with `job_kill`): `model` names a model id advertised by the route (omit to inherit the parent conversation model), and `reasoning_effort` selects `off`/`low`/`high`/`max` (omit for the routed model default). `list_models` lists the ids one provider route currently advertises through `ctx.llm.listModels` (advisory: the route may accept unlisted ids), defaulting to the calling agent's own route; the caller uses the ids for the delegation tool's `model` argument.

#### Token effect

Each package adds its fixed schema cost per parent request; the child's routed model and effort change only request scalars, never prompt or schema tokens.

#### KV Cache effect

Prefix-stable while tool names, descriptions, and schemas are unchanged; a delegation's model/effort choices do not alter the request prefix of either parent or child.

### Child-agent request

### Child-agent request

#### What the model sees

The fresh child receives the standalone task content verbatim, inherits the parent model and workspace by default, and sees the global prompt with any configured child-scoped persona shadow. When the parent tool call requested a reasoning effort, that value is applied to every child model request and recorded in its request header; otherwise the child runs on its routed model default.

#### Token effect

The child pays for a new independent context and history; no parent-history tokens are duplicated. The requested effort changes the reasoning budget of each child request, not prompt or schema tokens.

#### KV Cache effect

Independent of the parent request cache. A changed effort is a request scalar recorded in the header; it does not alter the child's request prefix.

### Parent tool result, indirectly

#### What the model sees

Through `dsh-tool-subagent`, the parent receives only the child's final output or stop-reason error.

#### Token effect

Parent input grows by one data-dependent result retained until compaction.

#### KV Cache effect

Append-only; newly visible content follows the reusable request prefix and does not invalidate existing KV-cache entries.

## Known Limitations and Deferred Work

- **Effort only rides `AgentOptions`** — the observation injects `AgentOptions.reasoningEffort` only; a child created directly without the option keeps its routed model default, and this package provides no deployment-level default (the routed adapter's own default applies).
- **The observation is not provider-scoped** — loading this package enables the passthrough for every agent carrying the option, whichever provider started it. The `spawn-effort` provider name exists so compositions can route effort-aware delegations to a distinct backend, and its run behavior is identical to `spawn`.
