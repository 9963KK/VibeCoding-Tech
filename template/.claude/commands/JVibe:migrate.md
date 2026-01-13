# /JVibe:migrate - 智能文档迁移

> 以模板为唯一权威，对核心文档执行强制重构

## 触发场景

- 用户运行 `jvibe upgrade` 后提示需要 AI 迁移
- 用户主动运行 `/JVibe:migrate`
- 检测到版本升级或模板规则变更

## 工作流程

### 阶段 1：版本检测（仅参考）

1. 读取 `.claude/settings.json` 获取当前版本（仅参考）
2. 读取 `template/docs/core/*.md` 作为迁移模板
3. 读取以下文件判断当前文档结构：
   - `docs/core/Feature-List.md` 或 `docs/Feature-List.md`
   - `docs/core/Project.md` 或 `docs/Project.md`

### 阶段 2：强制重构规划

以 `template/docs/core/*.md` 为唯一权威，执行全量重构（覆盖 core 文档），不做局部补丁。

#### 重构策略（代码化）
```yaml
mode: rebuild
template_root: template/docs/core
targets:
  - docs/core/Standards.md
  - docs/core/Project.md
  - docs/core/Feature-List.md
  - docs/core/Appendix.md
overwrite: true
preserve:
  project_facts:
    - architecture
    - tech_stack
    - modules
    - endpoints
    - data_models
    - dependencies
    - code_locations
  features:
    - id
    - status
    - name
    - description
    - todos
    - existing_fields
  appendix_entries:
    - all_ids
conflict_policy:
  rules: template_wins
  data: project_wins
unmapped_content: append_to_last_section
placeholders: "[待填写]"
```

### 阶段 3：执行重构

#### 3.1 备份原文件

```bash
# 创建备份
cp docs/core/Standards.md docs/core/Standards.md.bak
cp docs/core/Feature-List.md docs/core/Feature-List.md.bak
cp docs/core/Project.md docs/core/Project.md.bak
cp docs/core/Appendix.md docs/core/Appendix.md.bak
```

#### 3.2 抽取并归一化现有内容

输出结构化快照，供重构阶段复用：

```yaml
project:
  name: "[项目名称]"
  architecture: []
  tech_stack: []
  modules: []
  paths:
    project_root: $PWD (包含 .git 或 .claude)
    code_root: src/ | app/ | lib/ | .
features: []
appendix:
  entries: []
```

#### 3.3 重构 Feature-List

对每个功能条目：

1. **读取原有内容**（保留状态、描述、TODO、已有字段）：
   ```markdown
   ## F-001 ✅ 用户注册

   **描述**：允许新用户通过邮箱和密码创建账户...

   **TODO**
   - [x] 设计数据库users表结构
   - [x] 实现 POST /api/auth/register 端点
   ...
   ```

2. **模板字段补齐**：
   - 模板字段由示例功能条目自动提取
   - 仅补齐模板要求的字段，不新增额外字段

3. **生成新格式**（完全按模板布局）：
   ```markdown
   ## F-001 ✅ 用户注册

   **描述**：允许新用户通过邮箱和密码创建账户...
   **(模板字段 1)**：...
   **(模板字段 2)**：...

   **TODO**
   - [x] 设计数据库users表结构
   - [x] 实现 POST /api/auth/register 端点
   ...
   ```

#### 3.4 重构 Project

1. **按模板章节顺序重建**
2. **填充项目事实**（架构、模块、接口、数据模型、代码落点、项目路径）
3. **更新模块功能统计**（从功能清单重新计算）

#### 3.5 重构 Standards / Appendix

- 以模板文本为准覆盖规则/约束类内容
- 追加保留的项目自定义条目（无法映射则放在末尾）

#### 3.6 文档引用更新

- 将文档中的旧中文文件名引用统一替换为英文：
  - `规范文档.md` → `Standards.md`
  - `项目文档.md` → `Project.md`
  - `功能清单.md` → `Feature-List.md`
  - `附加材料.md` → `Appendix.md`

### 阶段 4：验证与确认

1. 展示重构摘要：
   ```
   📋 重构摘要

   Feature-List.md:
   - 重构 15 个功能条目
   - 模板字段已补齐

   Project.md:
   - 按模板重建章节
   - 更新了模块功能统计

   Standards.md / Appendix.md:
   - 规则文本已对齐模板
   - 项目自定义条目已保留

   备份位置：docs/core/*.md.bak
   ```

2. 询问用户确认

## 字段推断规则（仅当模板要求该字段时）

| 特征 | 优先级 |
|------|--------|
| 涉及认证、支付、核心业务流程 | P0 |
| 主要功能、用户高频使用 | P1 |
| 辅助功能、增强体验 | P2 |
| 优化、重构、技术债务 | P3 |

## 工时估算规则（仅当模板要求该字段时）

| TODO 数量 | 复杂度特征 | 预估工时 |
|-----------|-----------|----------|
| 1-3 个 | 简单 CRUD | 2h |
| 4-6 个 | 包含测试 | 4h |
| 7-10 个 | 包含集成测试 | 8h |
| 10+ 个 | 复杂功能 | 16h+ |

## 模块匹配规则（仅当模板要求该字段时）

1. 从功能编号范围推断（如 F-001~F-005 属于 AuthModule）
2. 从功能描述关键词匹配（如「认证」「登录」→ AuthModule）
3. 从 TODO 中的 API 路径推断（如 `/api/auth/*` → AuthModule）

## 错误处理

- 如果无法确定某个字段的值，使用占位符 `[待填写]`
- 如果文档格式无法识别，提示用户手动调整
- 无法映射的内容追加在对应文档末尾
- 保留所有备份文件，便于回滚

## 输出格式

重构完成后输出：

```
✅ JVibe 文档重构完成

📊 重构统计：
- 功能清单：15 个功能条目已重构
- 项目文档：章节已按模板重建

📝 新增字段：
- 模板字段：15/15 已补齐

💾 备份文件：
- docs/core/Feature-List.md.bak
- docs/core/Project.md.bak
- docs/core/Standards.md.bak
- docs/core/Appendix.md.bak

⚠️ 请检查以下需要手动确认的项目：
- F-007 用户资料编辑 - 字段待确认
- F-015 在线状态显示 - 字段可能需要调整

运行 jvibe validate 验证重构结果
```

## 权限

| 操作 | 权限 |
|------|------|
| 读取 | 所有文档 |
| 写入 | docs/core/*.md |
| 创建 | docs/core/*.md.bak（备份）|

## 相关命令

- `jvibe upgrade --check` - 检查是否需要迁移
- `jvibe upgrade` - 执行基础升级（不含内容迁移）
- `/JVibe:migrate` - 执行智能内容迁移
- `jvibe validate` - 验证迁移结果
