/** Browser plugin for dsh-subagent-pool: the 「子代理」 settings page. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services: slots (settings section registration). */
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
