import z from '@deepseek-ai/schemastery'
import { createNbSearchRuntime, parseConfigPatch, type FetchChainConfig } from '@nb-corp/nb-search'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'

/** Join key for the host namespace and browser settings card. */
export const NB_SEARCH_NS = settingsNamespace('nb-search')

/** Empty optional strings inherit the SDK's config/environment resolution. */
export interface Config {
  configFile?: string
  defaultSearchLane?: string
  defaultFetchPipeline?: string
}

/** Live settings exposed through DSH's revision-fenced settings scope. */
export const Config: z<Config> = z.object({
  configFile: z.string().description('SDK config file path. Empty inherits SDK resolution.'),
  defaultSearchLane: z.string().description('Default search lane. Empty inherits SDK configuration.'),
  defaultFetchPipeline: z.string().description('Default fetch pipeline. Empty inherits SDK configuration.'),
})

/** Build a canonical SDK override; preserve non-URL chains when supplied. */
function runtimeOptions(value: Config, inheritedChains: readonly FetchChainConfig[] = []) {
  const lane = value.defaultSearchLane?.trim()
  const pipeline = value.defaultFetchPipeline?.trim()
  return {
    env: { ...process.env, ...(value.configFile?.trim() ? { NB_SEARCH_CONFIG: value.configFile.trim() } : {}) },
    overrides: parseConfigPatch({
      defaults: {
        ...(lane ? { search_lane: lane } : {}),
        ...(pipeline ? { fetch_chain: [
          ...inheritedChains.filter(chain => chain.input_kind !== 'url'),
          { input_kind: 'url', pipelines: [pipeline] },
        ] } : {}),
      },
    }, 'nb-search settings'),
  }
}

/** Refuse missing files and unresolved configured defaults before persistence. */
export function validateConfig(value: Config): void {
  createNbSearchRuntime(runtimeOptions(value))
}

/** Rebuild from the next call's settings while retaining SDK local-input chains. */
export async function createRuntime(value: Config) {
  if (!value.defaultFetchPipeline?.trim()) return createNbSearchRuntime(runtimeOptions(value))
  const inherited = createNbSearchRuntime(runtimeOptions({ ...value, defaultFetchPipeline: '' }))
  const capabilities = await inherited.capabilities()
  return createNbSearchRuntime(runtimeOptions(value, capabilities.fetch.chains))
}
