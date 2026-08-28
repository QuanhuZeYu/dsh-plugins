# dsh 分享插件：model/effort 标签 + 子代理推理档位

> 本仓库公开分享两个 dsh 插件：**Per-message model/effort 标签**与**子代理 reasoning-effort 透传**。
> 安装：克隆仓库（或下载 ZIP）后按下方说明执行 `install.ps1` / `install.sh`。

本包包含两个 dsh（DeepSeek Harness）插件，来自源码工作区的手工挂载插件：

| 插件 | 包名 | 作用 | 运行时 |
|---|---|---|---|
| ui-model-effort-tag | `@deepseek-ai/dsh-client-ui-model-tag` | 显示 provider/模型 · effort：① 每条助手消息的操作条（复制按钮旁）；② 回合运行中的状态条（"Deep diving..." 旁，需配合官方 ui-conversation 补丁） | 浏览器（client 插件，host 侧仅占位） |
| subagent-effort-in-process | `@deepseek-ai/dsh-subagent-effort-in-process` | 子代理委托时透传 `reasoning_effort`（注册 spawn-effort provider，观察 agent/request） | host 进程 |

> 两个包均**未发布到 npm**，且不在官方 0.1.1-rc.2 发行版的依赖树中，所以随本包一起分发。
> `dsh-subagent-effort-in-process` 已做成**自包含**：包内 `node_modules/` 内嵌了运行所需的依赖闭包（12 个 `@deepseek-ai/*` 官方包 + `zod`），放到任何目录都能直接加载。
> **回合状态条标签依赖一个官方包补丁**：`patches/dsh-client-ui-conversation/` 是给 `dsh-client-ui-conversation` 的 client bundle 新增 `conversation.chat.turnStatus` 槽位的覆盖文件，安装脚本第 5 步会自动应用（覆盖前备份为 `.dshbak`）。只想用消息操作条标签的话，可以跳过第 5 步（脚本暂不支持跳过，手动安装时忽略该目录即可）。

---

## 前置要求

- dsh 版本 **0.1.1-rc.2**（`npm i -g @deepseek-ai/dsh@next`，或从 deepseek-harness 仓库源码运行，需与插件同代）。
- 已初始化过 `web` profile（至少成功启动过一次 GUI，保证 `~/.dsh/profiles/node_modules` 链接树已生成）。

## 安装（方法 A：自动脚本，推荐）

1. 解压本包到任意目录，进入解压目录。
2. **Windows**：`powershell -ExecutionPolicy Bypass -File .\install.ps1`
   **macOS / Linux**：`bash install.sh`

脚本做 5 件事（全部幂等，可重复执行）：

1. 探测 dsh 安装目录（`apps/cli/node_modules/@deepseek-ai`）；探测不到时用 `-AiDir <路径>`（Windows）或 `DSH_AI_DIR` 环境变量（mac/Linux）显式指定；
2. 把 `plugins/` 下两个包（含 effort 的内嵌依赖）复制进该目录；
3. 为浏览器插件在 `~/.dsh/profiles/node_modules/@deepseek-ai/` 建立 `dsh-client-ui-model-tag` 链接（client 半解析依赖它，见「原理」）；
4. 在 `~/.dsh/profiles/web/cordis.patch.yml` 末尾追加挂载行（若 id 已存在则跳过）；
5. 应用 `patches/` 里的 ui-conversation client bundle 补丁（覆盖前备份 `.dshbak`，幂等）。

完成后**重启 dsh**（先退出正在运行的实例）。

## 安装（方法 B：手动）

1. 把 `plugins/dsh-client-ui-model-tag`、`plugins/dsh-subagent-effort-in-process` 两个目录复制到 dsh 安装树的 `apps/cli/node_modules/@deepseek-ai/` 下；
2. 若你的发行版 web-app 依赖里没有 `dsh-client-ui-model-tag`（npm 版 0.1.1-rc.2 就是），还需在 `~/.dsh/profiles/node_modules/@deepseek-ai/` 下建一个指向步骤 1 目录的链接（Windows：`cmd /c mklink /J ...`；mac/linux：`ln -s`）；
3. 在 `~/.dsh/profiles/web/cordis.patch.yml` 末尾追加（已有 `- insert:` 块就把两个条目并入）：

