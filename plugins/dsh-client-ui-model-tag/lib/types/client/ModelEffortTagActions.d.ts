/**
 * Per-message model/effort tag inside the assistant message's IconActions row.
 * Reads the addressed assistant message's request config from the session
 * snapshot's `trajectory` view (the same requests the Trajectory panel shows,
 * each with provider/model plus reasoning effort and its result sequence),
 * matched to the message by resultSeq. Absent configs render nothing.
 * @module @deepseek-ai/dsh-client-ui-model-tag/client/ModelEffortTagActions
 */
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Full props of the assistant-message model/effort tag entry. */
export type ModelEffortTagActionProps = PropsRuntime<'conversation.chat.assistant-actions'> & PropsLocale<'modelEffortTag'>;
/** The request-config face we read; structural, decoupled from the trajectory package. */
export interface ModelRequestConfig {
    readonly provider?: string;
    readonly model?: string;
    readonly reasoningEffort?: string;
}
/** Render one provider/model · effort label from a request config. */
export declare function ModelEffortTagLabel({ config, t, className }: {
    /** The request config to present. */
    config: ModelRequestConfig | undefined;
    /** The modelEffortTag locale seat. */
    t: (key: 'tooltip') => string;
    /** Extra class composed onto the label root; the turn-status strip uses its margin variant. */
    className?: string | undefined;
}): import("react").JSX.Element | null;
/**
 * The tag entry component: a quiet model/effort label for one assistant message.
 * @param props - the addressed message id, the standard useSession source, and the locale seat.
 * @returns the label, or null when the message has no recorded request config.
 */
export declare function ModelEffortTagActions({ messageId, useSession, t }: ModelEffortTagActionProps): import("react").JSX.Element;
/** Full props of the running-turn status strip occupant. */
export type ModelEffortTagTurnStatusProps = PropsRuntime<'conversation.chat.turnStatus'> & PropsLocale<'modelEffortTag'>;
/**
 * The running-turn status entry: shows the in-flight request's
 * provider/model · effort beside the "Deep diving..." strip and its clock.
 * @param props - the turn status owner share (in-flight request config) and the locale seat.
 */
export declare function ModelEffortTagTurnStatus({ requestConfig, t }: ModelEffortTagTurnStatusProps): import("react").JSX.Element;
//# sourceMappingURL=ModelEffortTagActions.d.ts.map