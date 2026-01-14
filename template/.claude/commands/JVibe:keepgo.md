---
name: JVibe:keepgo
description: 自动继续推进项目任务，基于当前文档进度
---

# /JVibe:keepgo - 自动推进下一步

用户只需反复执行此命令，系统自动识别状态并推进开发。

## 核心理念

```
用户不需要思考"下一步做什么"
只需要不断说 "keepgo"，AI 自动判断并执行
```

**关键特性**：
- **主动推进**：不卡住等用户，自动执行下一步
- **阶段确认**：在关键节点请求用户确认
- **依赖感知**：按模块依赖顺序规划和开发
- **先规范化再决策**：先生成状态快照与 phase/substate，再执行动作
- **异常处理一致**：遵循 `.claude/error-handling.md`

---

## 用户确认点

keepgo 在以下阶段会暂停请求用户确认：

| 阶段 | 确认内容 | 确认后继续 |
|------|----------|-----------|
| **功能规划完成** | 列出为当前模块规划的功能列表 | 调用 planner 创建 TODO |
| **功能实现完成** | 展示已完成的功能和代码改动 | 继续下一个功能 |
| **模块完成** | 汇总模块所有功能完成情况 | 开始下一个模块 |

---

## 状态流转图

```
未初始化
    ↓ 提示 /JVibe:init
刚初始化
    ↓ 自动进入功能规划
功能规划中（主 agent）
    ↓ 规划模块功能列表
    ↓ ⏸️ 用户确认
有功能待规划
    ↓ 调用 planner agent 创建 TODO
有功能待开始 (❌)
    ↓ 调用 developer agent
有功能开发中 (🚧)
    ↓ 按序完成该功能 TODO
功能即将完成
    ↓ ⏸️ 用户确认
    ↓ 状态自动更新
模块完成
    ↓ ⏸️ 用户确认
    ↓ 开始下一个模块
全部完成
```

---

## 状态输入与规范化输出

### 允许读取的输入

**用于状态判断的最小输入**：
- `.jvibe-state.json`
- `docs/core/Feature-List.md`
- `docs/core/Project.md`

**可选读取（仅规则查阅，不参与状态判定）**：
- `docs/core/Standards.md`
- `docs/core/Appendix.md`

### 规范化状态快照（必须先产出，再做动作）

```yaml
state:
  initialized: false
  modules_order: []        # 从项目文档依赖关系推导的拓扑序
  current_module: null     # 按 modules_order 找到第一个未全部✅的模块
  module_features: {}      # { ModuleName: [F-001, F-002, ...] }
  feature_counts:
    total: 0
    completed: 0
    in_progress: 0
    not_started: 0
  test_required_features: []  # TODO 中包含测试任务的功能
  test_pending_only_features: []  # 未完成 TODO 仅剩测试项的功能
  phase: init | planning | developing | reviewing
  substate: needs_init | first_session | needs_plan | needs_todo | ready_to_start | in_progress | needs_test | feature_done | module_done | all_done
```

### 解析规则（严格、确定性）

1. **初始化判定**
   - `initialized = exists(docs/core/Feature-List.md)`
   - `.jvibe-state.json.firstSessionAfterInit` 缺失时视为 `false`
2. **模块与依赖解析**
   - 解析 `docs/core/Project.md` 的“模块清单”章节
   - 模块名：取 `###` 标题中第一个空格或 `(` 之前的 token
   - 依赖：读取 `**依赖**:` 行，逗号分隔；`无/空` 视为无依赖
   - 依赖图存在循环/缺失模块 → `needs_clarification`
3. **模块功能索引**
   - 在每个模块段落的“功能索引”表中提取 `F-XXX`
   - 若某模块无任何 `F-XXX` → 该模块视为“未规划”
   - 若功能索引中的 `F-XXX` 不存在于功能清单 → `needs_clarification`
