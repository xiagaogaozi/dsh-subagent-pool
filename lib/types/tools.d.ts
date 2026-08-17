/**
 * Model-facing tools for dsh-subagent-pool: `subagent_run` executes a named
 * subagent from the library on a one-shot delegation (model override,
 * reasoning effort, and agent preset applied), and `subagent_define` lets the
 * caller create or update a named subagent itself — no settings page needed.
 * @module dsh-subagent-pool/tools
 */
import type { Context } from '@deepseek-ai/cordis';
import type { SubagentProfile } from './profiles.ts';
/** Synchronous reader of the subagent-profile library. */
export type ProfileLoader = () => SubagentProfile[];
/** Persist the whole profile list (upsert target for `subagent_define`). */
export type ProfileSaver = (profiles: SubagentProfile[]) => Promise<void>;
/** Register the `subagent_run` and `subagent_define` tools. */
export declare function registerSubagentRunTool(ctx: Context, loadProfiles: ProfileLoader, saveProfiles: ProfileSaver): void;
