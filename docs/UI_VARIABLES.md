# UI 变量说明

适用范围：`dsh-subagent-pool` 的客户端设置页。运行时颜色、文字与交互状态继续由 DeepSeek Harness 提供的 `--dsw-alias-*` 语义变量控制；本插件没有重定义它们，本次也没有新增颜色、字体或间距变量。

## 命名与层级

页面专属且需要统一控制的尺寸使用组件级变量；名称以 `subagent-pool` 开头，避免与宿主或其他插件冲突。宿主的 `--dsw-alias-*` 仍是语义层设计变量，本页只复用。

## 组件变量

| 变量 | 层级 | 当前值/引用 | 中文说明 | 来源 | 主要使用位置 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `--subagent-pool-settings-field-width` | 组件 | `280px` | 子代理编辑表单中可编辑控件的统一桌面宽度；窄容器可由 `flex-shrink` 收缩。 | `src/client/SubagentPoolPage.module.css` 的 `.wrap` | 名称、描述、模型、推理等级、预设 | 在用 |

## 宿主语义变量复用

`SubagentPoolPage.module.css` 继续复用 `--dsw-alias-border-l2`、`--dsw-alias-label-primary`、`--dsw-alias-label-secondary`、`--dsw-alias-label-dimmed`、`--dsw-alias-bg-module-platform`、`--dsw-alias-bg-layer-1`、`--dsw-alias-interactive-bg-hover`、`--dsw-alias-brand-primary` 与 `--dsw-alias-state-error-primary`。它们均由 Harness 主题提供，因此不在本插件重复声明。

## 合法硬编码例外

`280px` 是本设置页五个可编辑字段必须一致的组件尺寸，集中在上述变量声明；`0`、`auto`、百分比和由 flex 布局决定的值保留为布局逻辑，不作为设计 token。

## 同步记录

- 2026-08-17：新增 `--subagent-pool-settings-field-width: 280px`，使名称、描述、模型、推理等级和预设同宽；保留顶部“选择子代理”选择器的满行布局。已核对并继续复用现有 `--dsw-alias-*` 主题变量。
