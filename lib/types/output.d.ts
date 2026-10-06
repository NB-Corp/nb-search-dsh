import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
/** Common SDK envelope fields; provider-specific typed data stays lossless JSON. */
export declare const envelopeSchema: ToolDefinition['output']['schema'];
/** Full Native JSON; the host's output cap/spill policy owns recoverable bounding. */
export declare function renderEnvelope(value: unknown): ReturnType<ToolDefinition['output']['render']>;
