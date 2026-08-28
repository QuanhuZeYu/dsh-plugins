import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import css from './ModelEffortTagActions.module.css';
/** Render one provider/model · effort label from a request config. */
export function ModelEffortTagLabel({ config, t, className }) {
    const model = config?.model;
    if (model === undefined)
        return null;
    const provider = config?.provider;
    const effort = config?.reasoningEffort;
    // Provider/model · effort — the same provider identity the Trajectory panel
    // records for the request, folded into the per-message IconActions row.
    const label = provider !== undefined ? `${provider}/${model}` : model;
    return (_jsxs("span", { className: className === undefined ? css.tag : `${css.tag} ${className}`, title: t('tooltip'), children: [label, effort !== undefined ? ` · ${effort}` : ''] }));
}
/**
 * Resolve the request config of the addressed assistant message, if any.
 * @param snapshot - conversation snapshot from the standard useSession source.
 * @param messageId - the addressed finalized assistant message id.
 * @returns the request config, or undefined when the trajectory view is absent
 *   or no matching request is recorded.
 */
function requestConfigOf(snapshot, messageId) {
    for (const node of snapshot.nodes) {
        if (node.kind !== 'assistant' || node.messageId !== messageId)
            continue;
        const inspection = snapshot.views.get('trajectory');
        const request = inspection?.requests.find(candidate => candidate.resultSeq === node.seq);
        return request?.requestConfig;
    }
    return undefined;
}
/**
 * The tag entry component: a quiet model/effort label for one assistant message.
 * @param props - the addressed message id, the standard useSession source, and the locale seat.
 * @returns the label, or null when the message has no recorded request config.
 */
export function ModelEffortTagActions({ messageId, useSession, t }) {
    const config = useSession(snapshot => (requestConfigOf(snapshot, messageId)));
    return _jsx(ModelEffortTagLabel, { config: config, t: t });
}
/**
 * The running-turn status entry: shows the in-flight request's
 * provider/model · effort beside the "Deep diving..." strip and its clock.
 * @param props - the turn status owner share (in-flight request config) and the locale seat.
 */
export function ModelEffortTagTurnStatus({ requestConfig, t }) {
    return _jsx(ModelEffortTagLabel, { config: requestConfig, t: t, className: css.tagStatus });
}
//# sourceMappingURL=ModelEffortTagActions.js.map