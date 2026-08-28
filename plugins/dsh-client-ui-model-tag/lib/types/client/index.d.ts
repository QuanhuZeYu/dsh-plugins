/**
 * Model-effort tag plugin, browser half: a quiet per-message label in the
 * conversation.chat.assistant-actions strip showing the model and reasoning
 * effort used to generate that assistant message. Pure render: no store, no
 * Remote, no per-session state — every message's config is read live from the
 * conversation snapshot via the standard useSession source.
 * @module @deepseek-ai/dsh-client-ui-model-tag/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services: the slot registry and the copy seat. */
export declare const inject: string[];
/**
 * Client plugin body: register the per-message model/effort tag entry.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map