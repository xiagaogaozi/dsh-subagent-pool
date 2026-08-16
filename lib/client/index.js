/** Browser plugin for dsh-subagent-pool: the 「子代理」 settings page. */
import { SubagentPoolPage } from "./SubagentPoolPage.js";
/** Required services: slots (settings section registration). */
export const inject = ['slots'];
export function apply(ctx) {
    // 「子代理」settings page: the named-subagent library editor.
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'subagent-pool',
        order: 51,
        label: () => '子代理',
    }, SubagentPoolPage));
}
