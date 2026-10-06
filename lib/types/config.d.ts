import z from '@deepseek-ai/schemastery';
/** Join key for the host namespace and browser settings card. */
export declare const NB_SEARCH_NS: import("@deepseek-ai/dsh-settings").SettingsNamespace;
/** Empty optional strings inherit the SDK's config/environment resolution. */
export interface Config {
    configFile?: string;
    defaultSearchLane?: string;
    defaultFetchPipeline?: string;
}
/** Live settings exposed through DSH's revision-fenced settings scope. */
export declare const Config: z<Config>;
/** Refuse missing files and unresolved configured defaults before persistence. */
export declare function validateConfig(value: Config): void;
/** Rebuild from the next call's settings while retaining SDK local-input chains. */
export declare function createRuntime(value: Config): Promise<import("@nb-corp/nb-search").NbSearchRuntime>;
