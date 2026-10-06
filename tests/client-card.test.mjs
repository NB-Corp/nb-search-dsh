/**
 * Controller behaviour tests — the save/failure/recovery semantics of the
 * NB Search settings card, without a browser.
 *
 * The controller is TypeScript and normally reaches the browser through the
 * owner's client bundle; this test bundles it once with esbuild (the same
 * toolchain and the same CSS-module/runtime-alias configuration the render
 * harness uses) into a temporary ESM file and drives it against a scripted
 * settings scope + `settings.mutate` face. It asserts the exact wire request
 * the card sends and what it does with every answer — the browser driver in
 * `.tmp/render` proves the same logic through the rendered component.
 */

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '..')
let workDir
let controllerModule

// The runtime client entry is a loader module the page materializes through
// window.__ModuleLoader__; a plain Node bundle resolves it to this shim, which
// supplies the same snapshot-store contract the controller uses.
const runtimeShim = `
export function createSnapshotStore(initial) {
  let state = initial
  const listeners = new Set()
  return {
    getSnapshot: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    set(next) { state = next; for (const fn of [...listeners]) fn() },
    update(mutator) { const d = structuredClone(state); mutator(d); this.set(d) },
  }
}
`

before(async () => {
  workDir = await mkdtemp(resolve(tmpdir(), 'nb-search-card-'))
  await import('node:fs/promises').then(fs => fs.writeFile(resolve(workDir, 'runtime-shim.mjs'), runtimeShim))
  await build({
    entryPoints: [resolve(repo, 'src/client/nb-search-card-controller.ts')],
    outfile: resolve(workDir, 'controller.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    alias: { '@deepseek-ai/dsh-client-runtime/client': resolve(workDir, 'runtime-shim.mjs') },
    logLevel: 'silent',
  })
  controllerModule = await import(pathToFileURL(resolve(workDir, 'controller.mjs')).href)
})

after(async () => { if (workDir) await rm(workDir, { recursive: true, force: true }) })

// `before` populates controllerModule; tests read through this so the top-level
// module body does not destructure it before the bundle exists.
const mod = () => controllerModule

/** A scripted scope + settings face standing in for the bound scope and the
 * shared describe mirror, mirroring SettingsScopeController's derive/acceptView. */
function harness({ value, base, user, revision = 7, writable = true, mode = 'host' } = {}) {
  const { NB_SEARCH_NS } = mod()
  let snapshot = {
    status: 'ready', value: value ?? {}, base: base ?? {}, user: user ?? {},
    revision, writable, mode,
  }
  const listeners = new Set()
  const emit = () => { for (const fn of listeners) fn() }
  const scope = {
    getSnapshot: () => snapshot,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
  }
  const describe = {
    acceptView(view) {
      snapshot = { ...snapshot, value: view.value, base: view.base, user: view.user, revision: view.revision }
      emit()
    },
  }
  const requests = []
  const describeCalls = []
  let hostDocument = null
  let script = []
  const api = {
    settings: {
      async describe() {
        describeCalls.push(true)
        return hostDocument === null
          ? { rpcId: 'd', result: { ok: false, error: { code: 'internal', message: 'none', details: {} } } }
          : { rpcId: 'd', result: { ok: true, value: { writable, hasDocument: true, namespaces: [hostDocument] } } }
      },
      async mutate(request) {
        requests.push(request)
        const next = script.shift() || { kind: 'accept' }
        if (next.kind === 'accept') {
          const before = snapshot
          const v = { ...before.value }
          const u = { ...before.user }
          for (const op of request.ops) {
            const key = op.path[0]
            if (op.op === 'set') { v[key] = op.value; u[key] = op.value } else { delete v[key]; delete u[key] }
          }
          const view = { ns: request.ns, schema: {}, value: v, base: before.base, user: u, applies: 'live', secrets: [], revision: before.revision + 1 }
          hostDocument = view
          return { rpcId: 'r', result: { ok: true, value: view } }
        }
        if (next.kind === 'reject') return { rpcId: 'r', result: { ok: false, error: { code: 'settings-rejected', message: next.message, details: { ns: request.ns } } } }
        if (next.kind === 'conflict') return { rpcId: 'r', result: { ok: false, error: { code: 'settings-conflict', message: 'moved', details: { ns: request.ns, expected: request.expectedRevision, actual: next.actual } } } }
        throw new Error(next.message || 'transport')
      },
    },
  }
  hostDocument = { ns: NB_SEARCH_NS, schema: {}, value: snapshot.value, base: snapshot.base, user: snapshot.user, applies: 'live', secrets: [], revision }
  return {
    scope, describe, api, requests, describeCalls,
    script: (s) => { script = s.slice() },
    snapshot: () => snapshot,
    setStatus: (status) => { snapshot = { ...snapshot, status }; emit() },
    controller: () => { const { NbSearchCardController } = mod(); return new NbSearchCardController(scope, api, describe) },
    setHost: (patch) => { hostDocument = { ...hostDocument, ...patch } },
    // A deferred mutate lets a test act while the write is still in flight.
    deferNext: () => {
      let release
      let fail
      const gate = new Promise((resolve, reject) => { release = resolve; fail = reject })
      const real = api.settings.mutate
      api.settings.mutate = async (request) => { await gate; return real(request) }
      return { release: () => release(), fail: (error) => fail(error), restore: () => { api.settings.mutate = real } }
    },
  }
}

const state = (c) => c.inject().hooks.nbSearchCard.getSnapshot()

test('one save writes every changed field as a single revision-fenced mutate', async () => {
  const h = harness()
  const c = h.controller()
  const face = c.inject()
  face.edit('configFile', '/srv/config.json')
  face.edit('defaultSearchLane', 'exa.search')
  face.edit('defaultFetchPipeline', 'direct.fetch')
  assert.equal(state(c).dirty, true)
  face.save()
  await new Promise(r => setTimeout(r, 20))
  assert.equal(h.requests.length, 1)
  assert.equal(h.requests[0].ns, mod().NB_SEARCH_NS)
  assert.equal(h.requests[0].expectedRevision, 7)
  assert.deepEqual(h.requests[0].ops.map(op => op.path[0]), ['configFile', 'defaultSearchLane', 'defaultFetchPipeline'])
  assert.equal(state(c).outcome.kind, 'saved')
  assert.equal(state(c).dirty, false)
  assert.equal(h.snapshot().revision, 8, 'accepted answer folded back into the scope')
})

test('a save with no staged change sends nothing', async () => {
  const h = harness()
  const c = h.controller()
  c.inject().save()
  await new Promise(r => setTimeout(r, 20))
  assert.equal(h.requests.length, 0)
})

test('a staged draft equal to the stored value contributes no op', async () => {
  const h = harness({ value: { configFile: '/a.json' }, user: { configFile: '/a.json' } })
  const c = h.controller()
  c.inject().edit('configFile', '/a.json')
  assert.equal(state(c).dirty, false)
  c.inject().save()
  await new Promise(r => setTimeout(r, 20))
  assert.equal(h.requests.length, 0)
})

test('a refused save keeps the draft and reports the Host message', async () => {
  const h = harness()
  h.script([{ kind: 'reject', message: 'config file not found' }])
  const c = h.controller()
  c.inject().edit('configFile', '/nope.json')
  c.inject().save()
  await new Promise(r => setTimeout(r, 20))
  const s = state(c)
  assert.equal(s.dirty, true, 'draft survives')
  assert.equal(s.fields.configFile.text, '/nope.json')
  assert.equal(s.outcome.kind, 'rejected')
  assert.match(s.outcome.message, /not found/)
  assert.equal(h.snapshot().revision, 7, 'scope did not move')
})

test('a conflict keeps the draft and reports both revisions', async () => {
  const h = harness()
  h.script([{ kind: 'conflict', actual: 12 }])
  const c = h.controller()
  c.inject().edit('configFile', '/x.json')
  c.inject().save()
  await new Promise(r => setTimeout(r, 20))
  const s = state(c)
  assert.equal(s.dirty, true)
  assert.deepEqual(s.outcome, { kind: 'conflict', expected: 7, actual: 12 })
})

test('a transport throw is reported as a failure, not a silent success', async () => {
  const h = harness()
  h.script([{ kind: 'throw', message: 'connection reset' }])
  const c = h.controller()
  c.inject().edit('configFile', '/x.json')
  c.inject().save()
  await new Promise(r => setTimeout(r, 20))
  const s = state(c)
  assert.equal(s.outcome.kind, 'rejected')
  assert.match(s.outcome.message, /connection reset/)
  assert.equal(s.dirty, true)
})

test('blanking a field writes an unset so it re-inherits the composition layer', async () => {
  const h = harness({ value: { defaultFetchPipeline: 'direct.fetch' }, base: { defaultFetchPipeline: 'jina.reader' }, user: { defaultFetchPipeline: 'direct.fetch' } })
  const c = h.controller()
  c.inject().edit('defaultFetchPipeline', '')
  c.inject().save()
  await new Promise(r => setTimeout(r, 20))
  assert.deepEqual(h.requests[0].ops, [{ op: 'unset', path: ['defaultFetchPipeline'] }])
  const s = state(c)
  assert.equal(s.fields.defaultFetchPipeline.overridden, false)
  assert.equal(s.fields.defaultFetchPipeline.inherited, 'jina.reader')
})

test('reload re-reads the Host and drops the local draft after a conflict', async () => {
  const h = harness()
  const c = h.controller()
  h.script([{ kind: 'conflict', actual: 12 }])
  c.inject().edit('configFile', '/local.json')
  c.inject().save()
  await new Promise(r => setTimeout(r, 20))
  assert.equal(state(c).outcome.kind, 'conflict')
  h.setHost({ value: { configFile: '/host.json' }, user: { configFile: '/host.json' }, revision: 14 })
  c.inject().reload()
  await new Promise(r => setTimeout(r, 20))
  const s = state(c)
  assert.equal(s.dirty, false)
  assert.equal(s.fields.configFile.text, '/host.json')
  assert.equal(h.snapshot().revision, 14)
  assert.equal(s.outcome.kind, 'idle')
})

test('discard drops the draft and clears the status', async () => {
  const h = harness()
  h.script([{ kind: 'conflict', actual: 12 }])
  const c = h.controller()
  c.inject().edit('configFile', '/local.json')
  c.inject().save()
  await new Promise(r => setTimeout(r, 20))
  c.inject().discard()
  const s = state(c)
  assert.equal(s.dirty, false)
  assert.equal(s.outcome.kind, 'idle')
})

test('an unavailable namespace marks the card unavailable', () => {
  // A real non-loopback / memory-mode bind starts unavailable; the card
  // re-derives on the scope notification, exactly as the bound scope does.
  const h = harness()
  const c = h.controller()
  assert.equal(state(c).available, true)
  h.setStatus('unavailable')
  assert.equal(state(c).available, false, 'the card stops rendering once the namespace is not served')
  h.setStatus('ready')
  assert.equal(state(c).available, true)
})

test('dispose stops the controller reacting to the scope', async () => {
  const h = harness()
  const c = h.controller()
  c.dispose()
  // A fold after dispose must not throw and must not republish a stale draft.
  h.describe.acceptView({ ...h.snapshot(), value: {}, base: {}, user: {}, revision: 9 })
  assert.doesNotThrow(() => h.describe.acceptView(h.snapshot()))
})

// --- DU1: an in-flight save must not drop edits made while it crosses the wire

test('editing while a save is in flight is refused, so the save cannot drop it', async () => {
  const h = harness()
  const gate = h.deferNext()
  const c = h.controller()
  const face = c.inject()
  face.edit('configFile', '/first.json')
  face.save()
  await new Promise(r => setTimeout(r, 10))
  assert.equal(state(c).saving, true)
  face.edit('configFile', '/typed-during-save.json')
  face.edit('defaultSearchLane', 'exa.search')
  face.resetField('defaultFetchPipeline')
  face.discard()
  gate.release()
  await new Promise(r => setTimeout(r, 20))
  assert.equal(state(c).outcome.kind, 'saved')
  assert.equal(state(c).dirty, false)
  assert.deepEqual(h.requests.map(r => r.ops[0].value), ['/first.json'], 'only the pre-save draft was written')
})

test('dispose awaits the in-flight write and its answer changes nothing', async () => {
  const h = harness()
  const gate = h.deferNext()
  const c = h.controller()
  c.inject().edit('configFile', '/pending.json')
  c.inject().save()
  await new Promise(r => setTimeout(r, 10))
  let settled = false
  const disposal = c.dispose().then(() => { settled = true })
  await new Promise(r => setTimeout(r, 10))
  assert.equal(settled, false, 'dispose waits for the wire call it started')
  const revisionBefore = h.snapshot().revision
  gate.release()
  await disposal
  assert.equal(settled, true)
  await new Promise(r => setTimeout(r, 20))
  assert.equal(h.snapshot().revision, revisionBefore, 'a late answer does not fold into an unloaded card')
})

test('no action starts after dispose', async () => {
  const h = harness()
  const c = h.controller()
  const face = c.inject()
  await c.dispose()
  face.edit('configFile', '/after.json')
  face.save()
  face.reload()
  face.discard()
  await new Promise(r => setTimeout(r, 20))
  assert.equal(h.requests.length, 0, 'a stale action cannot reach the wire')
  assert.equal(h.describeCalls.length, 0)
})

// --- DU2: a conflict refreshes the fence so the next save succeeds

test('a conflict refreshes the revision, so the next save succeeds with the draft kept', async () => {
  const h = harness()
  const c = h.controller()
  const face = c.inject()
  // Another writer landed: the Host document already carries revision 12.
  h.setHost({
    value: { configFile: '/someone-else.json' },
    user: { configFile: '/someone-else.json' },
    revision: 12,
  })
  h.script([{ kind: 'conflict', actual: 12 }, { kind: 'accept' }])
  face.edit('configFile', '/mine.json')
  face.save()
  await new Promise(r => setTimeout(r, 30))
  assert.equal(state(c).outcome.kind, 'conflict')
  assert.equal(state(c).fields.configFile.text, '/mine.json', 'the draft survives the conflict')
  assert.equal(h.snapshot().revision, 12, 'the conflict refresh read the Host forward')
  assert.ok(h.describeCalls.length >= 1, 'the card read the Host to learn the new revision')

  // The user's next explicit save re-applies their draft, fenced at 12.
  face.save()
  await new Promise(r => setTimeout(r, 30))
  assert.equal(state(c).outcome.kind, 'saved', 'the retry was fenced at the revision the Host holds')
  assert.equal(h.requests.length, 2)
  assert.equal(h.requests[0].expectedRevision, 7, 'the first attempt carried the stale fence')
  assert.equal(h.requests[1].expectedRevision, 12, 'the retry carried the refreshed fence')
  assert.equal(state(c).dirty, false)
})