import type { ToolDefinition } from '@deepseek-ai/dsh-tools'

/** Common SDK envelope fields; provider-specific typed data stays lossless JSON. */
export const envelopeSchema: ToolDefinition['output']['schema'] = {
  type: 'object',
  additionalProperties: true,
  properties: {
    schema_version: { type: 'string' },
    action: { type: 'string' },
    mode: { type: 'string' },
    execution: { type: 'string' },
    status: { type: 'string' },
    state: { type: 'string' },
    job_id: { type: 'string' },
    job: { type: 'object', additionalProperties: true, properties: {
      job_id: { type: 'string' }, state: { type: 'string' }, created_at: { type: 'string' },
    } },
    output: { type: 'object', additionalProperties: true, properties: {
      channel: { type: 'string' }, schema_id: { type: 'string' }, status: { type: 'string' },
      data: {}, results: { type: 'array', items: { type: 'object', additionalProperties: true, properties: {
        title: { type: 'string' }, url: { type: 'string' }, snippet: { type: 'string' },
      } } },
    } },
    documents: { type: 'array', items: { type: 'object', additionalProperties: true, properties: {
      content: { type: 'string' }, url: { type: 'string' }, final_url: { type: 'string' },
      source_lane: { type: 'string' }, truncated: { type: 'boolean' }, warnings: { type: 'array' },
    } } },
    error: { type: 'object', additionalProperties: true, properties: {
      code: { type: 'string' }, message: { type: 'string' }, retryable: { type: 'boolean' },
    } },
    hints: { type: 'array' },
    selection: { type: 'object', additionalProperties: true },
    chunks: { type: 'array', items: { type: 'object', additionalProperties: true, properties: {
      index: { type: 'integer' }, offset: { type: 'integer' }, byte_length: { type: 'integer' }, data_base64: { type: 'string' },
    } } },
    artifact: { type: 'object', additionalProperties: true },
    next_cursor: { type: 'string' },
    poll_after_ms: { type: 'number' },
    cancel_requested: { type: 'boolean' },
    revision: { type: 'string' },
    search: { type: 'object', additionalProperties: true },
    fetch: { type: 'object', additionalProperties: true },
    providers: { type: 'object', additionalProperties: true },
    jobs: { type: 'object', additionalProperties: true },
  },
}

/** Full Native JSON; the host's output cap/spill policy owns recoverable bounding. */
export function renderEnvelope(value: unknown): ReturnType<ToolDefinition['output']['render']> {
  return [{ type: 'text', text: JSON.stringify(value, null, 2) }]
}
