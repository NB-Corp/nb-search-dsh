import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
const tags = []
let registration
const document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {} }),
  head: { appendChild: tag => tags.push(tag) },
}
runInNewContext(source, { window: { __ModuleLoader__: { load: value => { registration = value } } }, document })
assert.equal(registration.id, 'nb-search-dsh')
assert.equal(typeof registration.factory, 'function')
assert.equal(tags.length, 0, 'CSS/module code stays lazy until factory execution')
let runtimeRegistration
runInNewContext(await readFile(require.resolve('@deepseek-ai/dsh-client-runtime/client'), 'utf8'), { window: { __ModuleLoader__: { load: value => { runtimeRegistration = value } } } })
const runtime = runtimeRegistration.factory(require)
const exports = registration.factory(specifier => specifier === '@deepseek-ai/dsh-client-runtime/client' ? runtime : require(specifier))
assert.equal(typeof exports.apply, 'function')
assert.deepEqual(Array.from(exports.inject), ['slots', 'locale', 'connection', 'remote', 'settingsScope'])
assert.equal(tags.length, 1)
assert.equal(tags[0].dataset.plugin, 'nb-search-dsh')
assert.match(tags[0].textContent, /--dsw-alias-/)
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
assert.equal(manifest.dsh.client.platform, 'web')
assert.equal(manifest.exports['./client'].default, './lib/client.js')
console.log('Host/client publication: lazy-CJS factory, public entry, and inlined CSS verified')
