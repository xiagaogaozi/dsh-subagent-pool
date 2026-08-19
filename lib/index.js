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
import z from '@deepseek-ai/schemastery';
import { registerSubagentRunTool } from "./tools.js";
import { PROFILES_NS, PROFILES_SCHEMA, renderProfileDirectory, snapshotProfiles, } from "./profiles.js";
/** Web-server service key candidates, newest first. */
const WEB_SERVER_KEYS = ['webServer', 'httpServer'];
/** Same-origin settings-page endpoint for the subagent-profile library. */
const PROFILES_ROUTE = '/plugins/dsh-subagent-pool/profiles';
/** Send one JSON response with the profile API's no-cache policy. */
function writeJson(res, status, value) {
    res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
    });
    res.end(JSON.stringify(value));
}
/** Read one small JSON request body, rejecting malformed or oversized input. */
async function readJson(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += bytes.length;
        if (size > 256 * 1024)
            throw new Error('request body too large');
        chunks.push(bytes);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    if (text === '')
        return undefined;
    return JSON.parse(text);
}
/** Whether one decoded JSON value is an object with an array `profiles` field. */
function profilesFrom(value) {
    if (typeof value !== 'object' || value === null)
        return undefined;
    const profiles = value.profiles;
    return Array.isArray(profiles) ? profiles : undefined;
}
export const name = 'subagent-pool';
export const inject = ['tools', 'subagents', 'agents', 'systemPrompt', 'settings', 'agentPresets'];
export const Config = z.object({
    promptSectionOrder: z.natural().default(118),
});
/** The model-facing usage policy: when and how to use the subagent library. */
function usageSectionText() {
    return 'The subagent library (设置页「子代理」) lists reusable named subagents with their own model/reasoning/preset. When a task fits one, call subagent_run(name="<名字>", task="……") instead of a generic delegation; the subagent is one-shot and returns its final output.';
}
export function apply(ctx, config) {
    // Named-subagent library: persisted through the settings service, edited on
    // the 「子代理」 settings page (client), surfaced to the caller through a
    // prompt variable, and executed by subagent_run(name=...).
    const profileScope = ctx.settings.register(PROFILES_NS, PROFILES_SCHEMA);
    const loadProfiles = () => {
        const value = profileScope.get();
        return Array.isArray(value?.profiles) ? value.profiles : [];
    };
    ctx.systemPrompt.variable('subagent_pool', () => renderProfileDirectory(loadProfiles()));
    ctx.systemPrompt.section({
        name: 'subagent-pool:usage',
        order: config.promptSectionOrder ?? 118,
        text: `${usageSectionText()}\n{{subagent_pool}}`,
    });
    registerSubagentRunTool(ctx, loadProfiles, async (profiles) => {
        await profileScope.replace({ profiles });
    });
    // The settings-page route needs the Web server, which webless profiles do
    // not mount; register lazily, then on each service binding event.
    let webRegistered = false;
    const registerWebSurface = () => {
        if (webRegistered)
            return;
        const webServer = (ctx.get(WEB_SERVER_KEYS[0]) ?? ctx.get(WEB_SERVER_KEYS[1]));
        if (webServer === undefined)
            return;
        webRegistered = true;
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: PROFILES_ROUTE,
            handler: async (req, res) => {
                if (req.method === 'GET') {
                    writeJson(res, 200, await snapshotProfiles(ctx, loadProfiles()));
                    return;
                }
                if (req.method !== 'POST') {
                    res.writeHead(405, { allow: 'GET, POST' });
                    res.end();
                    return;
                }
                let profiles;
                try {
                    profiles = profilesFrom(await readJson(req));
                }
                catch {
                    writeJson(res, 400, { ok: false, error: 'invalid JSON body' });
                    return;
                }
                if (profiles === undefined) {
                    writeJson(res, 400, { ok: false, error: 'profiles must be an array' });
                    return;
                }
                await profileScope.replace({ profiles });
                writeJson(res, 200, { ok: true, count: profiles.length });
            },
        }), 'subagent-pool: profiles route');
    };
    registerWebSurface();
    ctx.on('internal/service', (serviceName) => {
        if (WEB_SERVER_KEYS.includes(serviceName))
            registerWebSurface();
    });
}
