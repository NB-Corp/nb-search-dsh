/**
 * The NB Search settings card: the three optional overrides that decide where
 * the SDK reads its config and which search lane / URL fetch pipeline it
 * prefers, staged as a draft and written as one revision-fenced batch.
 *
 * The card renders nothing while its namespace is unavailable: a deployment
 * that does not compose the owning Host plugin should show no trace of it,
 * rather than a disabled card the user cannot act on. Disclosure is card-local
 * state, and staged edits outlive collapsing, so the header keeps marking the
 * card while it holds unsaved changes.
 *
 * Every control is a labeled input over a one-line helper naming the value it
 * inherits when blank. Nothing here writes: a control reports what the user
 * typed, and the card's save is the single point where a draft becomes a
 * document mutation.
 */

// The default import is load-bearing: this package's client bundle is compiled
// with esbuild's classic JSX transform, which lowers JSX to `React.createElement`
// and expects the namespace in scope. Importing only the named hooks renders
// fine under the automatic runtime and throws `React is not defined` here.
import React, { useState } from 'react'
import clsx from 'clsx'
import type {
  InjectFace, PropsLocale, PropsRuntime,
} from '@deepseek-ai/dsh-client-ui-slots'
import type { NbSearchCardFace, NbSearchCardState, NbSearchField } from './nb-search-card-controller.ts'
import type { NbSearchLocaleKey } from './locales.ts'
import css from './NbSearchCard.module.css'

/** Props the renderer binds for the NB Search card. */
export type NbSearchCardProps =
  PropsRuntime<'settings.plugin.item'>
  & PropsLocale<'nb-search'>
  & InjectFace<NbSearchCardFace>

/** One field as the card stacks it: label, helper, and its staged control. */
interface FieldRow {
  field: NbSearchField
  labelKey: NbSearchLocaleKey
  hintKey: NbSearchLocaleKey
  placeholderKey: NbSearchLocaleKey
}

/** The three fields, in the order the card stacks them. */
const FIELDS: readonly FieldRow[] = [
  { field: 'configFile', labelKey: 'configFile', hintKey: 'configFileHint', placeholderKey: 'configFileExample' },
  { field: 'defaultSearchLane', labelKey: 'defaultSearchLane', hintKey: 'defaultSearchLaneHint', placeholderKey: 'defaultSearchLaneExample' },
  { field: 'defaultFetchPipeline', labelKey: 'defaultFetchPipeline', hintKey: 'defaultFetchPipelineHint', placeholderKey: 'defaultFetchPipelineExample' },
]

/**
 * Render the NB Search settings card.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the card, or nothing while the namespace is unavailable.
 */
export function NbSearchCard(props: NbSearchCardProps) {
  const { t } = props
  const state = props.useNbSearchCard(snapshot => snapshot)
  const [open, setOpen] = useState(false)
  if (!state.available) return null

  // Every control that changes the draft is disabled while a write or a read is
  // in flight: a save clears the draft it read, so an edit typed during the
  // round trip would be dropped on success.
  const busy = state.saving || state.reloading
  const disabled = !state.writable || busy
  const blocked = !state.dirty || busy || !state.writable
  const title = t('title')

  return (
    <li className={clsx(css.card, open && css.cardOpen)}>
      <button
        type="button"
        className={css.header}
        aria-expanded={open}
        aria-label={`${t(open ? 'collapse' : 'expand')}: ${title}`}
        onClick={() => { setOpen(!open) }}
      >
        <span className={css.headText}>
          <span className={css.name}>{title}</span>
          <span className={css.description}>{t('description')}</span>
        </span>
        {state.dirty ? <span className={css.pending}>{t('unsaved')}</span> : null}
        <span className={clsx(css.chevron, open && css.chevronOpen)} aria-hidden="true">
          <svg viewBox="0 0 14 14" width="14" height="14" focusable="false">
            <path
              d="M3.5 5.5 7 9l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open
        ? (
          <div className={css.body}>
            {!state.writable ? <p className={css.readOnly} role="status">{t('readOnly')}</p> : null}
            <ul className={css.fields}>
              {FIELDS.map(({ field, labelKey, hintKey, placeholderKey }) => {
                const control = state.fields[field]
                const inputId = `nb-search-${field}`
                return (
                  <li className={css.field} key={field}>
                    <div className={css.fieldHead}>
                      <label className={css.label} htmlFor={inputId}>{t(labelKey)}</label>
                      {control.overridden
                        ? (
                          <span className={css.badges}>
                            <span className={css.badge}>{t('overridden')}</span>
                            <button
                              type="button"
                              className={css.reset}
                              disabled={disabled}
                              onClick={() => { props.resetField(field) }}
                            >
                              {t('reset')}
                            </button>
                          </span>
                        )
                        : null}
                    </div>
                    <input
                      id={inputId}
                      className={css.input}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={control.text}
                      placeholder={t(placeholderKey)}
                      disabled={disabled}
                      onChange={(event) => { props.edit(field, event.target.value) }}
                    />
                    <p className={css.hint}>
                      {t(hintKey)}
                      {control.inherited !== '' && !control.overridden
                        ? <span className={css.inherit}> · {t('inherits', { value: control.inherited })}</span>
                        : null}
                    </p>
                  </li>
                )
              })}
            </ul>
            <div className={css.footer}>
              <p className={statusClass(state)} role="status">{statusText(t, state)}</p>
              {state.outcome.kind === 'conflict'
                ? (
                  <button
                    type="button"
                    className={css.reload}
                    disabled={busy}
                    onClick={props.reload}
                  >
                    {t(state.reloading ? 'reloading' : 'reload')}
                  </button>
                )
                : null}
              <button
                type="button"
                className={css.discard}
                disabled={!state.dirty || busy}
                onClick={props.discard}
              >
                {t('discard')}
              </button>
              <button
                type="button"
                className={css.save}
                disabled={blocked}
                onClick={props.save}
              >
                {t(state.saving ? 'saving' : 'save')}
              </button>
            </div>
          </div>
        )
        : null}
    </li>
  )
}

/** The status line's tone class: error for a refusal, warning for a conflict. */
function statusClass(state: NbSearchCardState): string | undefined {
  if (state.outcome.kind === 'rejected') return clsx(css.status, css.statusError)
  if (state.outcome.kind === 'conflict') return clsx(css.status, css.statusConflict)
  return clsx(css.status, css.statusIdle)
}

/** The status line's concrete text: what happened to the last save, if anything. */
function statusText(
  t: NbSearchCardProps['t'],
  state: NbSearchCardState,
): string | undefined {
  switch (state.outcome.kind) {
    case 'saved': return t('saved')
    case 'rejected': return `${t('saveRejected')}${state.outcome.message}`
    case 'conflict': return t('saveConflict', {
      expected: String(state.outcome.expected),
      actual: String(state.outcome.actual),
    })
    default: return undefined
  }
}
