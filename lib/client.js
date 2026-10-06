window.__ModuleLoader__.load({ id: "nb-search-dsh", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/NbSearchCard.tsx
var import_react = __toESM(require("react"), 1);

// node_modules/clsx/dist/clsx.mjs
function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e) n += e;
  else if ("object" == typeof e) if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
  } else for (f in e) e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}
var clsx_default = clsx;

// src/client/NbSearchCard.module.css
var id = "nb-search-dsh/NbSearchCard.module.css";
if (typeof document !== "undefined" && !document.querySelector("style[data-plugin-css=" + JSON.stringify(id) + "]")) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "nb-search-dsh";
  tag.dataset.pluginCss = id;
  tag.textContent = ".zWtamG_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}.zWtamG_card:hover{border-color:var(--dsw-alias-label-dimmed)}.zWtamG_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.zWtamG_header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.zWtamG_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.zWtamG_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.zWtamG_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.zWtamG_description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.zWtamG_chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s;display:flex}.zWtamG_chevronOpen{transform:rotate(180deg)}.zWtamG_pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.zWtamG_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}.zWtamG_readOnly{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}.zWtamG_fields{margin:0;padding:0;list-style:none}.zWtamG_field{flex-direction:column;gap:6px;padding:14px 0;display:flex}.zWtamG_field+.zWtamG_field{border-top:1px solid var(--dsw-alias-border-l2)}.zWtamG_fieldHead{align-items:center;gap:8px;display:flex}.zWtamG_label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}.zWtamG_badges{align-items:center;gap:8px;display:inline-flex}.zWtamG_badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.zWtamG_reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}.zWtamG_reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}.zWtamG_reset:disabled{cursor:default;color:var(--dsw-alias-label-tertiary)}.zWtamG_input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}.zWtamG_input::placeholder{color:var(--dsw-alias-label-dimmed)}.zWtamG_input:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed)}.zWtamG_input:focus-visible{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px var(--dsw-alias-interactive-bg-hover-accent);outline:none}.zWtamG_input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default;background:var(--dsw-alias-bg-layer-2)}.zWtamG_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}.zWtamG_inherit{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-secondary)}.zWtamG_footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}.zWtamG_status{min-width:0;color:var(--dsw-alias-label-tertiary);flex:1;margin:0;font-size:12px;line-height:1.5}.zWtamG_statusError{color:var(--dsw-alias-state-error-primary)}.zWtamG_statusConflict{color:var(--dsw-alias-state-warn-label)}.zWtamG_discard,.zWtamG_reload,.zWtamG_save{appearance:none;font:inherit;cursor:pointer;white-space:nowrap;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}.zWtamG_discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}.zWtamG_discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.zWtamG_reload{border-color:var(--dsw-alias-state-warn-secondary);color:var(--dsw-alias-state-warn-label);background:0 0}.zWtamG_reload:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-accent);border-color:var(--dsw-alias-state-warn-primary)}.zWtamG_save{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}.zWtamG_save:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.zWtamG_discard:disabled,.zWtamG_reload:disabled,.zWtamG_save:disabled{opacity:.4;cursor:default}.zWtamG_discard:focus-visible,.zWtamG_reload:focus-visible,.zWtamG_save:focus-visible,.zWtamG_reset:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}@media (prefers-reduced-motion:reduce){.zWtamG_card,.zWtamG_chevron{transition:none}}";
  document.head.appendChild(tag);
}
var NbSearchCard_default = { "badges": "zWtamG_badges", "badge": "zWtamG_badge", "label": "zWtamG_label", "statusError": "zWtamG_statusError", "cardOpen": "zWtamG_cardOpen", "body": "zWtamG_body", "chevron": "zWtamG_chevron", "input": "zWtamG_input", "inherit": "zWtamG_inherit", "statusConflict": "zWtamG_statusConflict", "footer": "zWtamG_footer", "discard": "zWtamG_discard", "save": "zWtamG_save", "chevronOpen": "zWtamG_chevronOpen", "header": "zWtamG_header", "pending": "zWtamG_pending", "hint": "zWtamG_hint", "reload": "zWtamG_reload", "reset": "zWtamG_reset", "headText": "zWtamG_headText", "description": "zWtamG_description", "readOnly": "zWtamG_readOnly", "fields": "zWtamG_fields", "field": "zWtamG_field", "fieldHead": "zWtamG_fieldHead", "status": "zWtamG_status", "card": "zWtamG_card", "name": "zWtamG_name" };

