/**
 * Model-facing tools for dsh-subagent-pool: `subagent_run` executes a named
 * subagent from the library on a one-shot delegation (model override,
 * reasoning effort, and agent preset applied), and `subagent_define` lets the
 * caller create or update a named subagent itself — no settings page needed.
 * @module dsh-subagent-pool/tools
 */

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent, AgentHandle, CreateAgentOptions } from '@deepseek-ai/dsh-agent'
import { foldConsumedWork } from '@deepseek-ai/dsh-agent'
import { defineTool, type ToolRunContext } from '@deepseek-ai/dsh-tools'
import { createUserMessage, ReasoningEffortId, type ContentBlock } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import {
  appendDelegatedPolicyOverrides,
  captureDelegatedPolicyOverrides,
  childSessionMeta,
  finalAssistantOutput,
  resolveChildAgentOptions,
  resolveChildDepth,
  type SubagentResult,
  type SubagentStopReason,
} from '@deepseek-ai/dsh-subagent'
// Declaration merge only: makes ctx.agents visible.
import type {} from '@deepseek-ai/dsh-agent'
// Declaration merge only: makes ctx.subagents visible.
import type {} from '@deepseek-ai/dsh-subagent'
// Declaration merge only: makes ctx.agentPresets visible.
import type {} from '@deepseek-ai/dsh-agent-presets'
import type { SubagentProfile } from './profiles.ts'

/** Synchronous reader of the subagent-profile library. */
export type ProfileLoader = () => SubagentProfile[]

/** Persist the whole profile list (upsert target for `subagent_define`). */
export type ProfileSaver = (profiles: SubagentProfile[]) => Promise<void>

/**
 * Extract the plain-text of a child's final output.
 * @param output - the result content blocks.
 * @returns the joined text.
 */
function outputText(output: Array<{ type: string; text?: string }>): string {
  return output
    .filter((block): block is { type: string; text: string } => block.text !== undefined)
    .map((block) => block.text)
    .join('\n')
}

/**
 * Split a `provider/model` spec into its route parts. A bare model id keeps
 * the parent's provider; an explicit provider must not depend on the parent.
 */
function splitModel(spec: string): { provider?: string; model: string } {
  const slash = spec.indexOf('/')
  if (slash > 0) return { provider: spec.slice(0, slash), model: spec.slice(slash + 1) }
  return { model: spec }
}

/**
 * Whether the child's effective model supports the requested reasoning
 * effort. Models without a reasoning metadata (e.g. some third-party GPT
 * routes) reject an injected effort at the adapter boundary, so the effort is
 * only wired when the model's `reasoning.efforts` lists it; an unknown model
 * conservatively skips the effort (the adapter default applies).
 */
async function supportsEffort(
  ctx: Context,
  profile: SubagentProfile,
  parentRoute: { provider?: string; model?: string },
): Promise<boolean> {
  const llm = ctx.get('llm')
  if (llm === undefined) return false
  const route = splitModel(profile.model)
  const provider = route.provider ?? parentRoute.provider
  const model = route.model ?? parentRoute.model
  if (provider === undefined || model === undefined) return false
  try {
    const info = await llm.resolveModelInfo(provider, model)
    const efforts = info.reasoning?.efforts ?? []
    return efforts.some((effort) => effort.id === profile.reasoningEffort)
  } catch {
    return false
  }
}

/**
 * Map one session turn outcome to the subagent seam's terminal vocabulary,
 * mirroring the harness's in-process driver.
 */
function toStopReason(reason: { kind?: string } | undefined, cancelled: boolean): SubagentStopReason {
  switch (reason?.kind) {
    case 'completed':
      return 'completed'
    case 'max-tokens':
      return 'max-tokens'
    case 'aborted':
      return cancelled ? 'aborted' : 'aborted'
    case 'blocked':
      return 'refusal'
    case 'error':
    case 'interrupted':
    default:
      return 'error'
  }
}

/**
 * Wire the reasoning-effort waterfall on the child, mirroring the harness's
 * own selection mechanism. Applied inside the creation setup so it is live
 * from the child's very first request.
 */
