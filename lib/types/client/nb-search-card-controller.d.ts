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
import type { SnapshotStore, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
import type { IApiClient } from '@deepseek-ai/dsh-client-connection/client';
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client';
/** Namespace this card edits. Spelled here rather than imported: a client
 * package must not depend on a Host package. */
export declare const NB_SEARCH_NS = "nb-search";
/** Settings wire face the controller writes through. */
export type SettingsWriteFace = Pick<IApiClient, 'settings'>;
/** The `settings.mutate` answer: a `RpcResponse` whose result discriminates
 * acceptance (`ok: true`, carrying the namespace's new view) from a Host-owned
 * refusal (`ok: false`, carrying the code, message, and details). */
export type SettingsMutateAnswer = Awaited<ReturnType<IApiClient['settings']['mutate']>>;
/** The read side of the bound settings scope, and the write-answer fold. */
export interface NbSearchScope {
    getSnapshot(): SettingsScopeSnapshot<Record<string, unknown> | undefined>;
    subscribe(listener: () => void): () => void;
}
/** The three settings this card edits. Each optional string inherits the SDK's
 * own resolution when blank. */
export interface NbSearchSettings {
    configFile?: string;
    defaultSearchLane?: string;
    defaultFetchPipeline?: string;
}
/** One field of the section, in display order. */
export type NbSearchField = keyof NbSearchSettings;
/** The fields, in the order the card stacks them. */
export declare const NB_SEARCH_FIELDS: readonly NbSearchField[];
/** The write one field's staged text performs when the card is saved. */
export type FieldWrite = {
    kind: 'set';
    value: string;
} | {
    kind: 'clear';
};
/** One field as the card's control renders it. */
export interface CardFieldState {
    /** Draft text the control renders. */
    text: string;
    /** Effective inherited value when the field is not overridden. */
    inherited: string;
    /**
     * Whether saving would leave a user-layer entry for this field. A staged
     * edit answers for itself, so the badge previews the save rather than
     * reporting a state the pending edit already contradicts.
     */
    overridden: boolean;
}
/** What one save attempt last did; drives the card's status line. */
export type SaveOutcome = {
    kind: 'idle';
} | {
    kind: 'saved';
} | {
    kind: 'rejected';
    message: string;
} | {
    kind: 'conflict';
    expected: number;
    actual: number;
};
/** Form state the card renders. */
export interface NbSearchCardState {
    /** False while the namespace is not served to this client; the card renders nothing. */
    available: boolean;
    /** Whether the Host document accepts writes. */
    writable: boolean;
    /** Whether the form holds edits a save would write. */
    dirty: boolean;
    /** Whether a save is crossing the wire. */
    saving: boolean;
    /** Whether a Host reload is crossing the wire. */
    reloading: boolean;
    /** The last save attempt's outcome, for the card's status line. */
    outcome: SaveOutcome;
    /** Per-field draft state, keyed by field name. */
    fields: Record<NbSearchField, CardFieldState>;
}
/** The write actions the card's slot entry injects. */
export interface NbSearchCardActions {
    /** Stage draft text for one field. */
    edit: (field: NbSearchField, text: string) => void;
    /** Stage a clear, so saving lets the field re-inherit the composition layer. */
    resetField: (field: NbSearchField) => void;
    /** Write every staged edit as one atomic, revision-fenced batch. */
    save: () => void;
    /** Drop every staged edit. */
    discard: () => void;
    /**
     * Re-read the Host document and re-seed from it, dropping the staged draft.
     * This is the conflict recovery that shows what the other writer landed.
     */
    reload: () => void;
}
/** The registration-side face the card's slot entry injects. */
export interface NbSearchCardFace extends NbSearchCardActions {
    hooks: {
        /** Card snapshot bound by the renderer as useNbSearchCard. */
        nbSearchCard: SnapshotStore<NbSearchCardState>;
    };
}
/**
 * Stages this card's edits over the `nb-search` scope and writes them as one
 * batched, revision-fenced `settings.mutate` on save.
 *
 * The form publishes through a snapshot store because the slot component reads
 * through a snapshot selector while both the scope and the local drafts change
 * underneath; every projection is rebuilt from the two together.
 */
export declare class NbSearchCardController {
    private readonly scope;
    private readonly api;
    private readonly describe;
    private readonly staged;
    private readonly store;
    private readonly unsubscribe;
    private saving;
    private reloading;
    private outcome;
    private disposed;
    /**
     * Settlements of the wire calls this controller started, so teardown waits
     * for the last one. A plugin unload must not leave a write crossing the wire
     * with nothing to receive its answer.
     */
    private inFlight;
    /**
     * @param scope - the bound settings scope for the `nb-search` namespace.
     * @param api - the settings wire face the save writes through.
     * @param describe - the shared describe face, the Host's canonical view this
     * card folds an accepted write answer back into.
     */
    constructor(scope: NbSearchScope, api: SettingsWriteFace, describe: Pick<SettingsDescribeFace, 'acceptView'>);
    /**
     * Stop the card: no further action starts, the scope subscription is dropped,
     * and the wire calls already in flight are awaited before this resolves.
     *
     * A late answer from a call that outlived the card is discarded rather than
     * folded: accepting it would publish into a mirror the unloading plugin no
     * longer owns.
     * @returns settlement after every started call has settled.
     */
    dispose(): Promise<void>;
    /** Whether a mutating action may start right now. */
    private get idle();
    /** Track one wire call for teardown, and drop its result once the card is gone. */
    private track;
    /**
     * Build the face the card's slot registration injects.
     * @returns the card's snapshot and its form actions.
     */
    inject(): NbSearchCardFace;
    private projection;
    private fieldState;
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
    private save;
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
    private refreshAfterConflict;
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
    private reload;
    /**
     * Every staged edit a save would write, in field order. A staged draft equal
     * to the stored value contributes nothing; a blank draft (or an explicit
     * reset) contributes an `unset`. Only genuinely changed fields appear, so an
     * untouched save is a no-op the controller refuses.
     * @returns the planned ops for the batch write.
     */
    private plan;
    private stage;
    private section;
    /** The resolved value the section currently carries for a field. */
    private sectionText;
    /** The composition-layer value a cleared field falls back to. */
    private baseText;
    /** The value a non-overridden field displays as its inherited default. */
    private inheritedText;
    private userLayer;
    /** Whether the user layer carries an entry for this field, by key presence. */
    private stored;
    private publish;
}