4. **功能条目解析**
   - 功能条目行：`## F-XXX [✅/🚧/❌] 名称`
   - TODO 项：`- [ ]` / `- [x]`
   - 若 TODO 文本包含 `测试` 或 `test`（忽略大小写）→ 该功能加入 `test_required_features`
   - 若某功能的**未完成** TODO 仅包含测试项 → 该功能加入 `test_pending_only_features`
5. **当前模块**
   - `current_module` = `modules_order` 中第一个存在未完成（非✅）功能的模块
   - 若 `modules_order` 为空 → `needs_clarification`

### Phase / Substate 生成规则（简化版）

**优先级 1：异常处理**
- `needs_clarification` 为真时 → `phase=init`, `substate=needs_clarification`

**优先级 2：初始化阶段**
- 未初始化或核心文档/功能清单缺失 → `phase=init`, `substate=needs_init`
- `.jvibe-state.json.firstSessionAfterInit=true` → `phase=init`, `substate=first_session`

**优先级 3：规划阶段**
- 当前模块无任何功能条目（功能索引为空） → `phase=planning`, `substate=needs_plan`
- 当前模块存在功能条目但 TODO 列表为空 → `phase=planning`, `substate=needs_todo`

**优先级 4：开发阶段**
- 当前模块存在 ❌ 且无 🚧，且该功能有 TODO → `phase=developing`, `substate=ready_to_start`
- 存在 🚧 功能，且该功能在 `test_pending_only_features` → `phase=developing`, `substate=needs_test`
- 存在至少一个 🚧，且该功能仍有未完成 TODO → `phase=developing`, `substate=in_progress`
- 存在 🚧 功能且 TODO 全部完成，且该功能在 `test_required_features` → `phase=developing`, `substate=needs_test`

**优先级 5：审查阶段**
- 本轮刚完成某 🚧 功能的最后一个 TODO → `phase=reviewing`, `substate=feature_done`
- 当前模块所有功能为 ✅，且至少有一个功能 → `phase=reviewing`, `substate=module_done`
- 所有模块的所有功能为 ✅，且总功能数 > 0 → `phase=reviewing`, `substate=all_done`

**动作选择**：
```
action = substate
```

---

## 状态-动作映射表（基于 substate）

| Substate | 执行者 | 动作 |
|------|--------|------|
| `needs_init` | - | 提示 `/JVibe:init` |
| `needs_clarification` | 主 agent | 请求用户修正文档或确认处理方式 |
| `first_session` | 主 agent | 读取模块依赖，进入功能规划 |
| `needs_plan` | 主 agent | 规划功能列表 → **请求确认** |
| `needs_todo` | **planner** | 创建 F-XXX 条目和 TODO |
| `ready_to_start` | **developer** | 执行当前功能的**全部 TODO**（按序） |
| `in_progress` | **developer** | 继续当前功能的**剩余 TODO**（按序） |
| `needs_test` | **tester** | 运行测试并输出结构化报告 |
| `feature_done` | 主 agent | 展示完成情况 → **请求确认** |
| `module_done` | 主 agent | 汇总 → **请求确认** → 下一模块 |
| `all_done` | - | 提示项目完成 |

---

## 派发规则（硬约束）

```yaml
dispatch_rules:
  - when: action == needs_todo
    must_call: planner
    main_agent_write: forbidden
  - when: action in [ready_to_start, in_progress]
    must_call: developer
    main_agent_write: forbidden
  - when: action == needs_test
    must_call: tester
    main_agent_write: docs_only
  - when: action in [needs_plan, feature_done, module_done, needs_clarification, needs_init, first_session, all_done]
    must_call: none
    main_agent_write: docs_only

enforcement:
  - if: must_call != none and subagent_call_not_made
    then: abort("MUST_CALL_SUBAGENT")
  - if: main_agent_write == forbidden and main_agent_attempts_write
    then: abort("NO_MAIN_AGENT_WRITE")
  - if: subagent_unavailable
    then: ask_user_and_stop
```

---

## 交接协议（统一 payload）

