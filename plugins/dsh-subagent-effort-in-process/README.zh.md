# @deepseek-ai/dsh-subagent-effort-in-process

[English](README.md) | 中文

effort 后端在当前进程内运行每个子 agent，行为与 [spawn 后端](../subagent-spawn-in-process/README.zh.md)完全一致，并额外把调用方请求的思考等级应用到子 agent 的每一次模型请求。

## 行为

`start(request)` 以空 seed 委托给 [`startInProcessRun`](../subagent-in-process-driver/README.zh.md)，并在返回前等待发布完成。子 agent 获得父级的工作目录／会话谱系，除非被覆盖，否则继承父级模型，但以空对话开始。共享驱动负责深度检查、persona 与工具过滤设置、结构化输出、必需信号取消、单次执行、结果读取与静默释放。

本插件还额外监听 `agent/request` 水瀑：当发起请求的 agent 在 `AgentOptions.reasoningEffort` 中设置了思考等级、且当前提案没有显式思考等级时，把该值注入派发前的调用配置。随后所路由的适配器会按模型能力校验它（任何模型请求之前以 `UNSUPPORTED_REASONING_EFFORT` 失败），并把生效值记录到子 agent 的 `request/header`，因此后续步骤与冷恢复都会保留它。显式提案的思考等级——来自 header 恢复或另一个 `agent/request` 监听器——始终优先。

`dsh-tool-subagent` 会把模型传入的 `reasoning_effort` 工具参数以 `AgentOptions.reasoningEffort` 的形式转发到它启动的每次委托上，这正是调用方按次请求思考等级的方式。通过其他任何路径创建的子 agent 只要不带该选项，就不受影响。

## 能力

effort 复用 spawn 的 provider 类，因此宣称相同的 `{ outputSchema: true, depthLimit: true, toolFilter: true, persona: true }`，并在子 agent 的创建窗口强制执行全部四项特性。

## 配置

| 键 | 含义 |
|---|---|
| `providerName` | 注册到 `ctx.subagents` 的名称（默认 `spawn-effort`）。 |
| `toolName` | 面向模型的委托工具名（默认 `subagent_effort`）。 |
| `listToolName` | 面向模型的模型列表工具名（默认 `list_models`）。 |

## 模型体验

### 包工具

#### 模型看到什么

两个工具把调用方选择的子代理路由信息传递出来。`subagent_effort` 委托一项自包含任务，可带 `model` 与 `reasoning_effort`（`run_in_background: true` 会返回可用 `job_output` 收集、用 `job_kill` 停止的 job id）：`model` 指定路由公布的模型 id（省略则继承父会话模型），`reasoning_effort` 选择 `off`／`low`／`high`／`max`（省略则用所路由模型的默认值）。`list_models` 通过 `ctx.llm.listModels` 列出某个 provider 路由当前公布的模型 id（仅供参考：路由可能接受未列出的 id），默认使用调用 agent 自身的路由；调用方用这些 id 作为委托工具的 `model` 参数。

#### Token 影响

每个工具为每个父级请求增加固定的 schema token 开销；子代理的路由模型与等级只改变请求标量，不改变提示词或 schema token。

#### KV Cache 影响

工具名、描述与 schema 不变时前缀稳定；一次委托的模型／等级选择不会改变父级或子级的请求前缀。

### 子 agent 请求

### 子 agent 请求

#### 模型看到什么

全新子 agent 原样收到独立任务内容，默认继承父级模型与工作目录，并看到全局提示词与任何已配置的子级 persona 遮蔽。当父级工具调用请求了思考等级时，该值会应用到子 agent 的每一次模型请求并记录在它的请求 header 中；否则子 agent 运行在所路由模型的默认值上。

#### Token 影响

子 agent 为新独立上下文与历史付费；父级历史 token 不重复。请求的思考等级只改变每次子请求的推理预算，不影响提示词或 schema token。

#### KV Cache 影响

与父级请求缓存相互独立。思考等级改变是记录在 header 中的请求标量；它不改变子 agent 的请求前缀。

### 父级工具结果（间接）

#### 模型看到什么

通过 `dsh-tool-subagent`，父级只收到子 agent 的最终输出或停止原因错误。

#### Token 影响

父级输入增加一份随数据变化、保留到压缩为止的结果。

#### KV Cache 影响

仅追加；新可见内容跟随可复用请求前缀，不会使既有 KV Cache 条目失效。

## 已知限制与后续工作

- **思考等级只随 `AgentOptions` 传递**——监听只注入 `AgentOptions.reasoningEffort`；不带该选项直接创建的子 agent 保持所路由模型的默认值，本包不提供部署级默认值（由所路由适配器自身的默认值生效）。
- **监听不按 provider 隔离**——加载本包即对每个携带该选项的 agent 开启透传，无论它由哪个 provider 启动。`spawn-effort` provider 名的存在是为了让组合把感知思考等级的委托路由到独立后端；其运行行为与 `spawn` 一致。
