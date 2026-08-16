/**
 * dsh-subagent-pool: a host-plane plugin that maintains a library of named
 * subagents (model, reasoning effort, agent preset) on the 「子代理」 settings
 * page and runs them by name through `subagent_run`.
 *
 * The settings page talks to the host over a same-origin HTTP route — the
 * package-private `harness.handle()` bridge exists only in the dynamic-code
 * VM, not in an ordinary installed Cordis package.
 * @module dsh-subagent-pool
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "subagent-pool";
export declare const inject: string[];
/** Plugin configuration. */
export interface Config {
    /** Prompt-section order for the usage policy (default `118`, after delegation policy). */
    promptSectionOrder?: number;
}
export declare const Config: z<Config>;
export declare function apply(ctx: Context, config: Config): void;
