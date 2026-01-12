# JVibe

> 文档驱动的 AI 辅助开发系统

[![npm version](https://badge.fury.io/js/jvibe.svg)](https://badge.fury.io/js/jvibe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 什么是 JVibe？

JVibe 是一个**文档驱动的 AI 辅助开发系统**，专为 Claude Code 设计。它提供：

- 🤖 **4 个专业 Agent**：需求规划、代码开发、代码审查、文档同步
- 📝 **结构化文档体系**：CORE-DOCS（4个核心文档）+ PROJECT-DOCS（按需扩展）
- 🔄 **自动化 Hooks**：自动加载上下文、同步功能状态、输出统计信息
- 🎯 **单一事实来源**：功能状态只在功能清单中维护（SoT 原则）

---

## 🚀 快速开始

### 两种初始化方式

JVibe 提供两种初始化方式，根据你的需求选择：

#### 方式 1：CLI 初始化（推荐）

**适用场景**：新项目、需要完整的文件结构

```bash
# 全局安装
npm install -g jvibe

# 初始化项目
cd your-project
jvibe init
```

**特点**：
- ✅ 自动复制所有配置文件（agents、hooks、commands）
- ✅ 创建完整的文档结构（Core + Project）
- ✅ 一次性完成所有设置

---

#### 方式 2：Claude Code Skill 初始化

**适用场景**：现有项目、需要 AI 引导式创建文档

```bash
# 在 Claude Code 中运行
/JVibe:init
```

**特点**：
- 🤖 AI 引导式询问（项目名称、类型、技术栈）
- 🤖 AI 自动分析并规划模块架构
- 🤖 根据需求生成定制化文档
- ⚠️ **注意**：如果已运行 `jvibe init`，无需再执行此命令

---

### 选择哪种方式？

| 你的情况 | 推荐方式 | 原因 |
|---------|---------|------|
| 全新项目 | CLI 初始化 | 一次性获得完整配置 |
| 已有项目，想试用 JVibe | Claude Code Skill | AI 引导更友好 |
| 需要快速开始 | CLI 初始化 | 无需手动配置 |
| 需要定制化文档 | Claude Code Skill | AI 根据需求生成 |

---

### 开始使用

初始化完成后，在 Claude Code 中使用：

```bash
/JVibe:status   # 查看项目状态
/JVibe:keepgo   # 自动推进下一步任务
/JVibe:pr       # 生成 PR 描述
```

---

## 📂 项目结构

运行 `jvibe init` 后，你的项目将包含：

```
your-project/
├── .claude/                    # Claude Code 配置
│   ├── agents/                 # 4 个 Sub-Agents
│   ├── commands/               # 3 个 JVibe Skills
│   ├── hooks/                  # 3 个自动化 Hooks
│   └── settings.json
│
├── docs/
│   ├── core/                   # CORE-DOCS（4个固定核心文档）
│   │   ├── 规范文档.md        # 入口和索引
│   │   ├── 项目文档.md        # 架构与模块边界
│   │   ├── 功能清单.md        # 功能状态唯一来源（SoT）
│   │   └── 附加材料.md        # 规范索引
│   │
│   └── project/                # PROJECT-DOCS（按需创建）
│       └── README.md
│
└── .gitignore
```

---

## 📚 文档体系

### CORE-DOCS vs PROJECT-DOCS

| 维度 | CORE-DOCS | PROJECT-DOCS |
|------|-----------|--------------|
| **结构** | 所有项目相同 | 按需创建 |
| **数量** | 固定 4 个 | 可变（0~N） |
| **注册** | 自动存在 | 必须在规范文档中注册 |

### 单一事实来源（SoT）

功能状态只在 `功能清单.md` 中维护：

```
TODO 完成情况 → 功能状态
┌─────────────────────────────────────┐
│  完成数 / 总数  │  状态符号   │
├─────────────────┼─────────────┤
│     0 / N       │     ❌      │
│   1~(N-1) / N   │     🚧      │
│     N / N       │     ✅      │
└─────────────────────────────────────┘
```

---

## 🤖 Agent 架构

| Agent | 职责 | 模型 |
|-------|------|------|
| **planner** | 需求分析、功能拆解 | Sonnet |
| **developer** | 代码实现、TODO 完成 | Sonnet |
| **reviewer** | 代码审查、规范检查 | Sonnet |
| **doc-sync** | 状态推导、统计更新 | Haiku |

---

## 🔧 CLI 命令

| 命令 | 说明 |
|------|------|
| `jvibe init` | 初始化 JVibe 项目 |
| `jvibe init --mode=minimal` | 最小化初始化（仅 Core 文档） |
| `jvibe init --force` | 强制覆盖已存在的配置 |
| `jvibe upgrade` | 升级到最新版本 |
| `jvibe upgrade --check` | 仅检查更新 |
| `jvibe status` | 查看项目配置状态 |
| `jvibe validate` | 验证项目配置 |

---

## 🎯 核心原则

JVibe 基于以下原则设计：

- **SOLID**：单一职责、开闭原则、里氏替换、接口隔离、依赖倒置
- **DRY**：避免重复，功能状态只在一处维护
- **KISS**：保持简单，状态推导规则清晰明确
- **YAGNI**：只实现当前需要的功能

---

## 📖 文档

- [快速开始指南](docs/GETTING_STARTED.md)
- [CLI 命令参考](docs/CLI_COMMANDS.md)
- [架构说明](docs/ARCHITECTURE.md)
- [CORE vs PROJECT 文档](docs/CORE_VS_PROJECT_DOCS.md)
- [贡献指南](docs/CONTRIBUTING.md)

---

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](docs/CONTRIBUTING.md)。

1. Fork 本仓库
2. 创建分支 `git checkout -b feature/improvement`
3. 提交变更 `git commit -m 'feat: 添加新功能'`
4. 推送分支 `git push origin feature/improvement`
5. 创建 Pull Request

---

## 📄 许可证

[MIT](LICENSE)

---

## 🔗 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com/claude-code)
- [OpenSpec](https://github.com/openspec/openspec) - 灵感来源
