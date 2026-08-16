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

import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { Context } from '@deepseek-ai/cordis'
// Declaration merge only: makes ctx.settings and ctx.llm visible.
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-agent-presets'

/** One named subagent template. */
export interface SubagentProfile {
  /** Unique template name. */
  name: string
  /** When to use this subagent — shown to the caller in the prompt directory. */
  description: string
  /** Model override applied to the subagent (`''` = the caller's model). */
  model: string
  /** Reasoning effort injected on the subagent's requests (`off`/`high`/`max`/`''`). */
  reasoningEffort: string
  /** Agent-preset id mounted on the subagent (`''` = inherit the caller's). */
  preset: string
}

export const SubagentProfileSchema = z.object({
  name: z.string(),
  description: z.string(),
  model: z.string(),
  reasoningEffort: z.string(),
  preset: z.string(),
})

export const PROFILES_NS = settingsNamespace('subagent-pool')
export const PROFILES_SCHEMA = z.object({ profiles: z.array(SubagentProfileSchema) })

/** Render the caller-facing directory of the subagent library. */
export function renderProfileDirectory(profiles: SubagentProfile[]): string {
  if (profiles.length === 0) {
    return '（无子代理配置。可在设置页「子代理」中添加。）'
  }
  const lines = profiles.map((p) => {
    const parts = [
      `- ${p.name}`,
      p.description !== '' ? `：${p.description}` : '',
      `[模型 ${p.model !== '' ? p.model : '默认'}，推理 ${p.reasoningEffort !== '' ? p.reasoningEffort : '默认'}，预设 ${p.preset !== '' ? p.preset : '继承'}]`,
    ]
    return parts.join('')
  })
  return `以下子代理可用（设置页「子代理」维护）；需要时用 subagent_run(name="<名字>", task="……") 调用：\n${lines.join('\n')}`
}

/** Aggregate the model picker options from every configurable provider. */
export async function collectModels(ctx: Context): Promise<Array<{ provider: string; model: string }>> {
  const llm = ctx.get('llm')
  if (llm === undefined) return []
  const out: Array<{ provider: string; model: string }> = []
  for (const provider of llm.listConfigurableProviders()) {
    try {
      const models = await llm.listModels(provider.provider)
      for (const model of models) {
        out.push({ provider: provider.provider, model: model.id })
      }
    } catch {
      // A provider with no model directory simply contributes nothing.
    }
  }
  return out
}

/** The settings-page snapshot: profiles plus the picker metadata. */
export interface ProfilesSnapshot {
  profiles: SubagentProfile[]
  /** Available agent-preset ids. */
  presets: string[]
  /** Model picker options (provider-prefixed ids). */
  models: string[]
  /** Supported reasoning efforts. */
  efforts: string[]
}

export async function snapshotProfiles(ctx: Context, profiles: SubagentProfile[]): Promise<ProfilesSnapshot> {
  const presets = ctx.get('agentPresets') !== undefined
    ? (await ctx.agentPresets.list()).map((p) => p.id).sort()
    : []
  const models = (await collectModels(ctx)).map((m) => `${m.provider}/${m.model}`)
  return {
    profiles,
    presets,
    models,
    efforts: ['', 'off', 'high', 'max'],
  }
}
