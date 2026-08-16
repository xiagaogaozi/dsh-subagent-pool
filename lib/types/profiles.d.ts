/**
 * Named-subagent library for dsh-subagent-pool.
 *
 * A profile is a named subagent template maintained on the settings page
 * 「子代理」: a name, a description telling the caller when to use it, a model,
 * a reasoning effort, and an agent preset. The library is persisted through
 * the host `settings` service, surfaced to the caller through a
 * `{{subagentPool}}` prompt variable, and executed by `subagent_run(name, task)`.
 * @module dsh-subagent-pool/profiles
 */
import z from '@deepseek-ai/schemastery';
import type { Context } from '@deepseek-ai/cordis';
/** One named subagent template. */
export interface SubagentProfile {
    /** Unique template name. */
    name: string;
    /** When to use this subagent — shown to the caller in the prompt directory. */
    description: string;
    /** Model override applied to the subagent (`''` = the caller's model). */
    model: string;
    /** Reasoning effort injected on the subagent's requests (`off`/`high`/`max`/`''`). */
    reasoningEffort: string;
    /** Agent-preset id mounted on the subagent (`''` = inherit the caller's). */
    preset: string;
}
export declare const SubagentProfileSchema: z<Schemastery.ObjectS<{
    name: z<string, string>;
    description: z<string, string>;
    model: z<string, string>;
    reasoningEffort: z<string, string>;
    preset: z<string, string>;
}>, Schemastery.ObjectT<{
    name: z<string, string>;
    description: z<string, string>;
    model: z<string, string>;
    reasoningEffort: z<string, string>;
    preset: z<string, string>;
}>>;
export declare const PROFILES_NS: import("@deepseek-ai/dsh-settings").SettingsNamespace;
export declare const PROFILES_SCHEMA: z<Schemastery.ObjectS<{
    profiles: z<({
        name?: string | null | undefined;
        description?: string | null | undefined;
        model?: string | null | undefined;
        reasoningEffort?: string | null | undefined;
        preset?: string | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict)[], Schemastery.ObjectT<{
        name: z<string, string>;
        description: z<string, string>;
        model: z<string, string>;
        reasoningEffort: z<string, string>;
        preset: z<string, string>;
    }>[]>;
}>, Schemastery.ObjectT<{
    profiles: z<({
        name?: string | null | undefined;
        description?: string | null | undefined;
        model?: string | null | undefined;
        reasoningEffort?: string | null | undefined;
        preset?: string | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict)[], Schemastery.ObjectT<{
        name: z<string, string>;
        description: z<string, string>;
        model: z<string, string>;
        reasoningEffort: z<string, string>;
        preset: z<string, string>;
    }>[]>;
}>>;
/** Render the caller-facing directory of the subagent library. */
export declare function renderProfileDirectory(profiles: SubagentProfile[]): string;
/** Aggregate the model picker options from every configurable provider. */
export declare function collectModels(ctx: Context): Promise<Array<{
    provider: string;
    model: string;
}>>;
/** The settings-page snapshot: profiles plus the picker metadata. */
export interface ProfilesSnapshot {
    profiles: SubagentProfile[];
    /** Available agent-preset ids. */
    presets: string[];
    /** Model picker options (provider-prefixed ids). */
    models: string[];
    /** Supported reasoning efforts. */
    efforts: string[];
}
export declare function snapshotProfiles(ctx: Context, profiles: SubagentProfile[]): Promise<ProfilesSnapshot>;
