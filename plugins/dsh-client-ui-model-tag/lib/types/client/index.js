/**
 * Model-effort tag plugin, browser half: a quiet per-message label in the
 * conversation.chat.assistant-actions strip showing the model and reasoning
 * effort used to generate that assistant message. Pure render: no store, no
 * Remote, no per-session state — every message's config is read live from the
 * conversation snapshot via the standard useSession source.
 * @module @deepseek-ai/dsh-client-ui-model-tag/client
 */
import { ModelEffortTagActions, ModelEffortTagTurnStatus } from "./ModelEffortTagActions.js";
import { en, zh } from "./locales.js";
/** Dictionary namespace owned by this plugin. */
const NS = 'modelEffortTag';
/** Required services: the slot registry and the copy seat. */
export const inject = ['slots', 'locale'];
/**
 * Client plugin body: register the per-message model/effort tag entry.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-model-tag: dictionaries');
    ctx.slots.inject('conversation.chat.assistant-actions', () => {
        const dispose = ctx.slots.register({
            name: 'conversation.chat.assistant-actions',
            id: 'model-effort-tag',
            order: 6,
            locale: NS,
        }, ModelEffortTagActions);
        return () => { dispose(); };
    });
    ctx.slots.inject('conversation.chat.turnStatus', () => {
        const dispose = ctx.slots.register({
            name: 'conversation.chat.turnStatus',
            locale: NS,
        }, ModelEffortTagTurnStatus);
        return () => { dispose(); };
    });
}
//# sourceMappingURL=index.js.map