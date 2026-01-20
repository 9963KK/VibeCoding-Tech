# [项目名称] 规范文档

> 文档体系入口，阅读顺序：规范文档 → 项目文档 → 功能清单

---

## 1. 快速导航

| 我想...                | 查看                              | 章节              |
| ---------------------- | --------------------------------- | ----------------- |
| 了解项目整体架构       | [项目文档](./Project.md)         | §1 项目架构图     |
| 查看某个模块有哪些功能 | [项目文档](./Project.md)         | §4 模块清单       |
| 开发某个功能的具体TODO | [功能清单](./Feature-List.md)         | 按 F-XXX 编号查找 |
| 查阅编码规范/技术标准  | [附加材料](./Appendix.md)         | 按条目 ID 查找    |
| 查阅项目特定文档       | 见 §2.2 注册表                    | -                 |

---

## 2. 文档体系

```
docs/
├── core/
│   ├── Standards.md   ← 入口
│   ├── Project.md   ← 架构 + 模块 + 功能索引
│   ├── Feature-List.md   ← 功能详情 + TODO（状态唯一来源）
│   └── Appendix.md   ← 规范索引 + 技术细节
├── .jvibe/
│   └── tasks.yaml    ← 任务交接（单文件协作）
└── project/          ← 项目特定文档（按需）
```

### 2.1 Core文档职责

| 文档       | 职责                 | 更新时机                         |
| ---------- | -------------------- | -------------------------------- |
| 规范文档   | 入口与索引           | 文档结构/流程变更时              |
| 项目文档   | 架构与模块边界       | 新增模块/技术栈变更时            |
| 功能清单   | 功能状态唯一来源(SoT) | 新增功能/TODO完成/状态变更时     |
| 附加材料   | 规范索引             | 新增规范/用户强调偏好时          |

> **SoT原则**：功能状态只在功能清单维护，项目文档统计数据由功能清单推导。

### 2.2 Project文档注册表

> 项目特定文档在此注册，按需创建

| 文档ID | 名称         | 位置               | 用途             | 状态   |
| ------ | ------------ | ------------------ | ---------------- | ------ |
| P-001  | API文档      | `docs/project/api.md`      | REST API端点     | active |
| P-002  | 数据库Schema | `docs/project/database.md` | 表结构和ER图     | active |

**自动创建规则**：
```yaml
project_docs:
  create_if:
    has_api_layer: docs/project/api.md
    has_database: docs/project/database.md
    has_frontend: docs/project/frontend.md
    has_backend: docs/project/backend.md
```

**使用方式**：
- 新增文档必须先登记到注册表（§2.2）
- 文档开头写明用途、更新时机、信息来源
- 内容更新以模块变更为触发，不做长期遗漏

### 2.3 任务交接文件（Task Handoff）

**位置**：`docs/.jvibe/tasks.yaml`

**用途**：以结构化 YAML 记录跨模块协作的输入/输出/状态，作为单一交接点。

**规则**：
- `active` 仅保留进行中/待办任务
- 完成任务移入 `archive`
- 保持一行摘要，避免长段落

**示例**：
```yaml
version: 1
active:
  - id: F-001
    name: 用户注册
    module: AuthModule
    state: planned
    owner: planner
    updated_at: 2024-01-01
    handoff: developer
    read:
      - docs/core/Project.md
    write:
      - docs/core/Feature-List.md#f-001-用户注册
archive: []
```

### 2.4 输出协议（Structured Output）

- 默认使用 fenced block 输出（```yaml / ```jvibe / ```json）
- 超过 12 行必须结构化输出，避免长段落总结
- **统一字段命名**：统一使用 `feature_id`，禁止使用 `feature`/`created` 等旧字段
- **统一交接字段**：交接统一为 `handoff`，文档更新统一为 `doc_updates`

### 2.5 结构化 Schema（必须遵循）

**模块信息（Project.md）**：
```yaml
module_block:
  required_fields:
    - 职责/边界
    - 核心模块: 是 | 否
    - 代码落点
    - 功能索引
    - 依赖
    - 被依赖
  optional_fields:
    - 对外接口
    - 数据模型
```

**功能条目（Feature-List.md）**：
```yaml
feature_entry:
  id: F-XXX
  status: ❌ | 🚧 | ✅
  fields:
    描述: string
    优先级: P0 | P1 | P2 | P3
    关联模块: ModuleName
    TODO: list
```

**任务交接（tasks.yaml）**：
```yaml
tasks_schema:
  version: 1
  active:
    - id: F-XXX
      name: 功能名称
      module: ModuleName
      state: planned | in_progress | blocked | done
      owner: planner | developer | tester | bugfix | reviewer | doc-sync | main
      updated_at: YYYY-MM-DD
      handoff: developer | tester | bugfix | reviewer | doc-sync | main
  archive: []
