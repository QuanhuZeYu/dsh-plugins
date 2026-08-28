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
/**
 * The tag entry component: a quiet model/effort label for one assistant message.
 * @param props - the addressed message id, the standard useSession source, and the locale seat.
 * @returns the label, or null when the message has no recorded request config.
 */
export declare function ModelEffortTagActions({ messageId, useSession, t }: ModelEffortTagActionProps): import("react").JSX.Element | null;
//# sourceMappingURL=ModelEffortTagActions.d.ts.map