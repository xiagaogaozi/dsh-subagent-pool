# dsh-subagent-pool

DeepSeek Harness 的**命名子代理池**插件：在设置页「子代理」维护一批可复用的子代理（每个 = 名字 + 描述 + 模型 + 推理等级 + 预设），主代理在对话中按描述判断"什么时候用谁"，用 `subagent_run(name, task)` 按名字调用——模型/推理等级/预设自动套用，调用即干活返回结果。

与 AgentTeams（团队模式）互补：子代理是**能力库**（导演-演员制的主线），团队是**协作组织**（任务/邮箱/成员直连）。

## 安装

```sh
dsh plugin --profile web add "file:local-plugins/<path>/<tarball>.tgz"
```

（或按部署习惯的本地 tarball 流程安装；插件含 host 与 client 两部分，装完重启 dsh。）

## 使用

1. 设置 → **子代理** → 添加（名字/描述/模型/推理等级/预设）→ 保存
2. 主代理的系统提示里会出现子代理目录（`{{subagentPool}}` 变量）
3. 需要时调用：`subagent_run(name="林晚", task="……")`

## 配置项语义

| 字段 | 说明 |
|---|---|
| 名称 | 唯一模板名，`subagent_run` 按它查找 |
| 描述 | 发给主代理：**什么时候才调用**（调度契约） |
| 模型 | 子代理模型覆盖（provider/model），空 = 跟随主代理 |
| 推理等级 | off / high / max，空 = 跟随模型默认 |
| 预设 | 子代理挂载的 agent preset，空 = 继承主代理 |

## 技术要点

- 设置页走同源 HTTP 路由（`/plugins/dsh-subagent-pool/profiles`）——`harness.handle` 私有桥只在动态插件 VM 可用，普通安装包不可用
- 预设挂载 = `recompose` + `agent-preset/selected` 会话事件（两步缺一不可，否则恢复时回退继承预设）
- 推理等级 = 子代理 ctx 上的 `agent/request` waterfall（与 DSH 官方 `installModelSelection` 同款）
- 调用形态：一次性（每次新会话，干完即弃）
- UI 全部使用官方 `dsh-client-ui-primitives` 组件与图标 + `--dsw-*` token

## License

MIT