```yaml
handoff:
  target: tester | doc-sync | reviewer | bugfix
  action: run_tests | check_status | review | fix_bug
  payload:
    feature_id: F-XXX
    files: []
    scope: unit|integration|e2e
    notes: ""
```

**Bugfix 调用判定**：
- **多模块**：tester 报告 `result.scope.modules_hit` 去重后数量 **>= 2**（模块边界以 Project.md §4 模块清单为准）
- **核心模块**：`modules_hit` 中任一模块在 Project.md 标记 `核心模块：是`
- 若无法判断 → 先向用户确认，不自动调用 bugfix

**执行规则**：
- 如果 developer 返回 `handoff.target: tester` → 主 agent 必须调用 tester
- 如果 tester `result.verdict == pass` → 主 agent 更新功能状态为 ✅
- 如果 tester `result.verdict != pass` 且满足 **多模块/核心模块** → 调用 **bugfix**（`action: fix_bug`）
- 如果 tester `result.verdict != pass` 且不满足上述条件 → 回退到 developer
- 如果 bugfix 完成修复 → 重新调用 tester 复测
- 如果 subagent 返回 `doc_updates` → 主 agent 必须执行或询问用户确认后执行

---

## 执行流程详解

### 阶段 0：规范化状态（每次执行都必须）

```
动作：
  1. 读取允许输入
  2. 输出 state 快照
  3. 生成 phase / substate
  4. action = substate
```

### action = needs_init

```
动作：提示先运行 /JVibe:init
```

### action = needs_clarification

```
动作：
  1. 输出不一致点（最多 3 条）
  2. AskUserQuestion 请求用户修正或确认处理方式
  3. 本轮不修改任何文件
```

### action = first_session

```
动作：
  1. 读取项目文档模块依赖
  2. 选择依赖链底层模块作为起始模块
  3. 进入功能规划（needs_plan）
```

### action = needs_plan

```
动作：
  1. 分析模块职责和边界（从项目文档）
  2. 规划该模块应包含的功能列表（3-6个功能）
  3. 使用 AskUserQuestion 请求确认：
     "为 [模块名] 规划了以下功能，是否确认？"
     - 功能1：xxx
     - 功能2：xxx
     ...
输出：功能规划列表，等待用户确认
```

**确认选项**：
```yaml
questions:
  - question: "以上功能规划是否确认？"
    header: "确认规划"
    multiSelect: false
    options:
      - label: "确认，开始创建 TODO"
        description: "使用当前规划，调用 planner 创建详细 TODO"
      - label: "需要调整"
        description: "修改功能列表后再继续"
      - label: "跳过此模块"
        description: "暂时不开发此模块，进入下一个"
```

### action = needs_todo

```
执行者：planner agent
动作：
  1. 逐个调用 planner agent
  2. 为每个功能创建 F-XXX 条目
  3. 生成详细 TODO 列表
输出：创建了 N 个功能条目
```

### action = ready_to_start

```
执行者：developer agent
动作：
  1. 选择当前模块的第一个 ❌ 功能
  2. 调用 developer agent
  3. 执行该功能的所有 TODO（按序）
  4. 若遇阻塞则停止并上报
输出：开始了哪个功能，完成了哪些 TODO
```

### action = in_progress

```
执行者：developer agent
动作：
  1. 找到 🚧 功能的 TODO 列表
  2. 调用 developer agent
  3. 继续执行未完成 [ ] 的 TODO（按序）
  4. 完成后将 [ ] 改为 [x]
  5. 若遇阻塞则停止并上报
输出：完成了哪些 TODO，当前进度
```

### action = needs_test

```
执行者：tester agent
动作：
  1. 基于 Feature-List 与 Project 提取测试范围
  2. 使用隔离环境运行最小测试集
  3. 输出结构化测试报告（含失败原因与风险）
  4. 若测试通过，主 agent 将该功能状态更新为 ✅
输出：result
```

### action = feature_done

```
动作：
  1. 展示功能完成情况
  2. 使用 AskUserQuestion 请求确认：
     "F-XXX [功能名] 已完成，请核对"
输出：功能完成详情，等待确认（不修改状态符号）
```

