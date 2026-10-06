import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { boot } from './composition.mjs'
import { renderEnvelope } from '../lib/types/output.js'

const root = resolve('.test-state/backend')
await mkdir(root, { recursive: true })
const configFile = resolve(root, 'sdk.json')
await writeFile(configFile, JSON.stringify({
  home: root, jobs_root: resolve(root, 'jobs'),
  provider_instances: { fixture: { provider_id: 'script', enabled: true, options: { module: resolve('tests/fixtures/catalog.mjs') } } },
  lanes: { 'fixture.search': { provider_instance_id: 'fixture', operation_id: 'search', latency: 'fast', cost: 'free' } },
  presets: { fixture: { lanes: ['fixture.search'] } },
}))
process.env.NB_SEARCH_CONFIG = configFile
process.env.NB_SEARCH_HOME = root

async function value(call, name, args) { return (await call(name, args)).value }
async function terminal(call, name, job_id) {
  const deadline = Date.now() + 20000
  while (true) {
    const result = await value(call, name, { action: 'get', job_id })
    if (!['queued', 'running'].includes(result.state)) return result
    assert.ok(Date.now() < deadline, 'async job settled before test deadline')
    await setTimeout(result.poll_after_ms ?? 1000)
  }
}

test('plain Node Loader: SDK protocols, canonical values, validation and recovery', async () => {
  const { ctx, call } = await boot({ root: resolve(root, 'protocols') })
  try {
    const caps = await value(call, 'nb_search_capabilities', {})
    assert.equal(caps.search.default_lane, undefined)
    assert.deepEqual(caps.fetch.pipelines.find(p => p.id === 'direct.fetch').execution_modes, ['sync'])
    assert.deepEqual(caps.fetch.pipelines.find(p => p.id === 'direct.local').execution_modes, ['sync', 'async'])
    const missing = await value(call, 'nb_search', { action: 'run', query: 'Node' })
    assert.equal(missing.error.code, 'DEFAULT_NOT_CONFIGURED')
    const invalid = await value(call, 'nb_search', { action: 'run', query: 'Node', lane: 'absent' })
    assert.equal(invalid.status, 'failed')
    assert.match(invalid.error.code, /LANE_/)
    await assert.rejects(call('nb_search', { action: 'run', query: ['a'], lane: 'fixture.search', lanes: ['fixture.search'] }), /INVALID_INPUT|Only one|mutually/i)
    const good = await value(call, 'nb_search', { action: 'run', query: ['alpha', 'beta'], preset: 'fixture', execution: 'sync', max_results: 2, freshness: 'pm' })
    assert.equal(good.status, 'succeeded')
    assert.equal(good.output.results.length, 2)
    assert.deepEqual(good.output.results.map(r => r.url).sort(), ['https://example.org/alpha', 'https://example.org/beta'])
    assert.equal(good.selection.source, 'preset')
    const fetched = await value(call, 'nb_fetch', { action: 'run', source: { kind: 'inline_text', content: 'NB fixture ' + '字'.repeat(20000), media_type: 'text/plain' }, pipeline: 'direct.local', max_content_chars: 30000 })
    assert.equal(fetched.status, 'succeeded')
    assert.ok(fetched.documents[0].content.length > 16000)
    assert.deepEqual(JSON.parse(renderEnvelope(fetched)[0].text), fetched)
    assert.ok(renderEnvelope(fetched)[0].text.length > 16000)
    const parsed = await value(call, 'nb_fetch', { url: 'https://example.org', pipeline: 'absent' })
    assert.equal(parsed.status, 'failed')
    const receipt = await value(call, 'nb_fetch', { action: 'run', source: { kind: 'inline_text', content: 'Detached local text source.', media_type: 'text/plain' }, pipeline: 'direct.local', execution: 'async', idempotency_key: 'local-' + Date.now() })
    assert.equal(receipt.status, 'queued')
    assert.equal((await terminal(call, 'nb_fetch', receipt.job.job_id)).state, 'succeeded')
    const artifact = await value(call, 'nb_fetch', { action: 'read', job_id: receipt.job.job_id, page_size: 1 })
    const json = JSON.parse(Buffer.concat(artifact.chunks.map(c => Buffer.from(c.data_base64, 'base64'))).toString())
    assert.match(JSON.stringify(json), /Detached local text source/)
    const cancel = await value(call, 'nb_fetch', { action: 'cancel', job_id: receipt.job.job_id })
    assert.equal(cancel.state, 'succeeded')
    const slow = await value(call, 'nb_search', { action: 'run', query: 'slow', lane: 'fixture.search', execution: 'async', idempotency_key: 'cancel-' + Date.now() })
    const cancelled = await value(call, 'nb_search', { action: 'cancel', job_id: slow.job.job_id })
    assert.equal(cancelled.cancel_requested, true)
    assert.equal((await terminal(call, 'nb_search', slow.job.job_id)).state, 'cancelled')
  } finally { await ctx.fiber.dispose() }
})

