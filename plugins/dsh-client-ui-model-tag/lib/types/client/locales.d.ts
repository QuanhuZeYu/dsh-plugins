/** `modelEffortTag` namespace dictionaries. */
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    tooltip: string;
};
/** The tag namespace key union. */
export type ModelEffortTagKey = keyof typeof zh;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The per-message model/effort tag copy. */
        modelEffortTag: ModelEffortTagKey;
    }
}
/** English dictionary, checked complete against the zh key set. */
export declare const en: {
    tooltip: string;
};
//# sourceMappingURL=locales.d.ts.map