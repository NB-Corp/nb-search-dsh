import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { boot } from './composition.mjs'

test('paid HTTP fixture preserves typed schema/data/source URLs and partial lane failures', async () => {
  let seen = []
  const server = createServer(async (req, res) => {
    let input = ''
    for await (const chunk of req) input += chunk
    const body = JSON.parse(input)
    seen.push({ path: req.url, body })
    res.setHeader('content-type', 'application/json')
    if (req.url === '/failed') { res.statusCode = 503; res.end('{}'); return }
    res.end(JSON.stringify({
      output: { content: 'Fixture synthesis; not a paid live request.' }, resolvedSearchType: 'deep',
      results: [{ title: 'Fixture source', url: 'https://example.org/primary', text: 'Evidence fixture.' }],
    }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const root = resolve('.test-state/paid-fixture')
  await mkdir(root, { recursive: true })
  const configFile = resolve(root, 'sdk.json')
  process.env.NB_SEARCH_FIXTURE_KEY = 'non-secret-fixture'
  await writeFile(configFile, JSON.stringify({
    home: root, jobs_root: resolve(root, 'jobs'),
    credential_slots: { fixture: { provider_id: 'exa', env: 'NB_SEARCH_FIXTURE_KEY' } },
    provider_instances: {
      fixture: { provider_id: 'exa', enabled: true, credential_slot_id: 'fixture', base_url: `http://127.0.0.1:${server.address().port}`, options: { synthesis_path: '/synthesis', search_path: '/search' } },
      fail: { provider_id: 'exa', enabled: true, credential_slot_id: 'fixture', base_url: `http://127.0.0.1:${server.address().port}`, options: { search_path: '/failed' } },
    },
    lanes: {
      'fixture.typed': { provider_instance_id: 'fixture', operation_id: 'synthesis', latency: 'fast', cost: 'cheap' },
      'fixture.results': { provider_instance_id: 'fixture', operation_id: 'search', latency: 'fast', cost: 'cheap' },
      'fixture.failed': { provider_instance_id: 'fail', operation_id: 'search', latency: 'fast', cost: 'cheap' },
    },
    execution: { retry_count: 0 },
  }))
  process.env.NB_SEARCH_CONFIG = configFile
  process.env.NB_SEARCH_HOME = root
  let ctx
  try {
    const harness = await boot({ root: resolve(root, 'composition'), config: { configFile } })
    ctx = harness.ctx
    const typed = (await harness.call('nb_search', { action: 'run', query: 'typed', lane: 'fixture.typed', freshness: 'pw' })).value
    assert.equal(typed.status, 'succeeded')
    assert.equal(typed.output.channel, 'typed')
    assert.equal(typed.output.schema_id, 'nb-search.synthesis@1')
    assert.match(typed.output.data.text, /Fixture synthesis/)
    assert.deepEqual(typed.output.data.supporting_urls, [{ url: 'https://example.org/primary', title: 'Fixture source', source: 'provider-result' }])
    assert.equal(seen[0].body.type, 'deep')
    assert.ok(seen[0].body.startPublishedDate)
    const partial = (await harness.call('nb_search', { action: 'run', query: 'partial', lanes: ['fixture.results', 'fixture.failed'] })).value
    assert.equal(partial.status, 'partial')
    assert.equal(partial.output.results[0].url, 'https://example.org/primary')
    assert.equal(partial.output.lane_outcomes.find(o => o.lane === 'fixture.failed').error.code, 'PROVIDER_UNAVAILABLE')
  } finally {
    await ctx?.fiber.dispose()
    await new Promise(resolve => server.close(resolve))
    delete process.env.NB_SEARCH_FIXTURE_KEY
  }
})
