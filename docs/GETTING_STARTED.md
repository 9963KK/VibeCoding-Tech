# 快速开始指南

本指南帮助你在 5 分钟内开始使用 JVibe。

---

## 前置条件

- Node.js >= 16.0.0
- Claude Code 或 OpenCode 已安装

---

## ⚠️ 重要：选择初始化方式

JVibe 提供 **两种初始化方式**，根据你的需求选择其中一种：

### 方式 1：CLI 初始化（推荐）

**适用场景**：新项目、需要快速开始

默认进入 TUI 配置向导，如需跳过请使用 `--no-ui`。

```bash
cd your-project
jvibe init
```

**特点**：
- ✅ 自动复制所有配置文件（agents、hooks、commands）
- ✅ 创建完整的文档结构（Core + Project）
- ✅ 一次性完成所有设置

---

### 方式 2：Claude/OpenCode 命令初始化

**适用场景**：现有项目、需要 AI 引导式创建文档

```bash
# 在 Claude Code 中运行
/JVibe:init

# 在 OpenCode 中运行
/jvibe-init
```

**特点**：
- 🤖 AI 引导式询问（项目名称、类型、技术栈）
- 🤖 AI 自动分析并规划模块架构
- 🤖 根据需求生成定制化文档

---

### ❌ 注意事项

- **不要同时使用两种方式**，会造成重复文档生成
- 如果已运行 `jvibe init`，无需再执行 `/JVibe:init` 或 `/jvibe-init`
- 如果已执行 `/JVibe:init` 或 `/jvibe-init`，无需再运行 `jvibe init`

---

## 使用方式 1：CLI 初始化

### 1. 安装 JVibe

```bash
# 全局安装
npm install -g jvibe

# 或使用 npx（无需安装）
npx jvibe init
```

### 2. 进入项目目录

```bash
cd your-project
```

### 3. 运行初始化命令

```bash
# 进入 TUI 配置（推荐）
jvibe

# 或者
jvibe setup

# 跳过 TUI，直接初始化
jvibe init --no-ui

# Claude Code 适配（直连）
jvibe init --adapter=claude --no-ui

# OpenCode 适配（直连）
jvibe init --adapter=opencode --no-ui

# 同时适配 Claude Code + OpenCode（直连）
jvibe init --adapter=both --no-ui
```

这会创建：
- `.claude/` - Claude Code 配置（Agents、Commands、Hooks，可选）
- `.opencode/` - OpenCode 配置（Agents、Commands，可选）
- `docs/core/` - 4 个核心文档
- `docs/project/` - 项目文档目录
- `docs/.jvibe/tasks.yaml` - 任务交接文件（单文件协作）
- `.jvibe-state.json` - 项目状态标记文件（自动管理，不需要提交到 Git）

---

## 使用方式 2：Claude/OpenCode 命令初始化

### 1. 启动 Claude Code 或 OpenCode

```bash
cd your-project
claude

# 或
opencode
```

### 2. 运行初始化命令

```bash
/JVibe:init
```

这会询问你：
- 项目名称
- 技术栈
- 初始模块

并自动填充核心文档的内容。

**关于会话启动优化**：
- 首次初始化后，会显示欢迎信息和使用提示
- 后续会话只显示项目统计数据，节省 Token 消耗
- 状态信息存储在 `.jvibe-state.json`（已加入 .gitignore，无需担心误提交）

---

## 开始开发

### 添加新功能

直接用自然语言描述你的需求：

```
"添加用户登录功能"
```

JVibe 会自动：
1. 调用 `planner` agent 分析需求
2. 在功能清单中创建 F-XXX 条目
3. 生成 TODO 列表

### 实现功能

```
"实现 F-001 用户登录功能"
```

JVibe 会调用 `developer` agent 完成代码实现。

### 查看状态

```bash
# Claude Code
/JVibe:status

# OpenCode
/jvibe-status
```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `/JVibe:init` / `/jvibe-init` | 初始化项目文档 |
| `/JVibe:status` / `/jvibe-status` | 查看项目状态 |
| `/JVibe:pr` / `/jvibe-pr` | 生成 PR 描述 |

---

## 下一步

- 阅读 [CLI 命令参考](CLI_COMMANDS.md)
- 了解 [CORE vs PROJECT 文档](CORE_VS_PROJECT_DOCS.md)
- 查看 [架构说明](ARCHITECTURE.md)
