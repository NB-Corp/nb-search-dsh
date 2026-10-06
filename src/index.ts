import type { Context } from '@deepseek-ai/cordis'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'
import { installSettingsSection } from '@deepseek-ai/dsh-settings'
import { searchInputSchema, fetchInputSchema, fetchActionInputSchema, capabilitiesInputSchema } from '@nb-corp/nb-search'
import { Config, NB_SEARCH_NS, createRuntime, validateConfig } from './config.ts'
import { envelopeSchema, renderEnvelope } from './output.ts'

export { Config } from './config.ts'
export const name = 'nb-search'
export const inject = ['tools']

/** Full SDK tools; the official web_search/web_fetch registry is untouched. */
export function apply(ctx: Context, entry: Config): void {
  let source = () => entry
  let runtime: ReturnType<typeof createRuntime> | undefined
  let runtimeConfig: Config | undefined
  const stopping = new AbortController()
  const pending = new Set<Promise<unknown>>()
  installSettingsSection(ctx, NB_SEARCH_NS, Config, entry, {
    validate: value => {
      // Initial registration must expose a repairable namespace even when
      // inherited SDK configuration is invalid. Writes still validate before
      // persistence; execution validates the fully composed source.
      if (ctx.get('settings')?.get(NB_SEARCH_NS) !== undefined) validateConfig(value)
    },
    setSource: current => { source = current },
    onChange: () => { runtime = undefined },
  })

  ctx.effect(() => async () => {
    stopping.abort(new Error('nb-search plugin unloaded'))
    await Promise.allSettled([...pending])
  })

  const definitions = [
    {
      name: 'nb_search',
      description: 'Search using NB Search. Supports batch queries, explicit lane/lanes/preset, freshness, sync/async jobs, and get/read/cancel. Call nb_search_capabilities for configured choices and modes. Async run requires idempotency_key; honor poll_after_ms, retain cursors and partial/error/hints, and cite result source URLs. No implicit search default exists unless configured.',
      parser: searchInputSchema,
      execute: async (args: unknown, signal: AbortSignal) => (await getRuntime()).search(searchInputSchema.parse(args), { signal }),
    },
    {
      name: 'nb_fetch',
      description: 'Retrieve URL or convert inline text/bytes or admitted local files through NB Search. Supports pipeline, representation, bounds and sync/async run/get/read/cancel. URL shorthand is allowed; use source for other inputs. Call nb_search_capabilities for supported modes. Async requires idempotency_key. Preserve source identity, partial/truncation warnings and cursors; authentication walls are not authenticated content.',
      parser: fetchInputSchema,
      execute: async (args: unknown, signal: AbortSignal) => (await getRuntime()).fetch(fetchActionInputSchema.parse(fetchInputSchema.parse(args)), { signal }),
    },
    {
      name: 'nb_search_capabilities',
      description: 'Inspect the current NB Search configuration: providers, lanes, presets, fetch pipelines, availability, execution modes, acquisition bounds and jobs. Local configuration inspection only; no provider health probe. Use before choosing a lane or pipeline.',
      parser: capabilitiesInputSchema,
      execute: async (args: unknown, signal: AbortSignal) => (await getRuntime()).capabilities(capabilitiesInputSchema.parse(args), { signal }),
    },
  ]

  function getRuntime() {
    const current = source()
    if (current !== runtimeConfig) {
      runtimeConfig = current
      runtime = undefined
    }
    if (runtime) return runtime
    const candidate = createRuntime(current)
    runtime = candidate
    void candidate.catch(() => { if (runtime === candidate) runtime = undefined })
    return candidate
  }

  for (const definition of definitions) {
    const { $schema: _schema, ...parameters } = definition.parser.toJSONSchema({ io: 'input' })
    ctx.tools.register({
      name: definition.name,
      description: definition.description,
      parameters,
      output: { schema: envelopeSchema, render: (_args, value) => renderEnvelope(value) },
      execute(args, exec) {
        if (stopping.signal.aborted) throw stopping.signal.reason
        const signal = AbortSignal.any([exec.signal, stopping.signal])
        const work = definition.execute(args, signal).then(value => JSON.parse(JSON.stringify(value)) as unknown)
        pending.add(work)
        void work.then(() => pending.delete(work), () => pending.delete(work))
        return work
      },
      presentCall: args => ({ card: 'generic', title: definition.name, kind: 'search', rawInput: args }),
    } satisfies ToolDefinition)
  }
}
