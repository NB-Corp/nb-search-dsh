import type { Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
export { Config } from './config.ts';
export declare const name = "nb-search";
export declare const inject: string[];
/** Full SDK tools; the official web_search/web_fetch registry is untouched. */
export declare function apply(ctx: Context, entry: Config): void;
