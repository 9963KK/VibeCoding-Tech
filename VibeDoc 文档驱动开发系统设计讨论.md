# VibeDoc 文档驱动开发系统设计讨论

> 本文档记录了关于如何设计一套外置规范系统，使其能够在 Vibe Coding 过程中自动化运行的完整讨论。

------

## 目录

1. [背景与问题](https://claude.ai/chat/dea68fc0-8ead-43a6-99bc-d9bfee1c5dff#1-背景与问题)
2. [参考项目分析：OpenSpec 与 BMAD](https://claude.ai/chat/dea68fc0-8ead-43a6-99bc-d9bfee1c5dff#2-参考项目分析openspec-与-bmad)
3. [VibeDoc 系统架构设计](https://claude.ai/chat/dea68fc0-8ead-43a6-99bc-d9bfee1c5dff#3-vibedoc-系统架构设计)
4. [文档自动更新机制分析](https://claude.ai/chat/dea68fc0-8ead-43a6-99bc-d9bfee1c5dff#4-文档自动更新机制分析)
5. [Claude Code Sub-Agent 能力](https://claude.ai/chat/dea68fc0-8ead-43a6-99bc-d9bfee1c5dff#5-claude-code-sub-agent-能力)
6. [Sub-Agent 架构设计](https://claude.ai/chat/dea68fc0-8ead-43a6-99bc-d9bfee1c5dff#6-sub-agent-架构设计)
7. [Planner 定位与简化方案](https://claude.ai/chat/dea68fc0-8ead-43a6-99bc-d9bfee1c5dff#7-planner-定位与简化方案)
8. [Hooks 设计](https://claude.ai/chat/dea68fc0-8ead-43a6-99bc-d9bfee1c5dff#8-hooks-设计)
9. [完整项目结构](https://claude.ai/chat/dea68fc0-8ead-43a6-99bc-d9bfee1c5dff#9-完整项目结构)

------

## 1. 背景与问题

### 用户已设计的文档体系

用户已经设计了一套完整的文档体系，包含四个核心文档：

| 文档         | 职责                                                |
| ------------ | --------------------------------------------------- |
| **规范文档** | 入口与索引，帮助 AI Agent 快速定位所需文档          |
| **项目文档** | 架构与模块边界，技术栈、模块清单、功能索引          |
| **功能清单** | 功能状态唯一来源(SoT)，每个功能的描述 + TODO + 状态 |
| **附加材料** | 规范索引，编码规范、技术细节、用户记忆              |

### 核心问题

> 现在文档基本设计完毕，但是如何让这个机制自动化地在 vibe coding 的过程中运行起来是个问题，该怎么设计机制呢？

用户希望参考 **OpenSpec** 和 **BMAD** 这类项目，作为一个外置的系统加载到编码工具中。

------

## 2. 参考项目分析：OpenSpec 与 BMAD

### OpenSpec

- **核心理念**：Spec-driven（规范驱动）
- **目录结构**：`openspec/specs/`（当前真相）+ `openspec/changes/`（提议更新）
- **工作流**：Proposal → Apply → Archive
- **安装方式**：`npm install -g @fission-ai/openspec` + `openspec init`
- **AI 入口**：`AGENTS.md` + 工具专属 slash commands
- **支持工具**：Claude Code、Cursor、Windsurf、Gemini CLI 等 20+ 工具

**关键特性**：

- 轻量级，无需 API keys
- Brownfield-first，适合修改现有功能
- 变更跟踪，proposals/tasks/spec deltas 放在一起

### BMAD (Breakthrough Method for Agile AI Driven Development)

- **核心理念**：Agent-driven（角色驱动）
- **架构**：BMad Core + BMad Method + BMad Builder
- **Agent 数量**：21 个专业 Agent（PM、Architect、Developer、UX Designer 等）
- **工作流**：50+ guided workflows，4 个阶段（Analysis → Planning → Solutioning → Implementation）
- **安装方式**：`npx bmad-method@alpha install`

**关键特性**：

- 重量级，完整的敏捷开发框架
- Scale-Adaptive Intelligence，从 bug fix 到企业级自动调整
- 支持自定义 Agent 和 Workflow

### 对比定位

| 维度     | OpenSpec     | BMAD             | 用户的文档体系             |
| -------- | ------------ | ---------------- | -------------------------- |
| 核心理念 | Spec-driven  | Agent-driven     | **Doc-driven（文档驱动）** |
| 复杂度   | 轻量         | 重量级           | 中等                       |
| 学习曲线 | 低           | 高               | 中                         |
| 适用场景 | 新功能规范化 | 完整项目生命周期 | Vibe Coding 日常开发       |

------

## 3. VibeDoc 系统架构设计

### 设计理念

```
OpenSpec: "先定义 Spec，再写代码"
BMAD:     "用专业 Agent 角色协作完成任务"
VibeDoc:  "用结构化文档体系驱动 AI 开发"
          - 规范文档 = AI 的入口和导航
          - 项目文档 = AI 理解架构的地图
          - 功能清单 = AI 的任务清单 (SoT)
          - 附加材料 = AI 的规范约束库
```

### 目录结构设计

```
📁 项目根目录/
├── 📄 AGENTS.md                    # AI Agent 统一入口（OpenSpec 风格）
├── 📄 CLAUDE.md                    # Claude Code 专属（自动加载）
├── 📄 .cursorrules                 # Cursor 专属（自动加载）
│
├── 📁 .vibedoc/                    # 工具专属配置目录
│   ├── 📁 commands/                # Slash commands（工具专属）
│   │   ├── 📁 claude-code/
│   │   │   ├── feature-new.md
│   │   │   ├── feature-complete.md
│   │   │   └── doc-sync.md
│   │   ├── 📁 cursor/
│   │   └── 📁 windsurf/
│   └── 📄 config.json              # VibeDoc 配置
│
├── 📁 docs/                        # Core 文档体系
│   ├── 📄 规范文档.md
│   ├── 📄 项目文档.md
│   ├── 📄 功能清单.md
│   ├── 📄 附加材料.md
│   └── 📁 project/                 # Project 文档（按需）
│
└── 📁 scripts/                     # 自动化脚本
    ├── 📄 sync-stats.js
    └── 📄 validate-docs.js
```

### CLI 命令设计

```bash
# 初始化
vibedoc init
vibedoc init --tools cursor,claude-code

# 功能管理
vibedoc feature new "用户登录"
vibedoc feature complete F-001
vibedoc feature list

# 文档操作
vibedoc sync
vibedoc validate
vibedoc show F-001

# 工具配置
vibedoc update
vibedoc tools add windsurf
```

------

## 4. 文档自动更新机制分析

### 核心问题

> 单纯通过 prompt 的方式就能让 AI 自己去执行完任务就更新吗？

### LLM 能力边界

| 操作类型         | 纯 Prompt 能做到吗？   | 实际情况                     |
| ---------------- | ---------------------- | ---------------------------- |
| 读取文档内容     | ✅ 能（如果在上下文中） | AI 可以理解文档结构          |
| 理解应该做什么   | ✅ 能                   | AI 可以根据规范文档理解流程  |
| 生成修改后的内容 | ✅ 能                   | AI 可以输出修改后的 markdown |
| **实际写入文件** | ❌/✅                    | 需要文件操作能力             |
| **主动触发更新** | ❌                      | AI 是被动响应的              |

**关键认知**：

```
LLM 本身是 "无状态 + 无副作用" 的

• 它不会 "记住" 上次对话中更新了什么
• 它不会 "主动" 在任务完成后去更新文档
• 它需要 "工具" 才能真正修改文件系统
```

### 不同 AI 工具的能力

| AI 工具         | 文件读取 | 文件写入 | 主动触发 |
| --------------- | -------- | -------- | -------- |
| ChatGPT (Web)   | ❌        | ❌        | ❌        |
| Claude (Web)    | ✅ 上传   | ❌        | ❌        |
| **Cursor**      | ✅        | ✅        | ❌        |
| **Claude Code** | ✅        | ✅        | ❌        |
| **Windsurf**    | ✅        | ✅        | ❌        |

### 三种自动化策略

#### 策略 1：Prompt 引导

在 Prompt/规范文档中写明"完成 X 后必须更新 Y"，AI 在同一个对话回合中完成。

**效果**：只在当前对话回合有效，依赖 AI 的遵从性。

#### 策略 2：Slash Command 显式触发

用户主动调用命令，AI 按预设流程执行更新。

```
/vibedoc:feature-complete F-001
```

**效果**：需要主动调用，但调用后按预设流程执行。

#### 策略 3：CLI 脚本 + Git Hooks

不依赖 AI 的"记忆"，用确定性的脚本在特定时机执行。

**效果**：完全自动，无需 AI 参与。

### 推荐的混合策略

| 操作               | 推荐策略        | 原因                        |
| ------------------ | --------------- | --------------------------- |
| 创建功能条目       | Slash Command   | 需要 AI 理解需求并生成 TODO |
| 更新 TODO checkbox | Prompt 引导     | 在开发过程中自然完成        |
| 更新功能状态       | CLI 脚本 + Hook | 可从 TODO 完成情况推导      |
| 同步统计数据       | CLI 脚本        | 纯计算，不需要 AI           |
| 检查规范命中       | Slash Command   | 需要 AI 理解代码变更        |

------

## 5. Claude Code Sub-Agent 能力

### 核心特性

| 特性           | 说明                                                   |
| -------------- | ------------------------------------------------------ |
| **独立上下文** | 每个 Sub-Agent 有自己的上下文窗口，不会污染主对话      |
| **自动委派**   | Claude 根据 `description` 字段自动选择合适的 Sub-Agent |
| **显式调用**   | 可以手动指定："Use the xxx subagent to..."             |
| **工具限制**   | 可以限制每个 Sub-Agent 可用的工具（只读/可写等）       |
| **可恢复**     | Sub-Agent 可以通过 `agentId` 恢复之前的对话            |
| **链式调用**   | 可以串联多个 Sub-Agent 完成复杂工作流                  |

### 文件位置和格式

```
.claude/agents/           # 项目级（优先级最高）
~/.claude/agents/         # 用户级（全局可用）
---
name: agent-name
description: 何时调用此 agent（Claude 据此自动委派）
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet  # sonnet/opus/haiku/inherit
permissionMode: default
skills: skill1, skill2
---

这里是 System Prompt...
```

### 内置 Sub-Agent

| Agent               | 用途              | Model  |
| ------------------- | ----------------- | ------ |
| **General-purpose** | 复杂多步骤任务    | Sonnet |
| **Plan**            | Plan 模式下的研究 | Sonnet |
| **Explore**         | 只读搜索和分析    | Haiku  |

------

## 6. Sub-Agent 架构设计

### 初始 4 Agent 设计

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VibeDoc Sub-Agent 架构                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                      ┌─────────────────────┐                           │
│                      │   主 Agent (Claude)  │                           │
│                      │   • 接收用户请求     │                           │
│                      │   • 协调 Sub-Agent   │                           │
│                      │   • 汇总结果        │                           │
│                      └──────────┬──────────┘                           │
│                                 │                                       │
│              ┌──────────────────┼──────────────────┐                   │
│              │                  │                  │                   │
│              ▼                  ▼                  ▼                   │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐    │
│  │  planner-agent    │ │  developer-agent  │ │  reviewer-agent   │    │
│  │  (规划者)          │ │  (开发者)          │ │  (审查者)          │    │
│  ├───────────────────┤ ├───────────────────┤ ├───────────────────┤    │
│  │ • 需求分析         │ │ • 代码实现         │ │ • 代码审查         │    │
│  │ • 功能拆解         │ │ • TODO 更新        │ │ • 规范检查         │    │
│  │ • 创建 F-XXX       │ │ • 测试编写         │ │ • PR 描述生成      │    │
│  │                   │ │                   │ │                   │    │
│  │ tools: Read, Grep │ │ tools: ALL        │ │ tools: Read, Grep │    │
│  │ model: sonnet     │ │ model: inherit    │ │ model: sonnet     │    │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘    │
│              │                  │                  │                   │
│              └──────────────────┼──────────────────┘                   │
│                                 ▼                                       │
│                      ┌─────────────────────┐                           │
│                      │   doc-sync-agent    │                           │
│                      │   (文档同步)         │                           │
│                      ├─────────────────────┤                           │
│                      │ • 状态同步           │                           │
│                      │ • 统计推导           │                           │
│                      │ • 格式检查           │                           │
│                      │                     │                           │
│                      │ tools: Read, Write  │                           │
│                      │ model: haiku        │                           │
│                      └─────────────────────┘                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

------

## 7. Planner 定位与简化方案

### 项目不同阶段的规划需求

| 阶段                       | 规划需求                                         | 执行者               |
| -------------------------- | ------------------------------------------------ | -------------------- |
| **阶段 1: 项目初期 (0→1)** | 整体架构设计、模块划分、核心功能清单、技术栈选型 | 人工 + Opus 深度思考 |
| **阶段 2: 持续开发 (1→N)** | 新增小功能、Bug 修复转功能、用户反馈转需求       | Planner Sub-Agent    |

### Planner 的真正价值

| 场景             | 是否需要 Planner | 原因                           |
| ---------------- | ---------------- | ------------------------------ |
| 项目初期整体规划 | ❌ 不需要         | 用 Opus + 人工深度思考         |
| 新增独立小功能   | ✅ 需要           | 快速创建 F-XXX，不污染主上下文 |
| Bug 转功能       | ✅ 需要           | 规范化记录到功能清单           |
| 重构/优化        | ✅ 需要           | 拆解成可追踪的 TODO            |
| 紧急修复         | ❌ 不需要         | 直接 Developer 处理            |

### 简化方案：3 Agent 架构

将 Planner 合并到 Developer：

```
┌─────────────────────────────────────────────────────────────────────────┐
│  简化后的 3 Agent 架构                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   developer     │  │    reviewer     │  │    doc-sync     │         │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤         │
│  │ • 创建功能条目   │  │ • 代码审查      │  │ • 状态同步      │         │
│  │ • 代码实现      │  │ • 规范检查      │  │ • 统计更新      │         │
│  │ • TODO 更新     │  │ • PR 描述       │  │ • 格式检查      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

------

## 8. Hooks 设计

### Claude Code Hooks 事件类型

| 事件类型           | 触发时机        | 用途                 |
| ------------------ | --------------- | -------------------- |
| `PreToolUse`       | 工具执行前      | 验证、拦截、修改输入 |
| `PostToolUse`      | 工具执行后      | 格式化、审计、通知   |
| `Stop`             | Agent 完成响应  | 运行测试、同步状态   |
| `SubagentStop`     | Sub-Agent 完成  | 汇总结果、触发下一步 |
| `UserPromptSubmit` | 用户提交 prompt | 注入上下文、验证输入 |
| `SessionStart`     | 会话开始        | 加载项目上下文       |
| `SessionEnd`       | 会话结束        | 清理、日志记录       |

### 配置位置

```
~/.claude/settings.json          # 全局
.claude/settings.json            # 项目级
.claude/settings.local.json      # 项目级（不提交 git）
```

### 推荐的 Hooks 配置

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/sync-feature-status.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/on-subagent-complete.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/sync-stats.sh"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/load-context.sh"
          }
        ]
      }
    ]
  }
}
```

### Hook 脚本：sync-feature-status.sh

```bash
#!/bin/bash
# 当 docs/功能清单.md 被修改时，自动同步功能状态
# 触发: PostToolUse (Edit|Write)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# 只处理功能清单文件
if [[ "$FILE_PATH" != *"功能清单.md" ]]; then
  exit 0
fi

# ... 根据 TODO 完成情况推导状态并更新 ...
```

### Hook 脚本：sync-stats.sh

```bash
#!/bin/bash
# Agent 完成工作后，同步项目文档的统计数据
# 触发: Stop

# 统计各模块功能数量，生成统计表
# 输出到终端供参考
```

### Hooks vs Sub-Agent 分工

| 任务         | 用 Hooks | 用 Sub-Agent | 原因             |
| ------------ | -------- | ------------ | ---------------- |
| 功能状态同步 | ✅        | ❌            | 纯计算，确定性   |
| 统计数据更新 | ✅        | ❌            | 纯计算，确定性   |
| 格式检查     | ✅        | ❌            | 正则匹配，确定性 |
| 创建功能条目 | ❌        | ✅            | 需要理解需求     |
| 代码实现     | ❌        | ✅            | 需要上下文理解   |
| 代码审查     | ❌        | ✅            | 需要规范理解     |
| PR 描述生成  | ❌        | ✅            | 需要变更理解     |

**原则**：

- 确定性操作 → Hooks（快、可靠）
- 需要理解的操作 → Sub-Agent（智能、灵活）

------

## 9. 完整项目结构

```
📁 项目根目录/
├── 📄 CLAUDE.md                    # AI Agent 入口
│
├── 📁 .claude/
│   ├── 📄 settings.json            # Hooks 配置
│   │
│   ├── 📁 agents/                  # Sub-Agents
│   │   ├── 📄 developer.md         # 开发者（含功能创建）
│   │   ├── 📄 reviewer.md          # 审查者
│   │   └── 📄 doc-sync.md          # 文档同步
│   │
│   └── 📁 hooks/                   # Hook 脚本
│       ├── 📄 sync-feature-status.sh
│       ├── 📄 sync-stats.sh
│       ├── 📄 on-subagent-complete.sh
│       └── 📄 load-context.sh
│
├── 📁 docs/                        # 文档体系
│   ├── 📄 规范文档.md
│   ├── 📄 项目文档.md
│   ├── 📄 功能清单.md
│   └── 📄 附加材料.md
│
└── 📁 src/                         # 源代码
```

------

## 总结

### 关键设计决策

| 问题           | 决策                                | 理由                          |
| -------------- | ----------------------------------- | ----------------------------- |
| 外置系统参考   | OpenSpec + BMAD 混合                | 取长补短                      |
| Sub-Agent 调用 | 利用 Claude Code 原生能力           | 独立上下文、自动委派          |
| 上下文隔离     | 物理隔离（多会话）+ Story File      | 简单可靠                      |
| Agent 数量     | 3 个（Developer/Reviewer/Doc-Sync） | 平衡功能和复杂度              |
| Planner 定位   | 合并到 Developer                    | 项目初期用 Opus，后期快速拆解 |
| 自动化         | Hooks 处理确定性计算                | 可靠性 > AI 遵从性            |

### 工作流

```
1. 规划 (Opus + 人工 / Developer)
   └→ 创建 F-XXX 功能条目

2. 开发 (Developer Sub-Agent)
   └→ 实现代码 + 更新 TODO
   └→ [Hook] 自动同步功能状态

3. 审查 (Reviewer Sub-Agent)
   └→ 代码审查 + 规范检查

4. 同步 (Hooks)
   └→ [Stop Hook] 统计更新
```

------

*文档生成时间：2026-01-10*