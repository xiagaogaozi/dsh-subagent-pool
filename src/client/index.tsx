/** Browser plugin for dsh-subagent-pool: the 「子代理」 settings page. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Module-loading import: the settings-section slot lives in the shell contract.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { SubagentPoolPage } from './SubagentPoolPage.tsx'

/** Required services: slots (settings section registration). */
export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  // 「子代理」settings page: the named-subagent library editor.
  ctx.slots.inject('settings.section' as any, () => ctx.slots.register({
    name: 'settings.section' as any,
    id: 'subagent-pool',
    order: 51,
    label: () => '子代理',
  }, SubagentPoolPage))
}
