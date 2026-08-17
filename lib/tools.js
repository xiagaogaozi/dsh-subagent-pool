/**
 * Model-facing tools for dsh-subagent-pool: `subagent_run` executes a named
 * subagent from the library on a one-shot delegation (model override,
 * reasoning effort, and agent preset applied), and `subagent_define` lets the
 * caller create or update a named subagent itself — no settings page needed.
 * @module dsh-subagent-pool/tools
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import { ReasoningEffortId } from '@deepseek-ai/dsh-llm';
/**
 * Extract the plain-text of a child's final output.
 * @param output - the result content blocks.
 * @returns the joined text.
 */
function outputText(output) {
    return output
        .filter((block) => block.text !== undefined)
        .map((block) => block.text)
        .join('\n');
}
/**
 * Split a `provider/model` spec into its route parts. A bare model id keeps
 * the parent's provider; an explicit provider must not depend on the parent.
 */
function splitModel(spec) {
    const slash = spec.indexOf('/');
    if (slash > 0)
        return { provider: spec.slice(0, slash), model: spec.slice(slash + 1) };
    return { model: spec };
}
/**
 * Whether the child's effective model supports the requested reasoning
 * effort. Models without a reasoning metadata (e.g. some third-party GPT
 * routes) reject an injected effort at the adapter boundary, so the effort is
 * only wired when the model's `reasoning.efforts` lists it; an unknown model
 * conservatively skips the effort (the adapter default applies).
 */
async function supportsEffort(ctx, profile, parentRoute) {
    const llm = ctx.get('llm');
    if (llm === undefined)
        return false;
    const route = splitModel(profile.model);
    const provider = route.provider ?? parentRoute.provider;
    const model = route.model ?? parentRoute.model;
    if (provider === undefined || model === undefined)
        return false;
    try {
        const info = await llm.resolveModelInfo(provider, model);
        const efforts = info.reasoning?.efforts ?? [];
        return efforts.some((effort) => effort.id === profile.reasoningEffort);
    }
    catch {
        return false;
    }
}
/**
 * Mount the profile's agent preset on the child and wire the reasoning-effort
 * waterfall, mirroring the harness's own selection mechanism.
 * @param child - the live in-process child.
 * @param profile - the resolved profile.
 * @param parentRoute - the caller's provider/model route (inheritance base).
 */
async function applyProfile(ctx, child, profile, parentRoute) {
    if (profile.preset !== '') {
        await ctx.agentPresets.recompose(child.ctx, profile.preset);
        // Durable commit point: the session event persists the preset so a
        // resumed/restored child remounts THIS preset, not the inherited one.
        child.session.append('agent-preset/selected', { agentPreset: profile.preset });
    }
    if (profile.reasoningEffort !== '' && await supportsEffort(ctx, profile, parentRoute)) {
        child.ctx.on('agent/request', async (_payload, next) => {
            const resolved = await next();
            return { ...resolved, reasoningEffort: ReasoningEffortId(profile.reasoningEffort) };
        });
    }
}
/** Register the `subagent_run` and `subagent_define` tools. */
export function registerSubagentRunTool(ctx, loadProfiles, saveProfiles) {
    ctx.tools.register(defineTool({
        name: 'subagent_define',
        description: 'Create or update a named subagent in the 子代理 settings page (upsert by name). Use it when the task needs a reusable subagent that is not configured yet — define it (name/description/model/reasoning/preset), then call subagent_run(name="<名字>", task="……"). Explicit fields replace the previous ones; omitted fields are cleared.',
        parameters: {
            name: { type: 'string', required: true, description: 'Unique subagent name.' },
            description: { type: 'string', description: 'When to use this subagent — shown to the caller in the prompt directory.' },
            model: { type: 'string', description: 'Model route "provider/model", empty = inherit the caller\'s model.' },
            reasoning_effort: { type: 'string', description: 'Reasoning effort "off" | "high" | "max", empty = model default.' },
            preset: { type: 'string', description: 'Agent preset id to mount on the subagent, empty = inherit the caller\'s preset.' },
        },
        output: {
            schema: { type: 'string' },
            render: (args, value) => [{ type: 'text', text: String(value) }],
        },
        async execute(args) {
            const name = args.name.trim();
            if (name === '')
                throw new Error('subagent name must not be empty');
            const next = [
                ...loadProfiles().filter((profile) => profile.name !== name),
                {
                    name,
                    description: args.description ?? '',
                    model: args.model ?? '',
                    reasoningEffort: args.reasoning_effort ?? '',
                    preset: args.preset ?? '',
                },
            ];
            await saveProfiles(next);
            return `subagent "${name}" saved (${next.length} total in the library)`;
        },
    }));
    ctx.tools.register(defineTool({
        name: 'subagent_run',
        description: 'Run one named subagent from the 子代理 settings page on a one-shot task. The profile decides the model, reasoning effort, and agent preset; the subagent works on the task and returns its final output. Use it when the task fits a configured subagent (see the subagent directory in the system prompt).',
        parameters: {
            name: { type: 'string', required: true, description: 'Subagent name from the 子代理 settings page.' },
            task: { type: 'string', required: true, description: 'The task given to the subagent, self-contained (the subagent sees no conversation context).' },
        },
        output: {
            schema: { type: 'string' },
            render: (args, value) => [{ type: 'text', text: `[subagent_run: ${String(args.name)}]\n${String(value)}` }],
        },
        async execute(args, exec) {
            if (exec.agent === undefined) {
                throw new Error('subagent_run requires a calling agent');
            }
            const profile = loadProfiles().find((candidate) => candidate.name === args.name);
            if (profile === undefined) {
                throw new Error(`subagent "${args.name}" not found in the 子代理 settings page`);
            }
            const run = await ctx.subagents.start('spawn', {
                label: `subagent-pool:${profile.name}`,
                prompt: [{ type: 'text', text: args.task }],
                parent: exec.agent,
                signal: exec.signal,
                ...profile.model !== '' ? { agentOptions: splitModel(profile.model) } : {},
            });
            // Apply preset + reasoning effort while the child is live. A one-shot
            // child starts its turn asynchronously after publication, so these
            // synchronous rebinds normally land before its first model request.
            const child = run.localAgent;
            if (child !== undefined) {
                await applyProfile(ctx, child, profile, exec.agent.options);
            }
            try {
                const result = await run.result;
                const text = outputText(result.output);
                if (result.stopReason !== 'completed') {
                    return `[subagent "${args.name}" ended with ${result.stopReason}]\n${text}`;
                }
                return text;
            }
            finally {
                await run.dispose();
            }
        },
    }));
}
