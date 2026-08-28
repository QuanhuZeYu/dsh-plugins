/**
 * The in-process EFFORT subagent backend plus its own model-facing tools.
 * Registers the spawn provider under a distinct name, applies the
 * caller-requested reasoning effort (`AgentOptions.reasoningEffort`) to every
 * child model request through the `agent/request` waterfall, and exposes two
 * tools: `subagent_effort` delegates a task to an in-process child with an
 * explicit model and reasoning effort, and `list_models` lists the models a
 * provider route currently advertises (`ctx.llm.listModels`), so callers can
 * pick a model id for the delegation tool.
 * @module @deepseek-ai/dsh-subagent-effort-in-process
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "subagent-effort-in-process";
export declare const inject: string[];
/** Config: the registry name to register the provider under, plus tool names. */
export interface Config {
    /** Provider name on `ctx.subagents` (default `spawn-effort`). */
    providerName: string;
    /** Name of the delegation tool (default `subagent_effort`). */
    toolName?: string;
    /** Name of the model-listing tool (default `list_models`). */
    listToolName?: string;
}
export declare const Config: z<Config>;
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map