<!-- JVIBE:START -->
# JVibe Instructions

这是 JVibe 文档驱动开发系统的 AI 入口文档。

## 何时使用 JVibe 工作流

当用户请求涉及以下场景时，自动使用对应的 JVibe Skill 或 Agent：

| 场景 | 使用 |
|------|------|
| 新项目初始化 | `/JVibe:init` |
| 需求分析、功能规划 | `planner` agent |
| 代码实现、TODO 完成 | `developer` agent |
| 代码审查、规范检查 | `reviewer` agent |
| 文档状态同步 | `doc-sync` agent |
| 查看项目状态 | `/JVibe:status` |
| 生成 PR 描述 | `/JVibe:pr` |

## 核心概念

### 1. 文档体系

JVibe 使用两类文档：

**CORE-DOCS（4个固定核心文档）**：
- `docs/core/Standards.md` - 入口和索引
- `docs/core/Project.md` - 架构与模块边界
- `docs/core/Feature-List.md` - **功能状态唯一来源（SoT）**
- `docs/core/Appendix.md` - 规范索引

**PROJECT-DOCS（按需创建）**：
- `docs/project/*.md` - API文档、数据库文档等
- 必须在规范文档中注册

### 2. 单一事实来源（SoT）

**重要**：功能状态只在 `Feature-List.md` 中维护！

状态推导规则：
```
TODO 完成情况 → 功能状态
┌─────────────────────────────────────┐
│  完成数 / 总数  │  推导状态  │  状态符号   │
├─────────────────┼────────────┼─────────────┤
│     0 / N       │   未开始   │     ❌      │
│   1~(N-1) / N   │   开发中   │     🚧      │
│     N / N       │   已完成   │     ✅      │
└─────────────────────────────────────────────┘
```

### 3. 开发流程

```
需求分析 → 功能拆解 → 技术设计 → 编码实现 → 测试验证 → 代码审查 → 文档同步
```

## Agent 职责

| Agent | 职责 | 可写文件 |
|-------|------|----------|
| **planner** | 需求分析、功能拆解、创建 F-XXX 条目 | Feature-List.md |
| **developer** | 代码实现、逐项完成 TODO、勾选完成项 | Feature-List.md + 源代码 |
| **tester** | 测试执行、结果分析、回归验证 | 测试文件（测试阶段自动调用） |
| **bugfix** | 缺陷定位、问题修复、补充测试 | 代码与测试文件（按需） |
| **reviewer** | 代码审查、规范检查、PR 描述生成 | 只读 |
| **doc-sync** | 状态推导、统计更新、格式检查 | Project.md |

## 重要提示

1. **先读文档再开发**：开发前先阅读 `Standards.md` 了解项目结构
2. **遵循 SoT 原则**：功能状态只更新 `Feature-List.md`
3. **查阅附加材料**：开发前检查 `Appendix.md` 中的相关规范
4. **注册 PROJECT-DOCS**：新建项目文档必须在规范文档中注册
5. **测试自动派发**：TODO 包含“测试/test”时，进入测试阶段必须自动调用 tester，无需用户手动指定
6. **已有项目初始化**：若项目已有代码/文档，/JVibe:init 应先扫描现有项目并用扫描结果填充 Project 与 Feature-List
7. **Bugfix 调用**：tester 报告失败且问题涉及**多模块**或**核心模块**时才调用 bugfix；否则回退给 developer。用户明确要求时可直接调用
8. **Tools/Plugins 权限**：主 Agent 与所有 Sub-Agents 允许直接调用 Tools/Plugins 进行查询/集成操作（包括 MCP Server、Skills、Daemon 等）

保持此管理块，以便 `jvibe upgrade` 更新指令。
<!-- JVIBE:END -->