function wireReasoningEffort(
  childCtx: Context,
  effort: string,
): void {
  childCtx.on('agent/request', async (_payload, next) => {
    const resolved = await next()
    return { ...resolved, reasoningEffort: ReasoningEffortId(effort) }
  })
}

/**
 * Establish one one-shot child whose agent preset is mounted BEFORE its first
 * prompt is assembled. This is the fix for the old flow, which delegated to
 * `ctx.subagents.start('spawn')` and then called `agentPresets.recompose()`
 * after publication — the child's first turn was already in flight by then, so
 * the preset's persona/tools never reached the first (and only) prompt.
 *
 * The agent factory's `setup` callback runs while the child is still
 * unpublished ("setup composes, it never drives"), which is exactly the
 * window `agentPresets.mount()` requires. Everything else mirrors the
 * harness's in-process spawn driver: policy inheritance, lineage/depth
 * stamping, one followup, quiescent disposal, and the canonical output rule.
 *
 * @param ctx - the plugin context (host plane).
 * @param profile - the resolved subagent profile.
 * @param parent - the exact live calling agent.
 * @param task - the self-contained task text.
 * @param signal - caller cancellation, forwarded to creation and turn work.
 * @returns the joined final output text.
 */
async function runWithPreset(
  ctx: Context,
  profile: SubagentProfile,
  parent: Agent,
  task: string,
  signal: AbortSignal,
): Promise<string> {
  const childDepth = resolveChildDepth(parent, 3)
  const meta = childSessionMeta(parent, childDepth, 0)
  const agentOptions = resolveChildAgentOptions(
    parent,
    profile.model !== '' ? splitModel(profile.model) : undefined,
    childDepth,
  )
  const delegated = captureDelegatedPolicyOverrides(parent)
  const presetId = profile.preset
  const effort = profile.reasoningEffort
  const shouldWireEffort = effort !== '' && await supportsEffort(ctx, profile, parent.options)

  const createOptions: CreateAgentOptions = {
    sessionId: SessionId(randomUUID()),
    meta,
    agentOptions,
    signal,
    setup: async (childCtx) => {
      // Policy inheritance: the child acts only within the sandbox scope fixed
      // at delegation, and its approval asks are rejected deterministically.
      appendDelegatedPolicyOverrides(childCtx.agent!.session, delegated)
      if (presetId !== '') {
        // Mount the target preset inside the unpublished creation window. The
        // factory awaits setup before publication, so by the time the child is
        // visible its persona/tools/skills are already the preset's.
        await ctx.agentPresets.mount(childCtx, presetId)
      }
      if (shouldWireEffort) wireReasoningEffort(childCtx, effort)
    },
  }

  const handle: AgentHandle = await ctx.agents.create(createOptions)
  const child = handle.agent
  const boundary = child.session.events.length
  let cancelled = false
  const onAbort = (): void => {
    cancelled = true
    child.cancel({ kind: 'parent' })
  }
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    child.followup(createUserMessage({ content: [{ type: 'text', text: task }], source: { kind: 'user' } }))
    await child.whenIdle()
  } finally {
    signal.removeEventListener('abort', onAbort)
  }
  try {
    const own = child.session.events.slice(boundary)
    const lastEnd = foldConsumedWork(own).end
    const output = finalAssistantOutput(own) ?? []
    const stopReason = toStopReason(lastEnd?.data.reason, cancelled)
    const result: SubagentResult = { output, stopReason }
    const text = outputText(result.output)
    if (result.stopReason !== 'completed') {
      return `[subagent "${profile.name}" ended with ${result.stopReason}]\n${text}`
    }
    return text
  } finally {
    await handle.dispose()
  }
}

/**
 * Fallback path for profiles without an agent preset: delegate to the harness
 * `ctx.subagents.start('spawn')` exactly as before. Preserving this keeps the
 * no-preset behavior bit-for-bit identical to the previous release.
 */
