/**
 * 「子代理」settings page: manage the named-subagent library (name,
 * description, model, reasoning effort, and agent preset). The library lives
 * in the host `settings` service; this page talks to it through the same-origin
 * HTTP route registered by the host half.
 *
 * Layout follows the official Setting-Cell convention (16/0 rows, border-l2
 * hairlines, 14px titles, 36px selector pills backed by primitives `Menu`,
 * official `Icon*Outline*` glyphs, `--dsw-*` tokens only).
 * @module dsh-subagent-pool/client/SubagentPoolPage
 */
export declare function SubagentPoolPage(): JSX.Element;
