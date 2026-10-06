import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { boot } from '../tests/composition.mjs'

const root = resolve('.tmp/live-smoke')
await mkdir(root, { recursive: true })
const configFile = resolve(root, 'sdk.json')
await writeFile(configFile, JSON.stringify({ home: root, jobs_root: resolve(root, 'jobs') }))
process.env.NB_SEARCH_CONFIG = configFile
process.env.NB_SEARCH_HOME = root
const { ctx, call } = await boot({ root, config: { configFile } })
const results = {}
async function wait(job_id) {
  const deadline = Date.now() + 60000
  while (true) {
    const result = (await call('nb_search', { action: 'get', job_id })).value
    if (!['queued', 'running'].includes(result.state)) return result
    assert.ok(Date.now() < deadline)
    await setTimeout(result.poll_after_ms ?? 1000)
  }
}
try {
  const search = (await call('nb_search', { action: 'run', query: 'nodejs node', lane: 'github.repositories', max_results: 3 })).value
  assert.equal(search.status, 'succeeded', JSON.stringify(search))
  assert.ok(search.output.results.some(row => row.url === 'https://github.com/nodejs/node'))
  results.search = search
  const fetch = (await call('nb_fetch', { url: 'https://nodejs.org/en/about', pipeline: 'direct.fetch', max_content_chars: 12000 })).value
  assert.equal(fetch.status, 'succeeded', JSON.stringify(fetch))
  assert.equal(fetch.documents[0].url, 'https://nodejs.org/en/about')
  assert.equal(fetch.documents[0].final_url, 'https://nodejs.org/en/about')
  assert.match(fetch.documents[0].content, /event-driven JavaScript runtime/)
  results.fetch = fetch
  const async = (await call('nb_search', { action: 'run', query: 'nodejs node', lane: 'github.repositories', max_results: 1, execution: 'async', idempotency_key: 'github-smoke-' + Date.now() })).value
  assert.equal(async.status, 'queued')
  const get = await wait(async.job.job_id)
  assert.equal(get.state, 'succeeded', JSON.stringify(get))
  const read = (await call('nb_search', { action: 'read', job_id: async.job.job_id, page_size: 1 })).value
  const artifact = JSON.parse(Buffer.concat(read.chunks.map(c => Buffer.from(c.data_base64, 'base64'))).toString())
  assert.match(JSON.stringify(artifact), /https:\/\/github.com\/nodejs\/node/)
  results.async = { run: async, get, read, artifact }
  await writeFile(resolve(root, 'evidence.json'), JSON.stringify(results, null, 2))
  console.log(JSON.stringify({ search: search.output.results.map(r => ({ title: r.title, url: r.url })), fetch: { title: fetch.documents[0].title, url: fetch.documents[0].url, final_url: fetch.documents[0].final_url, excerpt: fetch.documents[0].content.match(/As an asynchronous[^\n]+/)[0] }, async: { job_id: async.job.job_id, state: get.state, bytes: get.artifact.byte_length }, evidence: resolve(root, 'evidence.json') }, null, 2))
} finally { await ctx.fiber.dispose() }