async function runInherited(
  ctx: Context,
  profile: SubagentProfile,
  parent: Agent,
  task: string,
  signal: AbortSignal,
): Promise<string> {
  const run = await ctx.subagents.start('spawn', {
    label: `subagent-pool:${profile.name}`,
    prompt: [{ type: 'text', text: task }],
    parent,
    signal,
    ...profile.model !== '' ? { agentOptions: splitModel(profile.model) } : {},
  })
  try {
    const result = await run.result
    const text = outputText(result.output)
    if (result.stopReason !== 'completed') {
      return `[subagent "${profile.name}" ended with ${result.stopReason}]\n${text}`
    }
    return text
  } finally {
    await run.dispose()
  }
}

/** Register the `subagent_run` and `subagent_define` tools. */
export function registerSubagentRunTool(
  ctx: Context,
  loadProfiles: ProfileLoader,
  saveProfiles: ProfileSaver,
): void {
  ctx.tools.register(defineTool({
    name: 'subagent_define',
    description: 'Create or update a named subagent in the 子代理 settings page (upsert by name). Use it when the task needs a reusable subagent that is not configured yet — define it (name/description/model/reasoning/preset), then call subagent_run(name="<名字>", task="……"). Explicit fields replace the previous ones; omitted fields are cleared. To ALSO author a brand-new agent preset for the subagent, set preset to a new id and preset_from to an existing preset id (e.g. "story") — the new preset is created as a copy of preset_from and becomes mountable immediately.',
    parameters: {
      name: { type: 'string', required: true, description: 'Unique subagent name.' },
      description: { type: 'string', description: 'When to use this subagent — shown to the caller in the prompt directory.' },
      model: { type: 'string', description: 'Model route "provider/model", empty = inherit the caller\'s model.' },
      reasoning_effort: { type: 'string', description: 'Reasoning effort "off" | "high" | "max", empty = model default.' },
      preset: { type: 'string', description: 'Agent preset id to mount on the subagent, empty = inherit the caller\'s preset. A NEW id combined with preset_from creates that preset (as a copy of preset_from) first.' },
      preset_from: { type: 'string', description: 'Source preset id to copy when preset does not exist yet (e.g. "story"). Ignored when preset already exists.' },
    },
    output: {
      schema: { type: 'string' },
      render: (args, value) => [{ type: 'text', text: String(value) }],
    },
    async execute(args) {
      const name = args.name.trim()
      if (name === '') throw new Error('subagent name must not be empty')
      let preset = args.preset ?? ''
      // New-preset authoring: when preset names an id that is not on the
      // roster yet and preset_from (a source preset) is given, create the new
      // preset as a whole-directory copy of preset_from. Discovery re-reads
      // the roots on every call, so the copy is mountable right away.
      if (preset !== '' && args.preset_from !== undefined && args.preset_from !== '') {
        const available = await ctx.agentPresets.list()
        if (!available.some((candidate) => candidate.id === preset)) {
          if (!ctx.agentPresets.authorable) {
            throw new Error(`preset "${preset}" does not exist and this deployment has no user-writable preset root to create it in`)
          }
          await ctx.agentPresets.copy(args.preset_from, preset, preset)
        }
      }
      const next = [
        ...loadProfiles().filter((profile) => profile.name !== name),
        {
          name,
          description: args.description ?? '',
          model: args.model ?? '',
          reasoningEffort: args.reasoning_effort ?? '',
          preset,
        },
      ]
      await saveProfiles(next)
      return `subagent "${name}" saved (${next.length} total in the library)`
    },
  }))
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
    async execute(args, exec: ToolRunContext) {
      if (exec.agent === undefined) {
        throw new Error('subagent_run requires a calling agent')
      }
      const profile = loadProfiles().find((candidate) => candidate.name === args.name)
      if (profile === undefined) {
        throw new Error(`subagent "${args.name}" not found in the 子代理 settings page`)
      }
      // A profile with an agent preset must have that preset mounted inside the
      // child's unpublished creation window; the old post-publication recompose
      // raced the child's first turn and never applied. A profile without a
      // preset keeps the original harness spawn path untouched.
      if (profile.preset !== '') {
        return await runWithPreset(ctx, profile, exec.agent, args.task, exec.signal)
      }
      return await runInherited(ctx, profile, exec.agent, args.task, exec.signal)
    },
  }))
}