test('atomic settings mutation takes effect on next call, survives reopen, rejects stale/invalid save', async () => {
  const folder = resolve(root, 'settings')
  await mkdir(folder, { recursive: true })
  await writeFile(resolve(folder, 'settings.json'), '{}')
  let { ctx, call } = await boot({ root: folder })
  try {
    const settings = ctx.get('settings')
    const before = settings.describe().find(d => d.ns === 'nb-search')
    await settings.mutate('nb-search', [
      { op: 'set', path: ['configFile'], value: configFile },
      { op: 'set', path: ['defaultSearchLane'], value: 'fixture.search' },
      { op: 'set', path: ['defaultFetchPipeline'], value: 'direct.fetch' },
    ], before.revision)
    const next = await value(call, 'nb_search', { action: 'run', query: 'saved' })
    assert.equal(next.selection.source, 'default')
    assert.equal(next.output.results[0].url, 'https://example.org/saved')
    await assert.rejects(settings.mutate('nb-search', [{ op: 'set', path: ['defaultSearchLane'], value: 'fixture.search' }], before.revision), /changed since/)
    const revision = settings.describe().find(d => d.ns === 'nb-search').revision
    await assert.rejects(settings.mutate('nb-search', [{ op: 'set', path: ['defaultSearchLane'], value: 'not-configured' }], revision), /default lane is not configured/)
    assert.equal((await value(call, 'nb_search', { action: 'run', query: 'recovered' })).status, 'succeeded')
    const local = await value(call, 'nb_fetch', { action: 'run', source: { kind: 'inline_text', content: 'Local chain retained', media_type: 'text/plain' } })
    assert.equal(local.status, 'succeeded')
    assert.match(await readFile(resolve(folder, 'settings.json'), 'utf8'), /fixture.search/)
  } finally { await ctx.fiber.dispose() }
  ;({ ctx, call } = await boot({ root: folder }))
  try {
    assert.equal((await value(call, 'nb_search', { action: 'run', query: 'reopened' })).output.results[0].url, 'https://example.org/reopened')
    const entry = [...ctx.loader.entries()].find(e => e.options.id === 'nb-search')
    await entry.fiber.dispose()
    assert.equal(ctx.get('settings').describe().find(d => d.ns === 'nb-search'), undefined)
    await assert.rejects(async () => ctx.get('settings').mutate('nb-search', [], 0), /not registered/)
    await ctx.loader.update(entry.id, { disabled: false, config: {} })
    await ctx.loader.await()
    assert.equal(ctx.get('settings').describe().filter(d => d.ns === 'nb-search').length, 1)
    assert.equal((await value(call, 'nb_search', { action: 'run', query: 'after-settings-reload' })).status, 'succeeded')
  } finally { await ctx.fiber.dispose() }
})

test('entry config without settings; unload aborts synchronous work and removes tools; reload has no duplicates', async () => {
  const { ctx, call } = await boot({ root: resolve(root, 'lifecycle'), withSettings: false, config: { defaultSearchLane: 'fixture.search' } })
  try {
    assert.equal(ctx.get('settings'), undefined)
    assert.equal((await value(call, 'nb_search', { action: 'run', query: 'entry' })).status, 'succeeded')
    const entry = [...ctx.loader.entries()].find(e => e.options.id === 'nb-search')
    const slow = call('nb_search', { action: 'run', query: 'slow' })
    await setTimeout(50)
    const start = Date.now()
    await entry.fiber.dispose()
    const result = await slow
    assert.ok(result.value?.error?.code === 'CANCELLED' || result.value?.status === 'cancelled')
    assert.ok(Date.now() - start < 3000)
    assert.equal(ctx.get('tools').get('nb_search'), undefined)
    assert.equal(ctx.get('tools').get('nb_fetch'), undefined)
    await ctx.loader.update(entry.id, { disabled: false, config: { defaultSearchLane: 'fixture.search' } })
    await ctx.loader.await()
    assert.equal((await value(call, 'nb_search', { action: 'run', query: 'reload' })).status, 'succeeded')
    assert.equal(ctx.get('tools').schemas().filter(s => s.name === 'nb_search').length, 1)
  } finally { await ctx.fiber.dispose() }
})