```

### 2.6 Tools & Plugins（工具与插件）

- **Tool**：面向 AI Agent 的能力点（搜索/记忆/文件/Git/文档/浏览器等）
- **Plugin**：实现并交付 Tool 的扩展单元，不绑定 MCP/CLI 等具体形态
- **Core Tools**：固定默认启用；**Project Tools**：项目按需启用
- 插件启用清单：`docs/.jvibe/plugins.yaml`（只记录启用项，不在这里存密钥/Token）

---

## 3. 开发流程

```
需求分析 → 功能拆解 → 技术设计 → 编码实现 → 测试验证 → 代码合并
```

### 3.1 功能添加（自然语言触发）

用户通过自然语言描述需求，AI 自动识别意图并调用 planner agent：

| 用户说... | AI 识别为 | 执行动作 |
|----------|----------|---------|
| "添加用户注册功能" | 添加功能 | 调用 planner agent |
| "为 AuthModule 增加密码重置" | 添加功能 | 调用 planner agent |
| "我需要一个文件上传功能" | 添加功能 | 调用 planner agent |
| "实现消息撤回" | 添加功能 | 调用 planner agent |

**流程**：
```
用户描述需求
    ↓
AI 识别"添加功能"意图
    ↓
调用 planner agent
    ↓
planner 分析需求（必要时反问澄清）
    ↓
生成 F-XXX 功能条目 + TODO 清单
    ↓
直接写入Feature-List.md
```

**触发关键词**：添加、新增、增加、实现、开发、创建 + 功能/模块/特性

### 3.2 各阶段操作

| 阶段     | 操作                     | 产出          |
| -------- | ------------------------ | ------------- |
| 功能拆解 | 在功能清单新增 F-XXX     | 功能条目+TODO |
| 技术设计 | 查阅附加材料相关规范     | 技术方案      |
| 编码实现 | 按TODO逐项完成           | 代码          |
| 代码合并 | 更新功能清单状态为✅      | PR合并        |

### 3.3 功能开发检查清单

- [ ] 在功能清单创建功能条目（F-XXX）
- [ ] 查阅附加材料相关规范
- [ ] 完成TODO中的所有任务
- [ ] 更新功能清单状态：❌ → 🚧 → ✅

### 3.4 PR描述模板

```markdown
## 命中规范条目
- [ ] CS-___ : [说明如何满足]
- [ ] SEC-___ : [说明如何满足]

## 变更说明
...
```

### 3.5 环境隔离与依赖安装

```yaml
env_isolation:
  required: true
  forbid: [base, global]
  allowed:
    - .venv
    - .conda
  install:
    python: "<env>/bin/python -m pip install ..."
    node: "npm ci (project root)"
```

- 任何测试或脚本必须使用项目隔离环境，不允许默认 base 环境
- 环境选择与激活方式写入项目文档（如无相关章节则新增“环境配置”）

---

## 4. 文档编写规范

### 4.1 功能清单

**编号规则**：`F-XXX`（连续编号，不重复使用已删除编号）

**功能条目结构**：
```markdown
## F-XXX ❌ 功能名称

**描述**：功能说明
**优先级**：P0 | P1 | P2 | P3
**关联模块**：ModuleName

**TODO**
- [ ] 具体任务1
- [ ] 具体任务2
```

**字段枚举**：
```yaml
status: [❌, 🚧, ✅]
priority: [P0, P1, P2, P3]
```

### 4.2 附加材料

**条目ID命名**：

| 分类     | 前缀  | 分类     | 前缀  |
| -------- | ----- | -------- | ----- |
| 编码规范 | CS-   | 测试策略 | TEST- |
| API设计  | API-  | 技术细节 | TD-   |
| 数据库   | DB-   | 设计风格 | DS-   |
| 安全检查 | SEC-  | 用户记忆 | UM-   |

**条目格式**：
- 控制在10行以内
- 必须包含：ID / 一句话结论 / 触发条件 / 关联文件
- 外链统一登记到Links字典，正文只写 `L-xxx`

**条目模板**：
```markdown
#### XX-XXX：<主题名>
- **一句话结论**：
- **触发条件**：路径/变更类型/关键字
- **关联文件**：`...`
- **必须注意点**：
- **规范链接**：L-xxx
```

### 4.3 Project文档

新增Project文档时：
1. 在注册表（§2.2）添加记录
2. 在文档开头说明用途和更新时机

必须包含项目路径信息：
```yaml
project_paths:
  project_root: required
  code_root: required
  source: auto_detected
```

---

## 5. 文档同步规则

| 变更类型        | 需更新的文档                       |
| --------------- | ---------------------------------- |
| 新增模块        | 项目文档（模块章节）               |
| 新增功能        | 功能清单（功能条目）               |
| 功能状态变更    | **仅更新功能清单**                 |
| 新增规范        | 附加材料（条目）                   |
| 新增Project文档 | 规范文档（注册表）                 |

---

## 附录：文档模板

- 本项目不再使用旧的中文命名模板文件。
- 核心文档本身即模板：`./Standards.md`、`./Project.md`、`./Feature-List.md`、`./Appendix.md`
