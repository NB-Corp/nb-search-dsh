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
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { NbSearchCardFace } from './nb-search-card-controller.ts';
/** Props the renderer binds for the NB Search card. */
export type NbSearchCardProps = PropsRuntime<'settings.plugin.item'> & PropsLocale<'nb-search'> & InjectFace<NbSearchCardFace>;
/**
 * Render the NB Search settings card.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the card, or nothing while the namespace is unavailable.
 */
export declare function NbSearchCard(props: NbSearchCardProps): import("react/jsx-runtime").JSX.Element | null;
