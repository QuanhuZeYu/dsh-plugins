import z from "@deepseek-ai/schemastery";
import { SpawnInProcessProvider } from "@deepseek-ai/dsh-subagent-spawn-in-process";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { ReasoningEffortId } from "@deepseek-ai/dsh-llm";
import { settleRun } from "@deepseek-ai/dsh-subagent";
//#region lib/types/index.js
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
const name = "subagent-effort-in-process";
const inject = [
	"subagents",
	"tools",
	"llm"
];
const Config = z.object({
	providerName: z.string().default("spawn-effort"),
	toolName: z.string().default("subagent_effort"),
	listToolName: z.string().default("list_models")
});
/**
* Apply the per-agent reasoning effort requested in `AgentOptions` to every
* model request of that agent. An explicitly proposed effort — from a request
* header restore or another `agent/request` listener — wins.
* @param ctx - the context owning this registration.
*/
function applyRequestedEffort(ctx) {
	ctx.on("agent/request", async ({ agent }, next) => {
		const proposal = await next();
		const requested = agent.options.reasoningEffort;
		if (requested === void 0 || proposal.reasoningEffort !== void 0) return proposal;
		return {
			...proposal,
			reasoningEffort: requested
		};
	});
}
/** A non-\`completed\` stop reason means the child did not finish cleanly. */
function stopReasonError(result) {
	switch (result.stopReason) {
		case "completed": return;
		case "aborted": return "subagent run was cancelled";
		case "error": return "subagent run failed";
		case "max-tokens": return "subagent run hit its token limit before finishing";
		case "refusal": return "subagent declined the task";
		default: return `subagent run ended abnormally (${String(result.stopReason)})`;
	}
}
/** Text content of a child result, for error details and render output. */
function outputText(blocks) {
	return blocks.filter((block) => block.type === "text").map((block) => block.text).join("");
}
/**
* Register the package's model-facing tools.
* @param ctx - the context owning this registration.
* @param providerName - the subagent provider route delegations start on.
* @param toolName - the delegation tool\'s model-facing name.
* @param listToolName - the model-listing tool\'s model-facing name.
*/
function registerTools(ctx, providerName, toolName, listToolName) {
	ctx.tools.register(defineTool({
		name: toolName,
		description: "Delegate a self-contained task to an in-process child agent with an explicit model and reasoning effort. The child works in its own context and returns its final answer; its intermediate steps stay out of this conversation. This call waits for the child and returns its result.",
		parameters: {
			description: {
				type: "string",
				required: true,
				description: "A short (3-5 word) description of the delegated task, for display."
			},
			prompt: {
				type: "string",
				required: true,
				description: "The complete, self-contained task for the child: it does not see this conversation."
			},
			model: {
				type: "string",
				description: "Optional model id for the child agent, from `list_models`. Omitted means the child inherits the parent conversation model. A value the routed provider does not serve fails the child before any model request."
			},
			reasoning_effort: {
				type: "string",
				description: "Optional reasoning effort for the child agent: `off`, `low`, `high`, or `max`. Omitted means the child uses its routed model default; a value the routed model does not support fails the child run with UNSUPPORTED_REASONING_EFFORT before any model request."
			},
			run_in_background: {
				type: "boolean",
				description: "Whether to run as a background job and return its id. Defaults to false; collect with job_output or stop with job_kill."
			}
		},
		output: {
			schema: { oneOf: [{
				type: "object",
				additionalProperties: false,
				properties: {
					kind: {
						type: "string",
						required: true,
						const: "background"
					},
					jobId: {
						type: "string",
						required: true
					}
				}
			}, {
				type: "object",
				additionalProperties: false,
				properties: {
					kind: {
						type: "string",
						required: true,
						const: "foreground"
					},
					runId: {
						type: "string",
						required: true
					},
					output: {
						type: "array",
						required: true,
						items: { type: "json" }
					}
				}
			}] },
			render: (_args, value) => [{
				type: "text",
				text: value.kind === "background" ? `started background subagent job ${value.jobId}` : outputText(value.output)
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error(`${toolName} requires a calling agent`);
			const agentOptions = {
				...args.model === void 0 ? {} : { model: args.model },
				...args.reasoning_effort === void 0 ? {} : { reasoningEffort: ReasoningEffortId(args.reasoning_effort) }
			};
			const request = {
				label: args.description ?? "",
				prompt: [{
					type: "text",
					text: args.prompt ?? ""
				}],
				parent,
				signal: exec.signal,
				agentOptions
			};
			if (args.run_in_background === true) {
				const jobs = ctx.get("jobs");
				if (jobs === void 0) throw new Error(`${toolName}: background jobs unavailable (load @deepseek-ai/dsh-jobs in the composition)`);
				const controller = new AbortController();
				const start = ctx.subagents.start(providerName, {
					...request,
					signal: controller.signal
				});
				return {
					kind: "background",
					jobId: jobs.start({
						kind: "subagent",
						label: request.label ?? "",
						owner: parent,
						run: () => ({
							cancel: (reason) => {
								controller.abort(reason ?? "background subagent task killed");
							},
							done: start.then(async (run) => {
								try {
									return await settleRun(run);
								} catch {
									return { status: "failed" };
								}
							})
						})
					})
				};
			}
			const run = await ctx.subagents.start(providerName, request);
			const result = await run.result;
			await run.dispose();
			const error = stopReasonError(result);
			if (error !== void 0) {
				const partial = outputText(result.output);
				throw new Error(partial.length === 0 ? error : `${error}; partial output: ${partial}`);
			}
			return {
				kind: "foreground",
				runId: run.id,
				output: result.output
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: listToolName,
		description: "List model ids available on one provider route (advisory: the route may accept unlisted ids). Use the ids for the `model` argument of the delegation tool.",
		parameters: { provider: {
			type: "string",
			description: "Provider route to list. Omitted: the calling agent's route."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { models: {
					type: "array",
					required: true,
					items: { type: "json" }
				} }
			},
			render: (_args, value) => [{
				type: "text",
				text: value.models.map((m) => m.id).join("\n") || "(no models advertised)"
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const provider = args.provider ?? exec.agent?.options.provider;
			if (provider === void 0 || provider.length === 0) throw new Error(`${listToolName} needs a provider route`);
			return { models: (await ctx.llm.listModels(provider)).map((model) => ({
				id: model.id,
				...model.name === model.id ? {} : { name: model.name },
				...model.description === void 0 ? {} : { description: model.description },
				...model.inputModalities === void 0 ? {} : { inputModalities: [...model.inputModalities] }
			})) };
		}
	}));
}
function apply(ctx, config) {
	ctx.subagents.registerProvider(new SpawnInProcessProvider(config.providerName));
	applyRequestedEffort(ctx);
	registerTools(ctx, config.providerName, config.toolName ?? "subagent_effort", config.listToolName ?? "list_models");
}
//#endregion
export { Config, apply, inject, name };