// src/client/NbSearchCard.tsx
var FIELDS = [
  { field: "configFile", labelKey: "configFile", hintKey: "configFileHint", placeholderKey: "configFileExample" },
  { field: "defaultSearchLane", labelKey: "defaultSearchLane", hintKey: "defaultSearchLaneHint", placeholderKey: "defaultSearchLaneExample" },
  { field: "defaultFetchPipeline", labelKey: "defaultFetchPipeline", hintKey: "defaultFetchPipelineHint", placeholderKey: "defaultFetchPipelineExample" }
];
function NbSearchCard(props) {
  const { t } = props;
  const state = props.useNbSearchCard((snapshot) => snapshot);
  const [open, setOpen] = (0, import_react.useState)(false);
  if (!state.available) return null;
  const busy = state.saving || state.reloading;
  const disabled = !state.writable || busy;
  const blocked = !state.dirty || busy || !state.writable;
  const title = t("title");
  return /* @__PURE__ */ import_react.default.createElement("li", { className: clsx_default(NbSearchCard_default.card, open && NbSearchCard_default.cardOpen) }, /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      type: "button",
      className: NbSearchCard_default.header,
      "aria-expanded": open,
      "aria-label": `${t(open ? "collapse" : "expand")}: ${title}`,
      onClick: () => {
        setOpen(!open);
      }
    },
    /* @__PURE__ */ import_react.default.createElement("span", { className: NbSearchCard_default.headText }, /* @__PURE__ */ import_react.default.createElement("span", { className: NbSearchCard_default.name }, title), /* @__PURE__ */ import_react.default.createElement("span", { className: NbSearchCard_default.description }, t("description"))),
    state.dirty ? /* @__PURE__ */ import_react.default.createElement("span", { className: NbSearchCard_default.pending }, t("unsaved")) : null,
    /* @__PURE__ */ import_react.default.createElement("span", { className: clsx_default(NbSearchCard_default.chevron, open && NbSearchCard_default.chevronOpen), "aria-hidden": "true" }, /* @__PURE__ */ import_react.default.createElement("svg", { viewBox: "0 0 14 14", width: "14", height: "14", focusable: "false" }, /* @__PURE__ */ import_react.default.createElement(
      "path",
      {
        d: "M3.5 5.5 7 9l3.5-3.5",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )))
  ), open ? /* @__PURE__ */ import_react.default.createElement("div", { className: NbSearchCard_default.body }, !state.writable ? /* @__PURE__ */ import_react.default.createElement("p", { className: NbSearchCard_default.readOnly, role: "status" }, t("readOnly")) : null, /* @__PURE__ */ import_react.default.createElement("ul", { className: NbSearchCard_default.fields }, FIELDS.map(({ field, labelKey, hintKey, placeholderKey }) => {
    const control = state.fields[field];
    const inputId = `nb-search-${field}`;
    return /* @__PURE__ */ import_react.default.createElement("li", { className: NbSearchCard_default.field, key: field }, /* @__PURE__ */ import_react.default.createElement("div", { className: NbSearchCard_default.fieldHead }, /* @__PURE__ */ import_react.default.createElement("label", { className: NbSearchCard_default.label, htmlFor: inputId }, t(labelKey)), control.overridden ? /* @__PURE__ */ import_react.default.createElement("span", { className: NbSearchCard_default.badges }, /* @__PURE__ */ import_react.default.createElement("span", { className: NbSearchCard_default.badge }, t("overridden")), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        type: "button",
        className: NbSearchCard_default.reset,
        disabled,
        onClick: () => {
          props.resetField(field);
        }
      },
      t("reset")
    )) : null), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        id: inputId,
        className: NbSearchCard_default.input,
        type: "text",
        autoComplete: "off",
        spellCheck: false,
        value: control.text,
        placeholder: t(placeholderKey),
        disabled,
        onChange: (event) => {
          props.edit(field, event.target.value);
        }
      }
    ), /* @__PURE__ */ import_react.default.createElement("p", { className: NbSearchCard_default.hint }, t(hintKey), control.inherited !== "" && !control.overridden ? /* @__PURE__ */ import_react.default.createElement("span", { className: NbSearchCard_default.inherit }, " \xB7 ", t("inherits", { value: control.inherited })) : null));
  })), /* @__PURE__ */ import_react.default.createElement("div", { className: NbSearchCard_default.footer }, /* @__PURE__ */ import_react.default.createElement("p", { className: statusClass(state), role: "status" }, statusText(t, state)), state.outcome.kind === "conflict" ? /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      type: "button",
      className: NbSearchCard_default.reload,
      disabled: busy,
      onClick: props.reload
    },
    t(state.reloading ? "reloading" : "reload")
  ) : null, /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      type: "button",
      className: NbSearchCard_default.discard,
      disabled: !state.dirty || busy,
      onClick: props.discard
    },
    t("discard")
  ), /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      type: "button",
      className: NbSearchCard_default.save,
      disabled: blocked,
      onClick: props.save
    },
    t(state.saving ? "saving" : "save")
  ))) : null);
}
function statusClass(state) {
  if (state.outcome.kind === "rejected") return clsx_default(NbSearchCard_default.status, NbSearchCard_default.statusError);
  if (state.outcome.kind === "conflict") return clsx_default(NbSearchCard_default.status, NbSearchCard_default.statusConflict);
  return clsx_default(NbSearchCard_default.status, NbSearchCard_default.statusIdle);
}
function statusText(t, state) {
  switch (state.outcome.kind) {
    case "saved":
      return t("saved");
    case "rejected":
      return `${t("saveRejected")}${state.outcome.message}`;
    case "conflict":
      return t("saveConflict", {
        expected: String(state.outcome.expected),
        actual: String(state.outcome.actual)
      });
    default:
      return void 0;
  }
}