**确认选项**：
```yaml
questions:
  - question: "功能实现是否符合预期？"
    header: "确认完成"
    multiSelect: false
    options:
      - label: "确认完成"
        description: "标记功能为完成，继续下一个"
      - label: "需要补充"
        description: "添加额外 TODO 后再完成"
      - label: "需要修改"
        description: "对已实现的代码进行调整"
```

### action = module_done

```
动作：
  1. 汇总模块完成情况
  2. 使用 AskUserQuestion 请求确认
  3. 确认后进入下一个模块的功能规划
输出：模块完成汇总，下一模块预览
```

### action = all_done

```
动作：不执行
输出：项目所有功能已完成，建议添加新功能
```

---

## 模块依赖排序

读取项目文档中的模块依赖关系，按**拓扑排序**确定开发顺序：

```
示例依赖：
  OrderModule → ProductModule → AuthModule
  OrderModule → CustomerModule → AuthModule

排序结果（底层优先）：
  1. AuthModule（无依赖）
  2. ProductModule（依赖 Auth）
  3. CustomerModule（依赖 Auth）
  4. OrderModule（依赖 Product + Customer）
```

---

## Agent 调用规则

| 任务类型 | 调用谁 | 说明 |
|----------|--------|------|
| 规划模块包含哪些功能 | **主 agent** | 分析模块职责，输出功能列表 |
| 创建功能 TODO 列表 | **planner agent** | 生成 F-XXX 条目和详细 TODO |
| 执行功能 TODO | **developer agent** | 单功能窗口，按序完成 TODO |
| 用户确认交互 | **主 agent** | 使用 AskUserQuestion |

---

## Developer 调用协议（功能级）

### 调用原则

- **一个功能一个 developer 窗口**
- 每次调用仅处理一个 `F-XXX`
- 目标是一次完成该功能的**全部 TODO**
- 不切换功能、不并行处理多个功能
- 输入仅包含该功能的 TODO 列表，不附带其他功能内容

### 输入负载（主 agent → developer）

```yaml
task_input:
  type: develop_feature
  feature_id: F-XXX
  todos:
    - "TODO 1"
    - "TODO 2"
    - "TODO 3"
  code_roots:
    - <项目文档中的代码落点路径>
  test_roots:
    - <TODO 指定的测试路径（如有）>
  context:
    feature_name: <功能名>
    module: <模块名>
```

### TODO 执行模板（developer 内部使用）

```
对每个 TODO，按以下步骤：
1) 定位：基于 code_roots 找到需要修改的文件/函数
2) 实现：完成 TODO 要求的最小改动
3) 校验：可运行最小验证（lint/单测/集成）以降低返工；若未运行必须说明原因并交接 tester
4) 勾选：在 docs/core/Feature-List.md 勾选该 TODO
5) 记录：用 1 行描述该 TODO 的关键改动

遇到阻塞：
- 立即停止该功能的后续 TODO
- 输出阻塞原因 + 需要用户确认的信息
```

### 输出要求（developer → 主 agent）

```
完成情况：
  ✅ 已完成 TODO: <列出>
  ⏳ 未完成 TODO: <列出或无>
改动摘要（<=3行）
阻塞/风险（如有）
```

---

## 操作边界（硬约束）

### 允许写入

- **主 agent**：可写 `docs/**`（含 `docs/core/`、`docs/project/`、`docs/.jvibe/`）
- **planner agent**：仅写 `docs/core/Feature-List.md`（新增 F-XXX + TODO）
- **developer agent**：仅写
  - `docs/core/Feature-List.md`（勾选 TODO）
  - 当前模块“代码落点”所指向的源码路径
  - TODO 明确要求的测试文件

### 禁止写入

- 除“允许写入”范围外，禁止修改任何文件
- 禁止修改 `.jvibe-state.json`（由系统/Hook 管理）
- 禁止修改 `.claude/` 目录及其内容（以及 `.opencode/`，如存在）
- 禁止修改 `package.json`、锁文件、`.gitignore`（除非 TODO 明确要求且用户确认）

