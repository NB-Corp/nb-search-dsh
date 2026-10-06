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

import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
// Type-only: pulls the settings scope service merge (ctx.settingsScope) and the
// settings SlotMap keys. Cross-plugin collaboration goes through the service,
// never a value import (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the keyed `settings.plugin.item` slot declaration this card
// registers into.
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
// Type-only: the locale service merge (ctx.locale) and the locale SlotMap table.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { NbSearchCard } from './NbSearchCard.tsx'
import { NbSearchCardController, NB_SEARCH_NS } from './nb-search-card-controller.ts'
import { en, zh } from './locales.ts'

export type {
  NbSearchCardFace, NbSearchCardState, NbSearchField,
} from './nb-search-card-controller.ts'
export type { NbSearchCardProps } from './NbSearchCard.tsx'
export type { NbSearchLocaleKey } from './locales.ts'

/** Dictionary namespace owned by this plugin. */
const NS = 'nb-search'

/**
 * Required services: the settings transport and the slots/locale the card
 * registers into. `remote` carries the forwarded settings invalidation that
 * `ctx.settingsScope.bind(spec)` subscribes to on this context.
 */
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope']

/**
 * Register the NB Search card into the plugin configuration section.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const { api } = ctx.get('connection') as ConnectionHandle
  const scope = ctx.settingsScope.bind<Record<string, unknown>>({ namespace: NB_SEARCH_NS })
  // The describe face is the Host's canonical document view: an accepted write
  // answer folds into it, so the bound scope re-derives without a wire read.
  const card = new NbSearchCardController(scope, api, ctx.settingsScope.describe())

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'nb-search: card dictionaries')
  // The card owns one controller for the plugin's lifetime. Its cleanup awaits
  // the wire calls already in flight, so fiber unload never strands a write.
  ctx.effect(() => async () => { await card.dispose() }, 'nb-search: card controller')

  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: NB_SEARCH_NS,
    locale: NS,
    inject: () => card.inject(),
  }, NbSearchCard))
}
