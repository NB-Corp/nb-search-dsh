import { setTimeout } from 'node:timers/promises'

export async function execute(request, context) {
  if (request.query === 'slow') await setTimeout(10000, undefined, { signal: context.signal })
  context.signal.throwIfAborted()
  return [{ title: `Fixture: ${request.query}`, url: `https://example.org/${encodeURIComponent(request.query)}`, snippet: 'Deterministic fixture provider; not live search evidence.' }]
}