// src/client/nb-search-card-controller.ts
var import_client = require("@deepseek-ai/dsh-client-runtime/client");
var NB_SEARCH_NS = "nb-search";
var NB_SEARCH_FIELDS = [
  "configFile",
  "defaultSearchLane",
  "defaultFetchPipeline"
];
var NbSearchCardController = class {
  /**
   * @param scope - the bound settings scope for the `nb-search` namespace.
   * @param api - the settings wire face the save writes through.
   * @param describe - the shared describe face, the Host's canonical view this
   * card folds an accepted write answer back into.
   */
  constructor(scope, api, describe) {
    this.scope = scope;
    this.api = api;
    this.describe = describe;
    this.store = (0, import_client.createSnapshotStore)(this.projection());
    this.unsubscribe = scope.subscribe(() => {
      this.publish();
    });
  }
  staged = /* @__PURE__ */ new Map();
  store;
  unsubscribe;
  saving = false;
  reloading = false;
  outcome = { kind: "idle" };
  disposed = false;
  /**
   * Settlements of the wire calls this controller started, so teardown waits
   * for the last one. A plugin unload must not leave a write crossing the wire
   * with nothing to receive its answer.
   */
  inFlight = /* @__PURE__ */ new Set();
  /**
   * Stop the card: no further action starts, the scope subscription is dropped,
   * and the wire calls already in flight are awaited before this resolves.
   *
   * A late answer from a call that outlived the card is discarded rather than
   * folded: accepting it would publish into a mirror the unloading plugin no
   * longer owns.
   * @returns settlement after every started call has settled.
   */
  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe();
    await Promise.allSettled([...this.inFlight]);
  }
  /** Whether a mutating action may start right now. */
  get idle() {
    return !this.disposed && !this.saving && !this.reloading;
  }
  /** Track one wire call for teardown, and drop its result once the card is gone. */
  track(work) {
    const settled = work.then(
      (value) => {
        this.inFlight.delete(settled);
        return this.disposed ? void 0 : value;
      },
      (error) => {
        this.inFlight.delete(settled);
        throw error;
      }
    );
    this.inFlight.add(settled);
    return settled;
  }
  /**
   * Build the face the card's slot registration injects.
   * @returns the card's snapshot and its form actions.
   */
  inject() {
    return {
      hooks: { nbSearchCard: this.store },
      edit: (field, text) => {
        if (!this.idle) return;
        this.stage(field, { text, clear: false });
      },
      resetField: (field) => {
        if (!this.idle) return;
        this.stage(field, { text: this.baseText(field), clear: true });
      },
      save: () => {
        void this.save();
      },
      discard: () => {
        if (!this.idle) return;
        if (this.staged.size === 0 && this.outcome.kind === "idle") return;
        this.staged.clear();
        this.outcome = { kind: "idle" };
        this.publish();
      },
      reload: () => {
        void this.reload();
      }
    };
  }
  projection() {
    const snapshot = this.scope.getSnapshot();
    const fields = {};
    for (const field of NB_SEARCH_FIELDS) fields[field] = this.fieldState(field);
    return {
      available: snapshot.status === "ready",
      writable: snapshot.writable,
      dirty: this.plan().length > 0,
      saving: this.saving,
      reloading: this.reloading,
      outcome: this.outcome,
      fields
    };
  }
  fieldState(field) {
    const staged = this.staged.get(field);
    const inherited = this.inheritedText(field);
    if (staged === void 0) {
      return { text: this.sectionText(field), inherited, overridden: this.stored(field) };
    }
    const write = staged.clear ? { kind: "clear" } : parseText(staged.text);
    return {
      text: staged.text,
      inherited,
      overridden: write.kind === "set"
    };
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
  async save() {
    const plan = this.plan();
    if (plan.length === 0 || !this.idle) return;
    this.saving = true;
    this.outcome = { kind: "idle" };
    this.publish();
    const expectedRevision = this.scope.getSnapshot().revision;
    let answer;
    try {
      answer = await this.track(this.api.settings.mutate({
        ns: NB_SEARCH_NS,
        ops: plan.map((item) => item.op),
        ...expectedRevision === void 0 ? {} : { expectedRevision }
      }));
    } catch (error) {
      this.saving = false;
      if (this.disposed) return;
      this.outcome = { kind: "rejected", message: messageOf(error) };
      this.publish();
      return;
    }
    this.saving = false;
    if (answer === void 0 || this.disposed) return;
    const result = answer.result;
    if (result.ok) {
      this.staged.clear();
      this.describe.acceptView(result.value);
      this.outcome = { kind: "saved" };
      this.publish();
      return;
    }
    if (result.error.code === "settings-conflict") {
      this.outcome = {
        kind: "conflict",
        expected: numberOr(result.error.details.expected, expectedRevision),
        actual: numberOr(result.error.details.actual, expectedRevision)
      };
      this.publish();
      await this.refreshAfterConflict();
      return;
    }
    this.outcome = { kind: "rejected", message: result.error.message };
    this.publish();
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
  async refreshAfterConflict() {
    let answer;
    try {
      answer = await this.track(this.api.settings.describe({}));
    } catch {
      return;
    }
    if (answer === void 0 || this.disposed || !answer.result.ok) return;
    const view = answer.result.value.namespaces.find((row) => row.ns === NB_SEARCH_NS);
    if (view === void 0) return;
    this.describe.acceptView(view);
    this.publish();
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
  async reload() {
    if (!this.idle) return;
    this.reloading = true;
    this.publish();
    let answer;
    try {
      answer = await this.track(this.api.settings.describe({}));
    } catch (error) {
      this.reloading = false;
      if (this.disposed) return;
      this.outcome = { kind: "rejected", message: messageOf(error) };
      this.publish();
      return;
    }
    this.reloading = false;
    if (answer === void 0 || this.disposed) return;
    const result = answer.result;
    const view = result.ok ? result.value.namespaces.find((row) => row.ns === NB_SEARCH_NS) : void 0;
    if (view === void 0) {
      this.outcome = {
        kind: "rejected",
        message: result.ok ? `the Host no longer serves the ${NB_SEARCH_NS} settings` : result.error.message
      };
      this.publish();
      return;
    }
    this.staged.clear();
    this.describe.acceptView(view);
    this.outcome = { kind: "idle" };
    this.publish();
  }
  /**
   * Every staged edit a save would write, in field order. A staged draft equal
   * to the stored value contributes nothing; a blank draft (or an explicit
   * reset) contributes an `unset`. Only genuinely changed fields appear, so an
   * untouched save is a no-op the controller refuses.
   * @returns the planned ops for the batch write.
   */
  plan() {
    const plan = [];
    for (const field of NB_SEARCH_FIELDS) {
      const staged = this.staged.get(field);
      if (staged === void 0) continue;
      if (staged.clear) {
        if (this.stored(field)) plan.push({ field, op: { op: "unset", path: [field] } });
        continue;
      }
      const write = parseText(staged.text);
      if (write.kind === "clear") {
        if (this.stored(field)) plan.push({ field, op: { op: "unset", path: [field] } });
        continue;
      }
      if (this.stored(field) && this.sectionText(field) === write.value) continue;
      plan.push({ field, op: { op: "set", path: [field], value: write.value } });
    }
    return plan;
  }
  stage(field, edit) {
    this.staged.set(field, edit);
    if (this.outcome.kind !== "saved") this.outcome = { kind: "idle" };
    this.publish();
  }
  section() {
    return this.scope.getSnapshot().value;
  }
  /** The resolved value the section currently carries for a field. */
  sectionText(field) {
    const value = this.section()?.[field];
    return typeof value === "string" ? value : "";
  }
  /** The composition-layer value a cleared field falls back to. */
  baseText(field) {
    const base = this.scope.getSnapshot().base;
    if (typeof base !== "object" || base === null || Array.isArray(base)) return "";
    const value = base[field];
    return typeof value === "string" ? value : "";
  }
  /** The value a non-overridden field displays as its inherited default. */
  inheritedText(field) {
    const effective = this.sectionText(field);
    if (effective !== "") return effective;
    return this.baseText(field);
  }
  userLayer() {
    const user = this.scope.getSnapshot().user;
    if (typeof user !== "object" || user === null || Array.isArray(user)) return void 0;
    return user;
  }
  /** Whether the user layer carries an entry for this field, by key presence. */
  stored(field) {
    const user = this.userLayer();
    return user !== void 0 && Object.hasOwn(user, field);
  }
  publish() {
    if (this.disposed) return;
    this.store.set(this.projection());
  }
};
function parseText(text) {
  const trimmed = text.trim();
  return trimmed === "" ? { kind: "clear" } : { kind: "set", value: trimmed };
}
function numberOr(value, fallback) {
  return typeof value === "number" ? value : fallback ?? 0;
}
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/client/locales.ts
var zh = {
  title: "NB Search",
  description: "\u51B3\u5B9A SDK \u4ECE\u54EA\u91CC\u8BFB\u53D6\u914D\u7F6E\uFF0C\u4EE5\u53CA\u9ED8\u8BA4\u7684\u68C0\u7D22\u901A\u9053\u4E0E URL \u8BFB\u53D6\u6D41\u6C34\u7EBF\u3002\u7559\u7A7A\u5373\u6CBF\u7528 SDK \u81EA\u8EAB\u3002",
  expand: "\u5C55\u5F00\u8BBE\u7F6E",
  collapse: "\u6536\u8D77\u8BBE\u7F6E",
  configFile: "SDK \u914D\u7F6E\u6587\u4EF6\u8DEF\u5F84",
  configFileHint: "\u8BFB\u53D6\u914D\u7F6E\u7684 JSON \u6587\u4EF6\u8DEF\u5F84\uFF0C\u4F7F\u7528\u5B8C\u6574\u8DEF\u5F84\u3002\u7559\u7A7A\u5219\u6CBF\u7528 SDK \u7684\u9ED8\u8BA4\u89E3\u6790\u3002",
  configFileExample: "\u4F8B\u5982 C:/Users/you/nb-search/config.json",
  defaultSearchLane: "\u9ED8\u8BA4\u641C\u7D22\u901A\u9053",
  defaultSearchLaneHint: "nb_search \u672A\u6307\u5B9A\u901A\u9053\u65F6\u4F7F\u7528\u7684 lane\u3002\u7559\u7A7A\u5219\u6CBF\u7528 SDK \u914D\u7F6E\uFF1B\u65E0\u9ED8\u8BA4\u901A\u9053\u65F6\u5FC5\u987B\u663E\u5F0F\u6307\u5B9A\u3002",
  defaultSearchLaneExample: "\u4F8B\u5982 github.repositories",
  defaultFetchPipeline: "\u9ED8\u8BA4 URL \u8BFB\u53D6\u6D41\u6C34\u7EBF",
  defaultFetchPipelineHint: "nb_fetch \u8BFB\u53D6 URL \u65F6\u4F7F\u7528\u7684\u6D41\u6C34\u7EBF\u3002\u7559\u7A7A\u5219\u6CBF\u7528 SDK \u914D\u7F6E\u3002",
  defaultFetchPipelineExample: "\u4F8B\u5982 direct.fetch",
  overridden: "\u5DF2\u8986\u76D6",
  reset: "\u6062\u590D\u9ED8\u8BA4",
  inherits: "\u5F53\u524D\u6CBF\u7528 {value}",
  readOnly: "\u672C\u90E8\u7F72\u7684\u8BBE\u7F6E\u4E3A\u53EA\u8BFB\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u3002",
  unsaved: "\u672A\u4FDD\u5B58",
  save: "\u4FDD\u5B58",
  saving: "\u4FDD\u5B58\u4E2D\u2026",
  discard: "\u653E\u5F03\u4FEE\u6539",
  reload: "\u91CD\u65B0\u8F7D\u5165",
  reloading: "\u8F7D\u5165\u4E2D\u2026",
  saved: "\u5DF2\u4FDD\u5B58\uFF0CNB Search \u5C06\u5728\u4E0B\u4E00\u6B21\u5DE5\u5177\u8C03\u7528\u65F6\u91CD\u5EFA\u3002",
  saveRejected: "\u672A\u4FDD\u5B58\uFF1A",
  saveConflict: "\u8BBE\u7F6E\u5DF2\u88AB\u5176\u4ED6\u6765\u6E90\u66F4\u65B0\uFF08\u672C\u5730 {expected} \u2192 \u4E3B\u673A {actual}\uFF09\u3002\u4F60\u7684\u4FEE\u6539\u5DF2\u4FDD\u7559\uFF1A\u518D\u6B21\u4FDD\u5B58\u4F1A\u6309\u4E3B\u673A\u5F53\u524D\u503C\u91CD\u8BD5\uFF1B\u91CD\u65B0\u8F7D\u5165\u4F1A\u653E\u5F03\u672C\u5730\u4FEE\u6539\u5E76\u663E\u793A\u4E3B\u673A\u7684\u503C\u3002"
};
var en = {
  title: "NB Search",
  description: "Where the SDK reads its configuration, and which search lane and URL fetch pipeline it prefers. Blank inherits the SDK.",
  expand: "Show settings",
  collapse: "Hide settings",
  configFile: "SDK config file",
  configFileHint: "Path to the JSON file NB Search reads, as a full path. Blank uses the SDK default resolution.",
  configFileExample: "e.g. C:/Users/you/nb-search/config.json",
  defaultSearchLane: "Default search lane",
  defaultSearchLaneHint: "The lane nb_search uses when you name none. Blank inherits the SDK configuration; with no configured default a lane must be named.",
  defaultSearchLaneExample: "e.g. github.repositories",
  defaultFetchPipeline: "Default URL fetch pipeline",
  defaultFetchPipelineHint: "The pipeline nb_fetch uses to read a URL. Blank inherits the SDK configuration.",
  defaultFetchPipelineExample: "e.g. direct.fetch",
  overridden: "Overridden",
  reset: "Reset to default",
  inherits: "currently {value}",
  readOnly: "This deployment stores settings read-only, so this card cannot save.",
  unsaved: "Unsaved",
  save: "Save",
  saving: "Saving\u2026",
  discard: "Discard",
  reload: "Reload",
  reloading: "Reloading\u2026",
  saved: "Saved. NB Search rebuilds on the next tool call.",
  saveRejected: "Not saved: ",
  saveConflict: "These settings were updated elsewhere (local {expected} \u2192 host {actual}). Your edits are kept: save again to re-apply them at what the host now holds; reload drops them and shows the host values."
};

// src/client/index.ts
var NS = "nb-search";
var inject = ["slots", "locale", "connection", "remote", "settingsScope"];
function apply(ctx) {
  const { api } = ctx.get("connection");
  const scope = ctx.settingsScope.bind({ namespace: NB_SEARCH_NS });
  const card = new NbSearchCardController(scope, api, ctx.settingsScope.describe());
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "nb-search: card dictionaries");
  ctx.effect(() => async () => {
    await card.dispose();
  }, "nb-search: card controller");
  ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
    name: "settings.plugin.item",
    key: NB_SEARCH_NS,
    locale: NS,
    inject: () => card.inject()
  }, NbSearchCard));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
