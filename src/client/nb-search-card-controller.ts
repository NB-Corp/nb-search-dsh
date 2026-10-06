/**
 * The NB Search card's staged form over the `nb-search` settings namespace.
 *
 * A card stages what the user types and writes it only when they save. Each
 * settings write is a durable, revision-fenced document mutation, so a control
 * that committed as it settled turned one edit into a write the user never
 * asked for and could not preview; staged text makes what is on screen exactly
 * what a save would store.
 *
 * The card does not use the bound scope's per-field `set`/`unset`: those settle
 * as `Promise<void>` and recover internally, so a caller cannot tell an accepted
 * write from a refused one, and a refusal would reload Host state and drop the
 * draft. This controller instead sends ONE batched `settings.mutate` carrying
 * the revision it read, and resolves the outcome from the response so a
 * rejection leaves the staged drafts on screen for the user to correct.
 *
 * A field shows its effective value — the user layer over the composition layer
 * over the schema default — and whether the user layer carries it. That
 * presence, not a value comparison, is what marks a field overridden.
 *
 * The scope is a pure read source here: `getSnapshot`/`subscribe` supply the
 * current view, and only the successful `acceptView` fold moves it forward.
 */

import type { SnapshotStore, SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type {
  IApiClient, SettingsNamespaceView, SettingsPathOpView,
} from '@deepseek-ai/dsh-client-connection/client'
// Type-only: the describe face's `acceptView` fold contract, published by the
// settings surface this card reaches through `ctx.settingsScope.describe()`.
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client'

/** Namespace this card edits. Spelled here rather than imported: a client
 * package must not depend on a Host package. */
export const NB_SEARCH_NS = 'nb-search'

/** Settings wire face the controller writes through. */
export type SettingsWriteFace = Pick<IApiClient, 'settings'>

/** The `settings.mutate` answer: a `RpcResponse` whose result discriminates
 * acceptance (`ok: true`, carrying the namespace's new view) from a Host-owned
 * refusal (`ok: false`, carrying the code, message, and details). */
export type SettingsMutateAnswer = Awaited<ReturnType<IApiClient['settings']['mutate']>>

/** The read side of the bound settings scope, and the write-answer fold. */
export interface NbSearchScope {
  getSnapshot(): SettingsScopeSnapshot<Record<string, unknown> | undefined>
  subscribe(listener: () => void): () => void
}

/** The three settings this card edits. Each optional string inherits the SDK's
 * own resolution when blank. */
export interface NbSearchSettings {
  configFile?: string
  defaultSearchLane?: string
  defaultFetchPipeline?: string
}

/** One field of the section, in display order. */
export type NbSearchField = keyof NbSearchSettings

/** The fields, in the order the card stacks them. */
export const NB_SEARCH_FIELDS: readonly NbSearchField[] = [
  'configFile',
  'defaultSearchLane',
  'defaultFetchPipeline',
]

/** The write one field's staged text performs when the card is saved. */
export type FieldWrite = { kind: 'set'; value: string } | { kind: 'clear' }

/** One field as the card's control renders it. */
export interface CardFieldState {
  /** Draft text the control renders. */
  text: string
  /** Effective inherited value when the field is not overridden. */
  inherited: string
  /**
   * Whether saving would leave a user-layer entry for this field. A staged
   * edit answers for itself, so the badge previews the save rather than
   * reporting a state the pending edit already contradicts.
   */
  overridden: boolean
}

/** What one save attempt last did; drives the card's status line. */
export type SaveOutcome =
  | { kind: 'idle' }
  | { kind: 'saved' }
  | { kind: 'rejected'; message: string }
  | { kind: 'conflict'; expected: number; actual: number }

/** Form state the card renders. */
export interface NbSearchCardState {
  /** False while the namespace is not served to this client; the card renders nothing. */
  available: boolean
  /** Whether the Host document accepts writes. */
  writable: boolean
  /** Whether the form holds edits a save would write. */
  dirty: boolean
  /** Whether a save is crossing the wire. */
  saving: boolean
  /** Whether a Host reload is crossing the wire. */
  reloading: boolean
  /** The last save attempt's outcome, for the card's status line. */
  outcome: SaveOutcome
  /** Per-field draft state, keyed by field name. */
  fields: Record<NbSearchField, CardFieldState>
}

/** The write actions the card's slot entry injects. */
export interface NbSearchCardActions {
  /** Stage draft text for one field. */
  edit: (field: NbSearchField, text: string) => void
  /** Stage a clear, so saving lets the field re-inherit the composition layer. */
  resetField: (field: NbSearchField) => void
  /** Write every staged edit as one atomic, revision-fenced batch. */
  save: () => void
  /** Drop every staged edit. */
  discard: () => void
  /**
   * Re-read the Host document and re-seed from it, dropping the staged draft.
   * This is the conflict recovery that shows what the other writer landed.
   */
  reload: () => void
}

/** The registration-side face the card's slot entry injects. */
export interface NbSearchCardFace extends NbSearchCardActions {
  hooks: {
    /** Card snapshot bound by the renderer as useNbSearchCard. */
    nbSearchCard: SnapshotStore<NbSearchCardState>
  }
}

/** One field's staged edit. */
interface StagedEdit {
  text: string
  clear: boolean
}

/** One staged edit resolved into the write a save performs. */
interface PlannedWrite {
  field: NbSearchField
  op: SettingsPathOpView
}

/**
 * Stages this card's edits over the `nb-search` scope and writes them as one
 * batched, revision-fenced `settings.mutate` on save.
 *
 * The form publishes through a snapshot store because the slot component reads
 * through a snapshot selector while both the scope and the local drafts change
 * underneath; every projection is rebuilt from the two together.
 */
export class NbSearchCardController {
  private readonly staged = new Map<NbSearchField, StagedEdit>()
  private readonly store: SnapshotStore<NbSearchCardState>
  private readonly unsubscribe: () => void
  private saving = false
  private reloading = false
  private outcome: SaveOutcome = { kind: 'idle' }
  private disposed = false
  /**
   * Settlements of the wire calls this controller started, so teardown waits
   * for the last one. A plugin unload must not leave a write crossing the wire
   * with nothing to receive its answer.
   */
  private inFlight = new Set<Promise<unknown>>()

  /**
   * @param scope - the bound settings scope for the `nb-search` namespace.
   * @param api - the settings wire face the save writes through.
   * @param describe - the shared describe face, the Host's canonical view this
   * card folds an accepted write answer back into.
   */
  constructor(
    private readonly scope: NbSearchScope,
    private readonly api: SettingsWriteFace,
    private readonly describe: Pick<SettingsDescribeFace, 'acceptView'>,
  ) {
    this.store = createSnapshotStore(this.projection())
    this.unsubscribe = scope.subscribe(() => { this.publish() })
  }

  /**
   * Stop the card: no further action starts, the scope subscription is dropped,
   * and the wire calls already in flight are awaited before this resolves.
   *
   * A late answer from a call that outlived the card is discarded rather than
   * folded: accepting it would publish into a mirror the unloading plugin no
   * longer owns.
   * @returns settlement after every started call has settled.
   */
  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    this.unsubscribe()
    await Promise.allSettled([...this.inFlight])
  }

  /** Whether a mutating action may start right now. */
  private get idle(): boolean {
    return !this.disposed && !this.saving && !this.reloading
  }

  /** Track one wire call for teardown, and drop its result once the card is gone. */
  private track<T>(work: Promise<T>): Promise<T | undefined> {
    const settled = work.then(
      value => { this.inFlight.delete(settled); return this.disposed ? undefined : value },
      error => { this.inFlight.delete(settled); throw error },
    )
    this.inFlight.add(settled)
    return settled
  }

  /**
   * Build the face the card's slot registration injects.
   * @returns the card's snapshot and its form actions.
   */
  inject(): NbSearchCardFace {
    return {
      hooks: { nbSearchCard: this.store },
      edit: (field, text) => {
        // Staging during a save would drop: the save clears the draft it read,
        // so an edit typed while it crosses the wire would vanish on success.
        if (!this.idle) return
        this.stage(field, { text, clear: false })
      },
      resetField: field => {
        if (!this.idle) return
        this.stage(field, { text: this.baseText(field), clear: true })
      },
      save: () => { void this.save() },
      discard: () => {
        if (!this.idle) return
        if (this.staged.size === 0 && this.outcome.kind === 'idle') return
        this.staged.clear()
        this.outcome = { kind: 'idle' }
        this.publish()
      },
      reload: () => { void this.reload() },
    }
  }

  private projection(): NbSearchCardState {
    const snapshot = this.scope.getSnapshot()
    const fields = {} as Record<NbSearchField, CardFieldState>
    for (const field of NB_SEARCH_FIELDS) fields[field] = this.fieldState(field)
    return {
      available: snapshot.status === 'ready',
      writable: snapshot.writable,
      dirty: this.plan().length > 0,
      saving: this.saving,
      reloading: this.reloading,
      outcome: this.outcome,
      fields,
    }
  }

  private fieldState(field: NbSearchField): CardFieldState {
    const staged = this.staged.get(field)
    const inherited = this.inheritedText(field)
    if (staged === undefined) {
      return { text: this.sectionText(field), inherited, overridden: this.stored(field) }
    }
    const write = staged.clear ? { kind: 'clear' as const } : parseText(staged.text)
    return {
      text: staged.text,
      inherited,
      overridden: write.kind === 'set',
    }
  }

  /**
   * Write every staged edit as one atomic, revision-fenced batch.
   *
   * The Host is the only authority on whether values were accepted — its
   * validators own constraints no schema can express — so the outcome is read
   * from the response. A save that did not land keeps its drafts, so the user
   * can correct them instead of retyping. A conflict (a stale `expectedRevision`
   * because another writer moved the namespace) also keeps the drafts and
   * reports both revisions, so the user can reload or re-apply.
   * @returns settlement after the batch write and the accept fold.
   */
  private async save(): Promise<void> {
    const plan = this.plan()
    if (plan.length === 0 || !this.idle) return
    this.saving = true
    this.outcome = { kind: 'idle' }
    this.publish()

    const expectedRevision = this.scope.getSnapshot().revision
    let answer: SettingsMutateAnswer | undefined
    try {
      answer = await this.track(this.api.settings.mutate({
        ns: NB_SEARCH_NS,
        ops: plan.map(item => item.op),
        ...(expectedRevision === undefined ? {} : { expectedRevision }),
      }))
    } catch (error) {
      // The carrier can still throw (a dropped socket, a non-loopback refusal).
      // That is a failed save, not a silent success: the drafts stay and the
      // message says why.
      this.saving = false
      if (this.disposed) return
      this.outcome = { kind: 'rejected', message: messageOf(error) }
      this.publish()
      return
    }
    this.saving = false
    // Undefined here is a call that outlived the card; its answer belongs to a
    // controller the unloading plugin no longer owns.
    if (answer === undefined || this.disposed) return

    const result = answer.result
    if (result.ok) {
      this.staged.clear()
      this.describe.acceptView(result.value)
      this.outcome = { kind: 'saved' }
      this.publish()
      return
    }
    if (result.error.code === 'settings-conflict') {
      this.outcome = {
        kind: 'conflict',
        expected: numberOr(result.error.details.expected, expectedRevision),
        actual: numberOr(result.error.details.actual, expectedRevision),
      }
      this.publish()
      // The fence is stale, so the card cannot send it again: leave the draft
      // in place and read the Host's current view, so the next explicit save
      // the user makes is fenced at the revision the Host actually holds.
      await this.refreshAfterConflict()
      return
    }
    this.outcome = { kind: 'rejected', message: result.error.message }
    this.publish()
  }

  /**
   * Read the Host's current view after a conflict, without touching the draft.
   *
   * A conflict proves the namespace moved past the revision this card fenced
   * with. Nothing else will move the card's scope — the settings surface
   * refreshes on a document event, and a conflict is not one — so without this
   * read every later save would be refused with the same stale fence. The draft
   * survives; only the fence moves, and the user's next explicit save is what
   * re-applies their edits.
   * @returns settlement after the read and the fold.
   */
  private async refreshAfterConflict(): Promise<void> {
    let answer: Awaited<ReturnType<IApiClient['settings']['describe']>> | undefined
    try {
      answer = await this.track(this.api.settings.describe({}))
    } catch {
      // The conflict message already stands; the read is a convenience.
      return
    }
    if (answer === undefined || this.disposed || !answer.result.ok) return
    const view = answer.result.value.namespaces.find(row => row.ns === NB_SEARCH_NS)
    if (view === undefined) return
    this.describe.acceptView(view)
    this.publish()
  }

  /**
   * Re-read the Host document and re-seed the card from it, dropping the draft.
   *
   * This is the conflict recovery that shows what the other writer actually
   * landed: a conflict proves the namespace moved, and the only way to learn its
   * current value is to read it. The read folds through the same describe face
   * a save answer folds through, so both paths leave the scope and the card on
   * one canonical view.
   * @returns settlement after the read and the fold.
   */
  private async reload(): Promise<void> {
    if (!this.idle) return
    this.reloading = true
    this.publish()
    let answer: Awaited<ReturnType<IApiClient['settings']['describe']>> | undefined
    try {
      answer = await this.track(this.api.settings.describe({}))
    } catch (error) {
      this.reloading = false
      if (this.disposed) return
      this.outcome = { kind: 'rejected', message: messageOf(error) }
      this.publish()
      return
    }
    this.reloading = false
    if (answer === undefined || this.disposed) return
    const result = answer.result
    const view = result.ok ? result.value.namespaces.find(row => row.ns === NB_SEARCH_NS) : undefined
    if (view === undefined) {
      this.outcome = {
        kind: 'rejected',
        message: result.ok
          ? `the Host no longer serves the ${NB_SEARCH_NS} settings`
          : result.error.message,
      }
      this.publish()
      return
    }
    this.staged.clear()
    this.describe.acceptView(view)
    this.outcome = { kind: 'idle' }
    this.publish()
  }

  /**
   * Every staged edit a save would write, in field order. A staged draft equal
   * to the stored value contributes nothing; a blank draft (or an explicit
   * reset) contributes an `unset`. Only genuinely changed fields appear, so an
   * untouched save is a no-op the controller refuses.
   * @returns the planned ops for the batch write.
   */
  private plan(): PlannedWrite[] {
    const plan: PlannedWrite[] = []
    for (const field of NB_SEARCH_FIELDS) {
      const staged = this.staged.get(field)
      if (staged === undefined) continue
      if (staged.clear) {
        if (this.stored(field)) plan.push({ field, op: { op: 'unset', path: [field] } })
        continue
      }
      const write = parseText(staged.text)
      if (write.kind === 'clear') {
        if (this.stored(field)) plan.push({ field, op: { op: 'unset', path: [field] } })
        continue
      }
      if (this.stored(field) && this.sectionText(field) === write.value) continue
      plan.push({ field, op: { op: 'set', path: [field], value: write.value } })
    }
    return plan
  }

  private stage(field: NbSearchField, edit: StagedEdit): void {
    this.staged.set(field, edit)
    if (this.outcome.kind !== 'saved') this.outcome = { kind: 'idle' }
    this.publish()
  }

  private section(): Record<string, unknown> | undefined {
    return this.scope.getSnapshot().value
  }

  /** The resolved value the section currently carries for a field. */
  private sectionText(field: NbSearchField): string {
    const value = this.section()?.[field]
    return typeof value === 'string' ? value : ''
  }

  /** The composition-layer value a cleared field falls back to. */
  private baseText(field: NbSearchField): string {
    const base = this.scope.getSnapshot().base
    if (typeof base !== 'object' || base === null || Array.isArray(base)) return ''
    const value = (base as Record<string, unknown>)[field]
    return typeof value === 'string' ? value : ''
  }

  /** The value a non-overridden field displays as its inherited default. */
  private inheritedText(field: NbSearchField): string {
    const effective = this.sectionText(field)
    if (effective !== '') return effective
    return this.baseText(field)
  }

  private userLayer(): Record<string, unknown> | undefined {
    const user = this.scope.getSnapshot().user
    if (typeof user !== 'object' || user === null || Array.isArray(user)) return undefined
    return user as Record<string, unknown>
  }

  /** Whether the user layer carries an entry for this field, by key presence. */
  private stored(field: NbSearchField): boolean {
    const user = this.userLayer()
    return user !== undefined && Object.hasOwn(user, field)
  }

  private publish(): void {
    if (this.disposed) return
    this.store.set(this.projection())
  }
}

/** Parse one field's draft text. A blank draft clears the field so emptying the
 * control and saving is the same gesture as resetting it; a non-blank draft is
 * stored verbatim after trimming. */
function parseText(text: string): FieldWrite {
  const trimmed = text.trim()
  return trimmed === '' ? { kind: 'clear' } : { kind: 'set', value: trimmed }
}

function numberOr(value: unknown, fallback: number | undefined): number {
  return typeof value === 'number' ? value : (fallback ?? 0)
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
