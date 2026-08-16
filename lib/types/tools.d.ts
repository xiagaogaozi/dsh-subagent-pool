/**
 * The `subagent_run` model-facing tool: run one named subagent from the
 * library on a one-shot delegation, applying its model override, reasoning
 * effort, and agent preset, and return the child's final output.
 * @module dsh-subagent-pool/tools
 */
import type { Context } from '@deepseek-ai/cordis';
import type { SubagentProfile } from './profiles.ts';
/** Synchronous reader of the subagent-profile library. */
export type ProfileLoader = () => SubagentProfile[];
/** Register the `subagent_run` tool into the shared tools registry. */
export declare function registerSubagentRunTool(ctx: Context, loadProfiles: ProfileLoader): void;