### 允许操作

- 允许按需安装依赖/联网/运行测试或脚本，但必须使用隔离环境并记录命令；大规模安装/全量回归前先 AskUserQuestion

### 禁止操作

- 不进行仓库级 Git 操作（如 `git reset`、`git checkout`、`git push`、`git commit`）
- 不做破坏性操作（如 `rm -rf`、覆盖备份）除非用户确认
- 不扫描全仓或读取与当前 TODO 无关的文件

### 读取规则

- 仅读取“允许输入”与当前 TODO / 代码落点相关文件
- TODO 未指向具体路径时，先查项目文档“代码落点”，仍不明确则 AskUserQuestion

### 状态更新规则

- **不手动修改功能状态符号（✅/🚧/❌）**
- 仅通过勾选 TODO 触发状态推导（由 Hook 自动完成）

---

## 运行时标志（会话级）

```yaml
flags:
  auto_confirm: false   # 用户说“自动继续”后置为 true
  auto_commit: false    # 用户说“自动提交/auto commit”后置为 true
```

规则：
- `auto_confirm` 仅影响下一次确认，使用后重置为 false
- `auto_commit` 仅在本会话有效

---

## 提交规则（严格）

- 仅当 `auto_commit=true` 时允许提交
- 仅在**无待确认**且**有实际改动**时提交
- 提交动作由 **doc-sync** 执行，主 agent 负责触发
- 提交信息模板：
  - `chore(jvibe): keepgo <action> <F-XXX?>`
  - 无功能编号时省略 `<F-XXX?>`

---

## 输出格式

### 正常执行

```
========================================
  /keepgo 执行完成
========================================

当前状态：{action}
当前模块：{模块名}
阶段：{phase}
子状态：{substate}

本轮任务：
  {简述执行的内容}

执行结果：
  {关键改动，最多3行}

----------------------------------------
下一步：
  - /JVibe:keepgo
========================================
```

### 需要确认时

```
========================================
  /keepgo 需要确认
========================================

当前状态：{action}
当前模块：{模块名}
阶段：{phase}
子状态：{substate}

待确认内容：
  {需要用户确认的内容}

[AskUserQuestion 组件显示]
========================================
```

---

## 示例流程

```
用户：/JVibe:keepgo
AI：检测到刚初始化，读取模块依赖，AuthModule 是底层模块
    开始为 AuthModule 规划功能...
    规划了 4 个功能：用户注册、用户登录、Token刷新、密码重置
    [请求确认]

用户：确认

用户：/JVibe:keepgo
AI：调用 planner agent，创建 F-001 到 F-004 的 TODO 列表

用户：/JVibe:keepgo
AI：调用 developer agent，开始 F-001 用户注册
    完成 TODO：设计 users 表结构

用户：/JVibe:keepgo
AI：继续 F-001，完成 TODO：实现注册 API

... (重复 keepgo)

用户：/JVibe:keepgo
AI：F-001 所有 TODO 完成
    [请求确认：功能是否符合预期]

用户：确认完成

用户：/JVibe:keepgo
AI：开始 F-002 用户登录...

... (循环直到模块完成)

用户：/JVibe:keepgo
AI：AuthModule 所有功能完成
    [请求确认：模块完成，进入下一模块]

用户：确认

用户：/JVibe:keepgo
AI：开始为 ProductModule 规划功能...
```

---

## 注意事项

1. **幂等性**：多次执行不会重复操作已完成的任务
2. **断点续传**：从上次中断的地方继续
3. **确认可跳过**：仅当 `auto_confirm=true` 时跳过确认环节
4. **状态同步**：每次执行前都重新读取文档状态

---

## 严禁输出

- ❌ 文档特点分析
- ❌ 项目架构说明
- ❌ 功能清单完整内容
- ❌ 代码详细解释
- ❌ 状态快照完整 YAML（除非用户明确要求）
- ❌ "总结报告" / "工作总结"
