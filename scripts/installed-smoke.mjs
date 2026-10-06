import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeFile, readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const profile = resolve('.tmp/dsh-home/profiles/nb-search-demo')
const req = createRequire(resolve(profile, 'package.json'))
const { Context } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href)
const { default: Loader } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis-plugin-loader')).href)
const { default: Include, entryListSchema } = await import(pathToFileURL(req.resolve('@deepseek-ai/cordis-plugin-include')).href)
const { load, dump } = await import(pathToFileURL(req.resolve('js-yaml')).href)
const composed = load(await readFile(resolve('.tmp/installed-config.yml'), 'utf8'), { schema: entryListSchema })
const entries = composed.filter(row => ['system-prompt', 'tools', 'settings', 'nb-search'].includes(row.id))
assert.equal(entries.length, 4)
const root = resolve('.tmp/installed-sdk')
const sdkConfig = resolve('.tmp/sdk-config.json')
process.env.NB_SEARCH_CONFIG = sdkConfig
process.env.NB_SEARCH_HOME = root
entries.find(row => row.id === 'settings').config = { path: resolve('.tmp/installed-settings.json'), watch: false }
const configPath = resolve(profile, 'test-only.cordis.yml')
await writeFile(configPath, dump(entries))
const ctx = new Context()
ctx.baseUrl = pathToFileURL(profile).href + '/'
try {
  await ctx.plugin(Loader)
  ctx.loader.builtins.include = Include
  await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
  await ctx.loader.await()
  const tools = ctx.get('tools')
  const names = tools.schemas().map(schema => schema.name)
  assert.deepEqual(names.sort(), ['nb_fetch', 'nb_search', 'nb_search_capabilities'])
  const result = await tools.execute({ callId: 'installed-fetch', name: 'nb_fetch', arguments: { url: 'https://nodejs.org/en/about', pipeline: 'direct.fetch', max_content_chars: 12000 }, signal: new AbortController().signal })
  assert.equal(result.isError, false, JSON.stringify(result))
  assert.equal(result.value.status, 'succeeded')
  assert.equal(result.value.documents[0].url, 'https://nodejs.org/en/about')
  assert.match(result.value.documents[0].content, /event-driven JavaScript runtime/)
  await writeFile(resolve('.tmp/installed-evidence.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify({ profile, module: req.resolve('nb-search-dsh'), tools: names, source: result.value.documents[0].url, title: result.value.documents[0].title, settings: ctx.get('settings').describe().map(d => ({ ns: d.ns, applies: d.applies, value: d.value })) }, null, 2))
} finally { await ctx.fiber.dispose() }
