/**
 * Locale bundles for the NB Search settings card. `zh` is the source of truth
 * for the key set; `en` is typed against the same union, so a missing or extra
 * key in either bundle is a compile error.
 */
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** NB Search plugin card copy. */
        'nb-search': NbSearchLocaleKey;
    }
}
/** Locale keys this card renders. */
export type NbSearchLocaleKey = 'title' | 'description' | 'expand' | 'collapse' | 'configFile' | 'configFileHint' | 'configFileExample' | 'defaultSearchLane' | 'defaultSearchLaneHint' | 'defaultSearchLaneExample' | 'defaultFetchPipeline' | 'defaultFetchPipelineHint' | 'defaultFetchPipelineExample' | 'overridden' | 'reset' | 'inherits' | 'readOnly' | 'unsaved' | 'save' | 'saving' | 'discard' | 'reload' | 'reloading' | 'saved' | 'saveRejected' | 'saveConflict';
/** Simplified Chinese copy. */
export declare const zh: Record<NbSearchLocaleKey, string>;
/** English copy. */
export declare const en: Record<NbSearchLocaleKey, string>;
