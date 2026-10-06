# NB Search for DeepSeek Harness

Use the complete [NB Search SDK](https://github.com/NB-Corp/nb-search) from DSH: batch search, explicit lanes and presets, typed research responses, URL and local-content extraction, and durable asynchronous jobs. The plugin adds `nb_search`, `nb_fetch`, and `nb_search_capabilities`; it leaves DSH's official `web_search` and `web_fetch` unchanged.

Requires **Node.js 24.15.0 or newer**, **DSH 0.1.0-rc.8**, and the public npm dependency **@nb-corp/nb-search 0.4.0**. This plugin is distributed from GitHub, not the npm registry. Built host and browser artifacts ship in `lib/`.

## Install in a profile

Use your installed rc.8 DSH CLI. Choose an isolated profile when trying the plugin:

```sh
git clone https://github.com/NB-Corp/nb-search-dsh.git
cd nb-search-dsh
npm pack
dsh plugin --profile nb-search-demo add ./nb-search-dsh-0.1.0.tgz
dsh --profile nb-search-demo --dump-config
```

The packed package includes its `cordis.patch.yml`. DSH installs the bundle and mounts the `nb-search` entry through its normal profile composition. Do not copy official DSH packages into a profile or edit the DSH source tree. Use an application profile with the normal tools service to call the tools.

For browser settings, use the same `add` command with `--profile web` and start `dsh --profile web --no-open`. The official web profile supplies the module loader and plugin-settings services. Set `DSH_HOME` to a separate test directory for both commands if you want to try this without changing your usual web profile.

## Make a first request

Start with `nb_search_capabilities({})` to see configured lanes, presets, pipeline availability, execution modes, and acquisition limits. Capability availability is a configuration snapshot, not a live provider health check.

NB Search 0.4.0 has no implicit search default. This free request selects GitHub repository search explicitly:

```json
{"action":"run","query":"nodejs node","lane":"github.repositories","max_results":3}
```

Fetch a public page through the free direct pipeline:

```json
{"url":"https://nodejs.org/en/about","pipeline":"direct.fetch","max_content_chars":12000}
```

Send those inputs to `nb_search` and `nb_fetch` respectively. `nb_search` supports a string or batch query, `lane`/`lanes`/`preset`, freshness, time and output bounds. `nb_fetch` supports URL shorthand or explicit `source` (`url`, `inline_text`, `inline_bytes`, or an SDK-admitted `file`), representation, pipeline, and bounds. The public SDK parsers validate every call; incompatible selectors and unsupported modes return their real SDK errors.

For asynchronous work, send `execution: "async"` and a stable `idempotency_key`, retain `job.job_id`, and use `get`, `read`, or `cancel` on the same tool. Respect `poll_after_ms` and pass `next_cursor` back as `cursor` when reading further chunks. Artifact chunks carry `data_base64`; decode their bytes to read the SDK JSON artifact. In 0.4.0 `github.repositories` and `direct.local` support sync and async, while `direct.fetch` supports sync only.

```json
{"action":"run","query":"nodejs node","lane":"github.repositories","execution":"async","idempotency_key":"node-repositories-1"}
```

```json
{"action":"get","job_id":"<returned job id>"}
```

Code Mode exposes the same tools as `await tools.nb_search(args)` and `await tools.nb_fetch(args)`. Calls return the complete canonical SDK JSON, including typed data, sources, provenance, lane outcomes, partial/error status, cursors, and hints. Native rendering also includes the complete JSON. DSH's official output-cap/spill policy bounds model context and supplies a retained-file locator for oversized results; use that locator to recover the same result without repeating a paid request. A deployment without that policy receives the full SDK-bounded text. Cite actual result URLs and preserve SDK truncation/partial warnings.

## Configure defaults

The DSH settings namespace is `nb-search`. Its three live fields are:

| Field | Effect |
| --- | --- |
| `configFile` | Canonical SDK config file path, passed as `NB_SEARCH_CONFIG` for this plugin's runtime. |
| `defaultSearchLane` | Overrides `defaults.search_lane`; explicit call selectors still win. |
| `defaultFetchPipeline` | Replaces the URL default fetch chain with one pipeline; local-input chains remain inherited. |

Empty strings inherit SDK configuration and environment. Clearing a saved field re-inherits the DSH composition value. The next call uses the committed settings; existing calls and published background jobs retain their original configuration. Missing config files and unresolved defaults refuse a settings write before persistence. With a settings provider, DSH persists the namespace; without one, the plugin uses its Cordis entry configuration.

For a web host, the plugin card lives under **Settings → Plugin configuration**. It stages the three fields and saves them in one revision-fenced settings mutation. A stale revision refuses the write rather than overwriting another editor's changes. Failed writes keep the draft for recovery.

Keep provider endpoints, options, and credential references in the SDK's [canonical configuration/environment](https://github.com/NB-Corp/nb-search#configuration). The plugin does not create a separate credential store.

If a tool reports `CONFIGURATION_ERROR`, check the selected SDK file and its provider-instance fields. A canonical file used by 0.5 can be incompatible with 0.4.0. Preserve that file; create a separate compatible config (an empty `{}` enables built-in free lanes) and save its path as `configFile` in the settings card. The namespace remains available for this repair even when inherited SDK configuration is invalid, and a saved compatible path wins on reopening. Without web settings, supply `configFile` in the `nb-search` Cordis entry or set `NB_SEARCH_CONFIG` before starting DSH. Set `NB_SEARCH_HOME` to an isolated directory when testing so SDK job state also stays separate.

## Develop and verify

```sh
npm ci
npm run build
npm run typecheck
npm test
npm run smoke
```

`npm test` boots a test-only `cordis.yml` through the real Loader under plain Node and executes registered tools. It covers protocol validation and recovery, canonical output, detached local jobs, cancellation, atomic settings persistence/reopen, and teardown/reload. Paid provider HTTP responses are fixtures; the SDK engine is real. `npm run smoke` makes free real GitHub search and public Node.js-page fetch requests in isolated `.tmp` SDK state and saves source evidence there.

The browser build emits DSH's lazy CommonJS module factory, not an ESM file. `npm run build:host` is available when working only on the host. Keep `lib/` synchronized before publishing a Git revision because Git installations consume those committed artifacts.

## 中文速览

这是 DSH 插件，不是 Kiki 插件。使用 Node.js ≥24.15.0 和 DSH 0.1.0-rc.8；从 GitHub 克隆后 `npm pack`，再用 `dsh plugin --profile <独立配置名> add <tgz路径>` 安装。先调用 `nb_search_capabilities` 查可用 lane 和执行模式；免费搜索显式选择 `github.repositories`，免费网页读取选择 `direct.fetch`。三项设置为空时继承 SDK 配置；凭据继续由 SDK canonical config/environment 管理。

## License and acknowledgements

MIT. NB Search is a public MIT SDK dependency; this plugin does not copy its engine. DSH core and dsh-kiki (MIT) provide the plugin, tools, settings, and module-loader reference APIs. dsh-web-ui (Apache-2.0) and dsh-tui (MIT) are design references; no source from them is included.
