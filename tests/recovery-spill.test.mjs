import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { boot } from './composition.mjs'

const root = resolve('.test-state/recovery-spill')
await mkdir(root, { recursive: true })
const good = resolve(root, 'good.json')
const invalid = resolve(root, 'invalid.json')
await writeFile(good, '{}')
await writeFile(invalid, JSON.stringify({ provider_instances: { 'tavily.default': { unexpected: true } } }))
process.env.NB_SEARCH_HOME = root
process.env.NB_SEARCH_CONFIG = invalid

test('persisted compatible config overrides invalid inherited config before first SDK call', async () => {
  const folder = resolve(root, 'persisted')
  await mkdir(folder, { recursive: true })
  await writeFile(resolve(folder, 'settings.json'), JSON.stringify({ 'nb-search': { configFile: good } }))
  const { ctx, call } = await boot({ root: folder })
  try { assert.equal((await call('nb_search_capabilities')).value.schema_version, '3.0') }
  finally { await ctx.fiber.dispose() }
})

test('invalid inherited SDK config leaves namespace repairable through saved configFile', async () => {
  const folder = resolve(root, 'repair')
  await mkdir(folder, { recursive: true })
  await writeFile(resolve(folder, 'settings.json'), '{}')
  const { ctx, call } = await boot({ root: folder })
  try {
    const descriptor = ctx.get('settings').describe().find(d => d.ns === 'nb-search')
    assert.ok(descriptor)
    await assert.rejects(call('nb_search_capabilities'), /canonical configuration is invalid/)
    await ctx.get('settings').mutate('nb-search', [{ op: 'set', path: ['configFile'], value: good }], descriptor.revision)
    assert.equal((await call('nb_search_capabilities')).value.schema_version, '3.0')
  } finally { await ctx.fiber.dispose() }
})

test('official host spill keeps oversized Native sync result recoverable without another SDK call', async () => {
  process.env.NB_SEARCH_CONFIG = good
  const folder = resolve(root, 'spill')
  const { ctx } = await boot({ root: folder, config: { configFile: good }, extraEntries: [
    '- id: sessions', "  name: '@deepseek-ai/dsh-session'",
    '- id: agents', "  name: '@deepseek-ai/dsh-agent'",
    '- id: llm', "  name: '@deepseek-ai/dsh-llm'",
    '- id: agent-loop', "  name: '@deepseek-ai/dsh-agent-loop'", '  config: { agents: [] }',
    '- id: spill-store', "  name: '@deepseek-ai/dsh-spill-local'", `  config: { root: ${JSON.stringify(resolve(folder, 'spills'))} }`,
    '- id: spill-policy', "  name: '@deepseek-ai/dsh-spill-policy'", '  config: { maxInlineBytes: 1000 }',
  ] })
  try {
    const handle = await ctx.get('agents').create({ sessionId: 'nb-spill-recovery' })
    const body = 'full Native source ' + '字'.repeat(20000)
    const result = await ctx.get('tools').execute({ callId: 'spill-fetch', name: 'nb_fetch', arguments: { action: 'run', source: { kind: 'inline_text', content: body, media_type: 'text/plain' }, pipeline: 'direct.local' }, agent: handle.agent, signal: new AbortController().signal })
    assert.equal(result.isError, false, JSON.stringify(result))
    const text = result.content.map(b => b.text).join('')
    assert.ok(Buffer.byteLength(text) <= 1000)
    assert.match(text, /Full formatted result stored at:/)
    const locator = /stored at: (\S+?)\. Use read/.exec(text)[1]
    const restored = JSON.parse(await readFile(locator, 'utf8'))
    assert.deepEqual(restored, result.value)
    assert.equal(restored.documents[0].content, body)
    assert.ok(JSON.stringify(restored).length > 16000)
  } finally { await ctx.fiber.dispose() }
})
