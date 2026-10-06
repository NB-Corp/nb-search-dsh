import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { boot } from './composition.mjs'

test('real Code Mode worker receives complete 20000-character canonical SDK content', async () => {
  const root = resolve('.test-state/code-mode')
  await mkdir(root, { recursive: true })
  const configFile = resolve(root, 'sdk.json')
  await writeFile(configFile, JSON.stringify({ home: root, jobs_root: resolve(root, 'jobs') }))
  process.env.NB_SEARCH_CONFIG = configFile
  process.env.NB_SEARCH_HOME = root
  const { ctx, call } = await boot({ root, config: { configFile }, codeMode: true })
  try {
    assert.deepEqual(ctx.get('tools').sdkSchemas().map(s => s.name), ['nb_search', 'nb_fetch', 'nb_search_capabilities'])
    const output = await call('run_code', { description: 'Inspect complete NB fetch value', code: `
      const result = await tools.nb_fetch({action:'run',source:{kind:'inline_text',content:'x'.repeat(20000),media_type:'text/plain'},pipeline:'direct.local'});
      return {status:result.status,length:result.documents[0].content.length,source:result.documents[0].source_lane};
    ` })
    assert.equal(output.value.result.status, 'succeeded')
    assert.equal(output.value.result.length, 20000)
    assert.equal(output.value.result.source, 'direct.local')
  } finally { await ctx.fiber.dispose() }
})
