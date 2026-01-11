---
name: JVibe:init
description: 初始化 JVibe 项目文档结构
---

# /JVibe:init - 初始化 JVibe 项目文档

你需要为新项目初始化完整的 JVibe 文档体系。

## 任务

1. **创建 docs 目录**（如果不存在）

2. **创建 4 个核心文档**：

### 规范文档.md

基于模版-规范文档.md 创建，包含：
- 快速导航
- Project 文档注册表
- 开发流程说明
- 文档体系说明

### 项目文档.md

基于模板-项目文档.md 创建，包含：
- 项目概览
- 技术栈
- 项目结构
- 模块清单（初始为空）
- 模块功能统计表（初始为空）

### 功能清单.md

基于模板-功能清单.md 创建，包含：
- 文档说明
- 功能索引（根据功能规划阶段填充）

### 附加材料.md

基于模板-附加材料.md 创建，包含：
- 使用方式与约定
- 8 个规范分类（编码规范、API规范、数据库规范等）
- Links 字典

## 询问流程（分阶段引导）

采用**引导式询问**，帮助用户梳理需求，而不是直接让用户做技术决策。

### 第一阶段：基本信息

```yaml
questions:
  - question: "项目名称是什么？"
    header: "项目名称"
    multiSelect: false
    options:
      - label: "自定义项目名"
        description: "手动输入项目名称"

  - question: "你想做什么项目？请详细描述项目目标和主要场景"
    header: "项目描述"
    multiSelect: false
    options:
      - label: "Web 应用"
        description: "网站、管理后台、在线平台等"
      - label: "移动端应用"
        description: "iOS/Android App、小程序等"
      - label: "API 服务"
        description: "后端接口、微服务等"
      - label: "CLI 工具"
        description: "命令行工具、自动化脚本等"
```

### 第二阶段：功能规划

**核心理念**：功能决定技术栈。先明确要做什么功能，才能选择合适的技术。

```yaml
questions:
  - question: "如何规划项目功能？"
    header: "功能规划"
    multiSelect: false
    options:
      - label: "AI 全权托管（推荐）"
        description: "AI 根据项目描述自动生成完整功能列表和 TODO"
      - label: "用户自主添加"
        description: "保持功能清单为空，稍后逐个添加功能"
      - label: "AI 生成 + 用户调整"
        description: "AI 先生成功能列表，用户确认后可增删改"
```

#### AI 全权托管模式

如果用户选择 AI 托管或 AI 生成+调整，执行以下步骤：

1. **分析项目描述**：
   - 识别核心业务场景
   - 提取关键功能需求
   - 考虑常见配套功能（如认证、权限、日志等）

2. **生成功能列表**（3-8 个核心功能）：
   - 每个功能包含：编号（F-XXX）、名称、详细描述
   - 每个功能包含：完整的 TODO 清单（5-10 项）
   - TODO 应覆盖：设计、实现、测试、文档

3. **输出格式示例**：
   ```markdown
   ## F-001 ❌ 用户注册

   **描述**：允许新用户通过邮箱和密码创建账户。注册成功后，系统自动发送验证邮件，
   用户需点击邮件中的链接完成邮箱验证。

   **TODO**
   - [ ] 设计数据库 users 表结构
   - [ ] 实现 POST /api/auth/register 端点
   - [ ] 实现邮件发送服务
   - [ ] 实现邮箱验证端点 GET /api/auth/verify/:token
   - [ ] 密码强度校验
   - [ ] 邮箱格式校验
   - [ ] 单元测试（邮箱格式、密码强度、加密函数）
   - [ ] 集成测试（注册流程、异常情况）
   - [ ] API 文档更新
   ```

4. **让用户确认**：
   ```yaml
   questions:
     - question: "以上功能规划是否符合预期？"
       header: "确认功能"
       multiSelect: false
       options:
         - label: "确认，开始初始化"
           description: "使用当前功能列表创建项目"
         - label: "需要调整"
           description: "添加、删除或修改某些功能"
         - label: "重新生成"
           description: "让 AI 重新分析并生成"
   ```

#### 用户自主添加模式

如果用户选择自主添加：
- 功能清单只包含格式说明和空模板
- 提示用户后续可通过自然语言添加功能

### 第三阶段：AI 分析并推荐技术栈

根据第一阶段的描述和第二阶段的功能列表，**AI 主动分析并推荐合适的技术栈**：

1. **分析需求**：
   - 项目类型（Web/移动端/API/工具）
   - 功能特性（实时通信、文件上传、搜索、AI 等）
   - 复杂度（简单/中等/复杂）

2. **生成推荐方案**：
   ```
   基于你的项目功能，我推荐以下技术栈：

   📦 推荐方案：
   - 前端：React + TypeScript + Tailwind CSS
   - 后端：Node.js + NestJS
   - 数据库：PostgreSQL
   - 其他：Redis（缓存）、Socket.io（实时通信）

   💡 推荐理由：
   - 功能 F-003 需要实时消息，推荐 Socket.io
   - 功能 F-005 涉及全文搜索，PostgreSQL 支持 LIKE 查询，复杂场景可后续引入 Elasticsearch
   - NestJS 的模块化设计适合 8 个功能模块的组织
   ```

