# Tools & Plugins（工具与插件）

本文件定义 JVibe 的 **Tools**（能力）与 **Plugins**（扩展单元）概念，并给出最小可落地的配置骨架，便于后续演进为完整插件系统。

---

## 术语

- **Tool**：面向 AI Agent 的“能力点”（例如：搜索、项目记忆、文件系统、Git、文档查询、浏览器自动化）。
- **Plugin**：可安装/可配置的扩展单元，用来实现并交付一个或多个 Tool。Plugin 不绑定某种协议或运行形态。
- **Integration（集成方式）**：Plugin 的具体接入形态（例如：`mcp`、`skill`、`daemon`、`http-api`、`sdk` 等）。

> 对外（用户视角）只谈 Tools；对内（实现与分发）用 Plugins。

---

## 分类

- **Core Tools**：默认启用的基础能力域（固定、少而稳）。
- **Project Tools**：项目按需启用，从工具库（Plugin Registry）中选择。

---

## Core Tools（当前建议 6 个）

| 能力域 | 工具 | Plugin Integration |
| --- | --- | --- |
| Memory/上下文 | Serena | `mcp` |
| 联网搜索 | Brave Search | `mcp` |
| 文件系统 | Filesystem MCP | `mcp` |
| 代码托管 | GitHub MCP | `mcp` |
| 文档查询 | Context7 | `mcp` |
| 浏览器自动化 | Agent Browser | `daemon + skill` |

---

## 插件清单（Plugin Registry）

JVibe 维护一份工具库清单（Registry），用于：
- 提供可选插件的 **元数据**（能力域/权限/依赖/安装方式/健康检查）
- 支持项目侧“选择启用哪些 Project Tools”

建议先用离线 Registry 打底（例如：`lib/plugins/registry.json`），后续再演进到远端可更新。

### 最小字段建议

- `id`：稳定 ID（slug）
- `name`：展示名
- `category`：能力域（search/memory/fs/git/docs/browser…）
- `integration.type`：`mcp` | `skill` | `daemon` | `daemon+skill` | ...
- `requires.env[]`：需要的环境变量（只声明 key，不放 value）
- `install[]`：安装/启用步骤（可选）
- `healthcheck`：健康检查（可选）

---

## 项目侧配置（启用哪些插件）

建议在项目内放一个可提交的选择文件（只含“启用哪些插件”，不含敏感信息）：

- 路径：`docs/.jvibe/plugins.yaml`
- 语义：
  - `core_plugins`：固定 Core Tools 对应的插件（默认由模板提供）
  - `project_plugins`：项目自选插件列表

敏感配置（Token/Key）建议放在用户本地文件（例如：`.claude/settings.local.json`），避免进入仓库。

---

## 使用方式

- 当前版本：插件系统仍在规划中；TUI 仅负责生成 `docs/.jvibe/plugins.yaml` 骨架，不负责“更新已有项目的插件选择”（除非使用强制覆盖重置文件）。
- 如需调整 `project_plugins`，请直接手动编辑 `docs/.jvibe/plugins.yaml`（推荐）。
