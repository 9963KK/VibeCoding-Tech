# 快速开始指南

本指南帮助你在 5 分钟内开始使用 JVibe。

---

## 前置条件

- Node.js >= 16.0.0
- Claude Code 已安装

---

## 安装

```bash
# 全局安装
npm install -g jvibe

# 或使用 npx（无需安装）
npx jvibe init
```

---

## 初始化项目

### 1. 进入项目目录

```bash
cd your-project
```

### 2. 运行初始化命令

```bash
jvibe init
```

这会创建：
- `.claude/` - Claude Code 配置（Agents、Commands、Hooks）
- `docs/core/` - 4 个核心文档
- `docs/project/` - 项目文档目录

### 3. 在 Claude Code 中完成初始化

```bash
# 启动 Claude Code
claude

# 运行 JVibe 初始化命令
/JVibe:init
```

这会询问你：
- 项目名称
- 技术栈
- 初始模块

并自动填充核心文档的内容。

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
/JVibe:status
```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `/JVibe:init` | 初始化项目文档 |
| `/JVibe:status` | 查看项目状态 |
| `/JVibe:pr` | 生成 PR 描述 |

---

## 下一步

- 阅读 [CLI 命令参考](CLI_COMMANDS.md)
- 了解 [CORE vs PROJECT 文档](CORE_VS_PROJECT_DOCS.md)
- 查看 [架构说明](ARCHITECTURE.md)
