/**
 * Named-subagent library for dsh-subagent-pool.
 *
 * A profile is a named subagent template maintained on the settings page
 * 「子代理」: a name, a description telling the caller when to use it, a model,
 * a reasoning effort, and an agent preset. The library is persisted through
 * the host `settings` service, surfaced to the caller through a
 * `{{subagent_pool}}` prompt variable, and executed by `subagent_run(name, task)`.
 * @module dsh-subagent-pool/profiles
 */
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
export const SubagentProfileSchema = z.object({
    name: z.string(),
    description: z.string(),
    model: z.string(),
    reasoningEffort: z.string(),
    preset: z.string(),
});
export const PROFILES_NS = settingsNamespace('subagent-pool');
export const PROFILES_SCHEMA = z.object({ profiles: z.array(SubagentProfileSchema) });
/** Render the caller-facing directory of the subagent library. */
export function renderProfileDirectory(profiles) {
    if (profiles.length === 0) {
        return '（无子代理配置。可在设置页「子代理」中添加。）';
    }
    const lines = profiles.map((p) => {
        const parts = [
            `- ${p.name}`,
            p.description !== '' ? `：${p.description}` : '',
            `[模型 ${p.model !== '' ? p.model : '默认'}，推理 ${p.reasoningEffort !== '' ? p.reasoningEffort : '默认'}，预设 ${p.preset !== '' ? p.preset : '继承'}]`,
        ];
        return parts.join('');
    });
    return `以下子代理可用（设置页「子代理」维护）；需要时用 subagent_run(name="<名字>", task="……") 调用：\n${lines.join('\n')}`;
}
/** Aggregate the model picker options from every configurable provider. */
export async function collectModels(ctx) {
    const llm = ctx.get('llm');
    if (llm === undefined)
        return [];
    const out = [];
    for (const provider of llm.listConfigurableProviders()) {
        try {
            const models = await llm.listModels(provider.provider);
            for (const model of models) {
                out.push({ provider: provider.provider, model: model.id });
            }
        }
        catch {
            // A provider with no model directory simply contributes nothing.
        }
    }
    return out;
}
export async function snapshotProfiles(ctx, profiles) {
    const presets = ctx.get('agentPresets') !== undefined
        ? (await ctx.agentPresets.list()).map((p) => p.id).sort()
        : [];
    const models = (await collectModels(ctx)).map((m) => `${m.provider}/${m.model}`);
    return {
        profiles,
        presets,
        models,
        efforts: ['', 'off', 'high', 'max'],
    };
}