```yaml
- insert:
    - id: ui-model-effort-tag
      name: '@deepseek-ai/dsh-client-ui-model-tag'
    - id: subagent-effort-in-process
      name: '@deepseek-ai/dsh-subagent-effort-in-process'
```

4. 重启 dsh。

> **不想动安装树？** effort 插件是自包含的，可放任意目录并把它的 name 改为 `file://<绝对路径>/dsh-subagent-effort-in-process/lib/index.js`（host 半支持 file 形式）。turnStatus 标签的官方包补丁需要覆盖安装树中的 `dsh-client-ui-conversation/lib/client.js`，升级 dsh 后需重新执行安装脚本。
> **ui-model-tag 必须用包名（裸名）**：浏览器半由 `dsh-client-modules` 用 `createRequire(profile根).resolve('<包名>/package.json')` 定位，Loader 行用包名才有效，所以它必须落在能被解析到的位置。

## 验证

- 重启后打开一个会话：任何一条助手消息旁应出现模型/effort 标签（如 `newapi/deepseek-v4-flash · max`）；回合运行时，"Deep diving..." 状态条旁也会显示同款标签。
- 子代理：在 `run_code` 里调用 `tools.subagent({ reasoning_effort: 'high', ... })`，观察子代理实际使用的推理档位。
- 设置页 →「插件清单」应能看到两行：`ui-model-effort-tag`、`subagent-effort-in-process`。

## 卸载

- 从 `~/.dsh/profiles/web/cordis.patch.yml` 删除两行 insert（或加 `- id: xxx` + `disabled: true`）。
- 删除安装树里的两个包目录与 profiles 树里的链接。
- 恢复 ui-conversation 补丁：把安装树 `dsh-client-ui-conversation/lib/client.js`（及其 .map）旁边的 `.dshbak` 文件改回原名覆盖，删除 `.dshbak`。
- 重启 dsh。

## 原理简述

dsh 插件树 = profile 根 `cordis.yml`（空）→ bundle 层（`dsh-base` / `dsh-web-app` 各自 `cordis.patch.yml`）→ 用户层 `~/.dsh/profiles/web/cordis.patch.yml`。host 插件用动态 `import()` 从包位置向上解析依赖；浏览器插件由 `dsh-client-modules` 扫描 Loader 行中声明 `dsh.client` 的包，从 `~/.dsh/profiles/node_modules` 解析 package.json 并挂 `/plugins/<id>/client.js`。两个插件恰好分别命中这两类机制的落位要求。

## 第三方许可

- `plugins/dsh-subagent-effort-in-process/node_modules/` 内嵌的 `@deepseek-ai/*` 官方包（cordis、cosmokit、schemastery、dsh-tools 等）均为 **MIT** 许可，版权归 deepseek-ai（来自 deepseek-harness 仓库，包内 package.json 已保留 license 字段）。
- 内嵌 `zod` 为 **MIT** 许可（colinhacks），包内保留其 LICENSE 文件。
- 本仓库自身的《LICENSE》覆盖两个插件的源码与编排文件（MIT）。

## 包内容

```
dsh-plugins-share/
├── README.md
├── install.ps1        # Windows 安装脚本
├── install.sh         # macOS / Linux 安装脚本
├── cordis.patch.example.yml
├── patches/
    │   └── dsh-client-ui-conversation/ # ui-conversation client bundle 补丁（turnStatus 槽位）
└── plugins/
    ├── dsh-client-ui-model-tag/        # package.json + lib/（含 client.js 与类型）
    └── dsh-subagent-effort-in-process/ # 自包含：package.json + lib/ + node_modules/（依赖闭包）+ README
```
