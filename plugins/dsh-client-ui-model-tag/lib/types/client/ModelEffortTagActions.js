import { jsxs as _jsxs } from "react/jsx-runtime";
import css from './ModelEffortTagActions.module.css';
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
    const width = config?.model;
    if (width === undefined)
        return null;
    const effort = config?.reasoningEffort;
    return (_jsxs("span", { className: css.tag, title: t('tooltip'), children: [width, effort !== undefined ? ` · ${effort}` : ''] }));
}
//# sourceMappingURL=ModelEffortTagActions.js.map