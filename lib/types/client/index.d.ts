/**
 * NB Search plugin, browser half — the settings card that configures the SDK's
 * config source and its default search lane and URL fetch pipeline.
 *
 * The card registers into the shared `settings.plugin.item` slot keyed by the
 * `nb-search` namespace the Host half registers, so the plugin-configuration
 * tab pairs the two halves automatically. This is the whole browser half: one
 * card, one controller, and the dictionaries the card renders.
 *
 * Read and write semantics come from the Host: the card reads the bound
 * settings scope for the section's resolved/base/user layers, and writes one
 * revision-fenced `settings.mutate` batch. Nothing here invents a settings
 * transport or a second source of truth.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export type { NbSearchCardFace, NbSearchCardState, NbSearchField, } from './nb-search-card-controller.ts';
export type { NbSearchCardProps } from './NbSearchCard.tsx';
export type { NbSearchLocaleKey } from './locales.ts';
/**
 * Required services: the settings transport and the slots/locale the card
 * registers into. `remote` carries the forwarded settings invalidation that
 * `ctx.settingsScope.bind(spec)` subscribes to on this context.
 */
export declare const inject: string[];
/**
 * Register the NB Search card into the plugin configuration section.
 * @param ctx - the browser plugin context.
 */
export declare function apply(ctx: ClientContext): void;