3. **让用户确认或调整**：
   ```yaml
   questions:
     - question: "是否采用推荐的技术栈？"
       header: "技术栈确认"
       multiSelect: false
       options:
         - label: "采用推荐方案（推荐）"
           description: "使用 AI 推荐的技术栈组合"
         - label: "我要自己指定"
           description: "手动选择或输入技术栈"
         - label: "帮我调整一下"
           description: "在推荐基础上做一些修改"
   ```

### 第四阶段：初始模块（可选）

基于功能列表，AI 可以建议合理的模块划分：

```yaml
questions:
  - question: "是否需要创建初始模块？"
    header: "初始模块"
    multiSelect: true
    options:
      - label: "根据功能自动划分（推荐）"
        description: "AI 根据功能列表建议模块划分"
      - label: "用户认证模块（AuthModule）"
        description: "用户注册、登录、权限管理"
      - label: "暂不创建"
        description: "稍后手动添加模块"
```

## 技术栈推荐规则

根据项目类型和功能特性，AI 应参考以下推荐规则：

### 基础推荐

| 项目类型 | 前端推荐 | 后端推荐 | 数据库推荐 |
|---------|---------|---------|-----------|
| 简单 Web 应用 | Vue 3 + TypeScript | Node.js + Express | SQLite / MongoDB |
| 复杂 Web 应用 | React + TypeScript | Node.js + NestJS | PostgreSQL |
| 管理后台 | React + Ant Design | Node.js + NestJS | PostgreSQL |
| 移动端 App | React Native | Node.js + Express | PostgreSQL |
| 小程序 | Taro / uni-app | Node.js + Express | MongoDB |
| API 服务 | - | Node.js + NestJS / Go | PostgreSQL |
| CLI 工具 | - | Node.js / Python | SQLite |

### 功能特性推荐

| 功能特性 | 推荐技术 |
|---------|---------|
| 实时通信/消息 | Socket.io / WebSocket |
| 文件上传/存储 | S3 / OSS + multer |
| 全文搜索 | Elasticsearch / PostgreSQL FTS |
| 缓存 | Redis |
| 消息队列 | RabbitMQ / Redis Pub/Sub |
| 定时任务 | node-cron / Bull |
| AI/LLM 集成 | OpenAI SDK / Langchain |

## 执行步骤

1. **第一阶段询问**：获取项目名称和项目描述
2. **第二阶段询问**：功能规划模式选择
3. **AI 生成功能**：如选择 AI 托管，生成完整功能列表
4. **用户确认功能**：如选择 AI 托管，让用户确认或调整
5. **第三阶段询问**：根据功能推荐技术栈并确认
6. **第四阶段询问**：初始模块选择
7. 创建 `docs/` 目录
8. 从模板复制并填充项目信息
9. 创建 4 个核心文档（功能清单根据规划结果填充）
10. **创建状态标记文件** `.jvibe-state.json`：
    ```json
    {
      "initialized": true,
      "firstSessionAfterInit": true,
      "version": "1.0.0",
      "createdAt": "2026-01-11T10:00:00Z",
      "featurePlanMode": "ai-managed"
    }
    ```
11. 输出确认信息

## 输出格式

```
✅ JVibe 项目文档初始化完成！

已创建文档：
  - docs/规范文档.md
  - docs/项目文档.md
  - docs/功能清单.md（包含 X 个已规划功能）
  - docs/附加材料.md

项目信息：
  - 项目名称：{项目名}
  - 项目类型：{Web 应用 / API 服务 / ...}
  - 功能规划：{AI 托管 / 用户自主}
  - 已规划功能：{X} 个
  - 技术栈：{技术栈列表}
  - 初始模块：{模块列表}

下一步：
  - 查看功能清单：docs/功能清单.md
  - 开始开发某个功能："开发 F-001 用户注册"
  - 查看项目状态：/JVibe:status
```

## 注意事项

1. **不覆盖已存在的文档**：如果 docs/ 目录已存在文档，先询问用户是否覆盖
2. **使用模板**：从项目根目录的 `模版-*.md` 和 `模板-*.md` 文件复制内容
3. **填充占位符**：将模板中的占位符替换为用户提供的实际信息
4. **功能优先**：先规划功能，再推荐技术栈，确保技术选型有据可依
5. **引导而非询问**：对于技术选择，AI 应主动分析并给出建议，而不是让用户自己做决定
6. **允许直接指定**：如果用户在初始化时已经明确说了技术栈或功能，跳过相应环节，直接使用用户指定的
7. **功能清单填充**：如果选择 AI 托管，创建的功能清单.md 应包含生成的功能列表，而非空模板
