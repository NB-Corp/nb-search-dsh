// src/index.ts
import { installSettingsSection } from "@deepseek-ai/dsh-settings";
import { searchInputSchema, fetchInputSchema, fetchActionInputSchema, capabilitiesInputSchema } from "@nb-corp/nb-search";

// src/config.ts
import z from "@deepseek-ai/schemastery";
import { createNbSearchRuntime, parseConfigPatch } from "@nb-corp/nb-search";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
var NB_SEARCH_NS = settingsNamespace("nb-search");
var Config = z.object({
  configFile: z.string().description("SDK config file path. Empty inherits SDK resolution."),
  defaultSearchLane: z.string().description("Default search lane. Empty inherits SDK configuration."),
  defaultFetchPipeline: z.string().description("Default fetch pipeline. Empty inherits SDK configuration.")
});
function runtimeOptions(value, inheritedChains = []) {
  const lane = value.defaultSearchLane?.trim();
  const pipeline = value.defaultFetchPipeline?.trim();
  return {
    env: { ...process.env, ...value.configFile?.trim() ? { NB_SEARCH_CONFIG: value.configFile.trim() } : {} },
    overrides: parseConfigPatch({
      defaults: {
        ...lane ? { search_lane: lane } : {},
        ...pipeline ? { fetch_chain: [
          ...inheritedChains.filter((chain) => chain.input_kind !== "url"),
          { input_kind: "url", pipelines: [pipeline] }
        ] } : {}
      }
    }, "nb-search settings")
  };
}
function validateConfig(value) {
  createNbSearchRuntime(runtimeOptions(value));
}
async function createRuntime(value) {
  if (!value.defaultFetchPipeline?.trim()) return createNbSearchRuntime(runtimeOptions(value));
  const inherited = createNbSearchRuntime(runtimeOptions({ ...value, defaultFetchPipeline: "" }));
  const capabilities = await inherited.capabilities();
  return createNbSearchRuntime(runtimeOptions(value, capabilities.fetch.chains));
}

// src/output.ts
var envelopeSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    schema_version: { type: "string" },
    action: { type: "string" },
    mode: { type: "string" },
    execution: { type: "string" },
    status: { type: "string" },
    state: { type: "string" },
    job_id: { type: "string" },
    job: { type: "object", additionalProperties: true, properties: {
      job_id: { type: "string" },
      state: { type: "string" },
      created_at: { type: "string" }
    } },
    output: { type: "object", additionalProperties: true, properties: {
      channel: { type: "string" },
      schema_id: { type: "string" },
      status: { type: "string" },
      data: {},
      results: { type: "array", items: { type: "object", additionalProperties: true, properties: {
        title: { type: "string" },
        url: { type: "string" },
        snippet: { type: "string" }
      } } }
    } },
    documents: { type: "array", items: { type: "object", additionalProperties: true, properties: {
      content: { type: "string" },
      url: { type: "string" },
      final_url: { type: "string" },
      source_lane: { type: "string" },
      truncated: { type: "boolean" },
      warnings: { type: "array" }
    } } },
    error: { type: "object", additionalProperties: true, properties: {
      code: { type: "string" },
      message: { type: "string" },
      retryable: { type: "boolean" }
    } },
    hints: { type: "array" },
    selection: { type: "object", additionalProperties: true },
    chunks: { type: "array", items: { type: "object", additionalProperties: true, properties: {
      index: { type: "integer" },
      offset: { type: "integer" },
      byte_length: { type: "integer" },
      data_base64: { type: "string" }
    } } },
    artifact: { type: "object", additionalProperties: true },
    next_cursor: { type: "string" },
    poll_after_ms: { type: "number" },
    cancel_requested: { type: "boolean" },
    revision: { type: "string" },
    search: { type: "object", additionalProperties: true },
    fetch: { type: "object", additionalProperties: true },
    providers: { type: "object", additionalProperties: true },
    jobs: { type: "object", additionalProperties: true }
  }
};
function renderEnvelope(value) {
  return [{ type: "text", text: JSON.stringify(value, null, 2) }];
}

// src/index.ts
var name = "nb-search";
var inject = ["tools"];
function apply(ctx, entry) {
  let source = () => entry;
  let runtime;
  let runtimeConfig;
  const stopping = new AbortController();
  const pending = /* @__PURE__ */ new Set();
  installSettingsSection(ctx, NB_SEARCH_NS, Config, entry, {
    validate: (value) => {
      if (ctx.get("settings")?.get(NB_SEARCH_NS) !== void 0) validateConfig(value);
    },
    setSource: (current) => {
      source = current;
    },
    onChange: () => {
      runtime = void 0;
    }
  });
  ctx.effect(() => async () => {
    stopping.abort(new Error("nb-search plugin unloaded"));
    await Promise.allSettled([...pending]);
  });
  const definitions = [
    {
      name: "nb_search",
      description: "Search using NB Search. Supports batch queries, explicit lane/lanes/preset, freshness, sync/async jobs, and get/read/cancel. Call nb_search_capabilities for configured choices and modes. Async run requires idempotency_key; honor poll_after_ms, retain cursors and partial/error/hints, and cite result source URLs. No implicit search default exists unless configured.",
      parser: searchInputSchema,
      execute: async (args, signal) => (await getRuntime()).search(searchInputSchema.parse(args), { signal })
    },
    {
      name: "nb_fetch",
      description: "Retrieve URL or convert inline text/bytes or admitted local files through NB Search. Supports pipeline, representation, bounds and sync/async run/get/read/cancel. URL shorthand is allowed; use source for other inputs. Call nb_search_capabilities for supported modes. Async requires idempotency_key. Preserve source identity, partial/truncation warnings and cursors; authentication walls are not authenticated content.",
      parser: fetchInputSchema,
      execute: async (args, signal) => (await getRuntime()).fetch(fetchActionInputSchema.parse(fetchInputSchema.parse(args)), { signal })
    },
    {
      name: "nb_search_capabilities",
      description: "Inspect the current NB Search configuration: providers, lanes, presets, fetch pipelines, availability, execution modes, acquisition bounds and jobs. Local configuration inspection only; no provider health probe. Use before choosing a lane or pipeline.",
      parser: capabilitiesInputSchema,
      execute: async (args, signal) => (await getRuntime()).capabilities(capabilitiesInputSchema.parse(args), { signal })
    }
  ];
  function getRuntime() {
    const current = source();
    if (current !== runtimeConfig) {
      runtimeConfig = current;
      runtime = void 0;
    }
    if (runtime) return runtime;
    const candidate = createRuntime(current);
    runtime = candidate;
    void candidate.catch(() => {
      if (runtime === candidate) runtime = void 0;
    });
    return candidate;
  }
  for (const definition of definitions) {
    const { $schema: _schema, ...parameters } = definition.parser.toJSONSchema({ io: "input" });
    ctx.tools.register({
      name: definition.name,
      description: definition.description,
      parameters,
      output: { schema: envelopeSchema, render: (_args, value) => renderEnvelope(value) },
      execute(args, exec) {
        if (stopping.signal.aborted) throw stopping.signal.reason;
        const signal = AbortSignal.any([exec.signal, stopping.signal]);
        const work = definition.execute(args, signal).then((value) => JSON.parse(JSON.stringify(value)));
        pending.add(work);
        void work.then(() => pending.delete(work), () => pending.delete(work));
        return work;
      },
      presentCall: (args) => ({ card: "generic", title: definition.name, kind: "search", rawInput: args })
    });
  }
}
export {
  Config,
  apply,
  inject,
  name
};
