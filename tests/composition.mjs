import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Include from '@deepseek-ai/cordis-plugin-include'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export async function boot({ root, withSettings = true, config = {}, codeMode = false, extraEntries = [] }) {
  await mkdir(root, { recursive: true })
  const path = resolve(root, 'cordis.yml')
  await writeFile(path, [
    '- id: prompt', "  name: '@deepseek-ai/dsh-system-prompt'",
    '- id: tools', "  name: '@deepseek-ai/dsh-tools'",
    ...(codeMode ? ['  config: { mode: code }', '- id: code-runtime', "  name: '@deepseek-ai/dsh-code-runtime-worker-thread'"] : []),
    ...(withSettings ? ['- id: settings', "  name: '@deepseek-ai/dsh-settings-file'", '  config:', `    path: ${JSON.stringify(resolve(root, 'settings.json'))}`, '    watch: false'] : []),
    '- id: nb-search', `  name: ${JSON.stringify(pathToFileURL(resolve('lib/index.js')).href)}`,
    `  config: ${JSON.stringify(config)}`,
    ...extraEntries,
    '',
  ].join('\n'))
  const ctx = new Context()
  ctx.baseUrl = pathToFileURL(resolve('.')).href + '/'
  await ctx.plugin(Loader)
  ctx.loader.builtins.include = Include
  await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(path).href } })
  await ctx.loader.await()
  if (!ctx.get('tools')?.get('nb_search')) throw new Error('nb_search did not load')
  let id = 0
  return {
    ctx,
    async call(name, args = {}, signal = new AbortController().signal) {
      const result = await ctx.get('tools').execute({ callId: `test-${++id}`, name, arguments: args, signal })
      if (result.isError) throw new Error(JSON.stringify(result))
      return result
    },
  }
}
