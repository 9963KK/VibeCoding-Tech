# Tools & Plugins（工具与插件）

本文件定义 JVibe 的 **Tools**（能力）与 **Plugins**（扩展单元）概念，并给出最小可落地的配置骨架，便于后续演进为完整插件系统。

---

## 术语

- **Tool**：面向 AI Agent 的"能力点"（例如：数据库、容器、云服务、测试、设计协作）。
- **Plugin**：可安装/可配置的扩展单元，用来实现并交付一个或多个 Tool。Plugin 不绑定某种协议或运行形态。
- **Integration（集成方式）**：Plugin 的具体接入形态（例如：`mcp`、`skill`、`daemon`、`http-api`、`sdk` 等）。

> 对外（用户视角）只谈 Tools；对内（实现与分发）用 Plugins。

---

## 分类

- **Core Tools**：默认启用的基础能力域（固定、少而稳）。
- **Project Tools**：项目按需启用，按能力域自选。

---

## Core Tools（5 个）

| 能力域 | 工具 | Plugin Integration |
| --- | --- | --- |
| Memory/上下文 | Serena | `mcp` |
| 文件系统 | Filesystem MCP | `mcp` |
| 代码托管 | GitHub MCP | `mcp` |
| 文档查询 | Context7 | `mcp` |
| 浏览器自动化 | Agent Browser | `skill` |

> **注意**：联网搜索未列入 Core Tools，因为大部分代码工具已内置 WebSearch 能力。
>
> **Agent Browser** 为 `skill` 形态：`jvibe plugins core` 会自动下载 SKILL.md 到 `.claude/skills/agent-browser/`，但需要用户手动全局安装 CLI：
> ```bash
> npm install -g agent-browser && agent-browser install
> ```

---

## Project Tools（按能力域分类）

### Database（数据库）

| 工具 | 说明 | 需要配置 |
| --- | --- | --- |
| PostgreSQL | PostgreSQL 数据库操作 | `POSTGRES_CONNECTION_STRING` |
| MySQL | MySQL 数据库操作 | `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` |
| MongoDB | MongoDB 数据库操作 | `MONGODB_URI` |
| Supabase | Supabase 数据库 + Auth + Storage | `SUPABASE_ACCESS_TOKEN` |
| Redis | Redis 缓存操作 | `REDIS_URL` |

### Container（容器）

| 工具 | 说明 | 需要配置 |
| --- | --- | --- |
| Docker | Docker 容器管理 | - |
| Kubernetes | Kubernetes 集群管理 | - |

### Cloud（云服务）

| 工具 | 说明 | 需要配置 |
| --- | --- | --- |
| AWS | AWS 云服务管理 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` |
| Google Cloud | GCP 云服务管理 | `GOOGLE_APPLICATION_CREDENTIALS` |
| Azure | Azure 云服务管理 | `AZURE_SUBSCRIPTION_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` |

### Testing（测试）

| 工具 | 说明 | 需要配置 |
| --- | --- | --- |
| Playwright | 浏览器自动化测试 | - |
| Puppeteer | Chrome 无头浏览器测试 | - |

### Frontend（前端）

| 工具 | 说明 | 需要配置 |
| --- | --- | --- |
| Chrome DevTools | Chrome 开发者工具调试 | - |

### Design（设计）

| 工具 | 说明 | 需要配置 |
| --- | --- | --- |
| Figma | Figma 设计文件操作 | 首次需在对话中执行 `set_api_key`（会持久化保存） |

### Communication（通信）

| 工具 | 说明 | 需要配置 |
| --- | --- | --- |
| Slack | Slack 消息与频道管理 | `SLACK_MCP_XOXB_TOKEN` |
| Discord | Discord 消息与服务器管理 | `DISCORD_BOT_TOKEN` |

### Docs（文档协作）

| 工具 | 说明 | 需要配置 |
| --- | --- | --- |
| Notion | Notion 页面与数据库操作 | `NOTION_TOKEN` |
| Confluence | Confluence 文档协作 | `CONFLUENCE_BASE_URL`, `CONFLUENCE_USER_EMAIL`, `CONFLUENCE_API_TOKEN` |

---

## 无感配置设计

### 配置流程

```
1. 用户在 TUI 中选择需要的 Project Tools
2. 系统自动检测环境变量是否已配置
3. 已配置 → 直接写入 MCP Server 配置
4. 未配置 → 提示用户设置环境变量
```

### 配置文件

| 文件 | 作用 | 是否提交 |
| --- | --- | --- |
| `docs/.jvibe/plugins.yaml` | 声明启用哪些插件 | ✅ 提交 |
| `.claude/settings.local.json` | MCP Server 配置 + 敏感信息 | ❌ gitignore |

### plugins.yaml 示例

```yaml
version: 1

core_plugins:
  - serena
  - filesystem-mcp
  - github-mcp
  - context7
  - agent-browser

project_plugins:
  - postgres-mcp
  - docker-mcp
  - playwright-mcp
```

---

## 插件清单（Plugin Registry）

JVibe 维护一份工具库清单（`lib/plugins/registry.json`），用于：
- 提供可选插件的 **元数据**（能力域/权限/依赖/安装方式）
- 支持项目侧"选择启用哪些 Project Tools"
- 提供完整的 MCP Server 配置模板

### Plugin 字段

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定 ID（slug） |
| `name` | 展示名 |
| `category` | 能力域 |
| `description` | 简短描述 |
| `integration.type` | `mcp` / `skill` / `daemon` / `daemon+skill` |
| `claude.mcpServer` | MCP Server 配置模板 |
| `requires.env[]` | 需要的环境变量（只声明 key） |
| `default_tier` | `core` / `project` |

---

## 使用方式

### TUI 配置（推荐）

```bash
jvibe setup
# Step 3: Project Plugins → 选择需要的工具
```

### CLI 配置

```bash
# 配置 Core Tools
jvibe plugins core

# Project Tools 的 CLI 管理（list/add/sync）仍在规划中
# 当前建议通过 TUI（jvibe setup）写入 docs/.jvibe/plugins.yaml，
# 然后由用户手动完成对应 MCP Server 的安装/配置。
```

### 手动配置

1. 编辑 `docs/.jvibe/plugins.yaml`，添加插件 ID 到 `project_plugins`
2. 当前需手动把对应 MCP Server 配置写入 `.claude/settings.local.json`（同步命令仍在规划中）

---

## 环境变量配置

对于需要 API Key 的插件，建议在 shell 配置文件中设置环境变量：

```bash
# ~/.zshrc 或 ~/.bashrc
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxx"
export POSTGRES_CONNECTION_STRING="postgresql://user:pass@localhost:5432/db"
export NOTION_TOKEN="ntn_xxxx"
```

在执行 `jvibe setup` / `jvibe plugins core` 时，JVibe 会读取当前进程的环境变量，并在写入 `.claude/settings.local.json` 时自动填充；若缺失会在输出中提示需要配置的变量。
