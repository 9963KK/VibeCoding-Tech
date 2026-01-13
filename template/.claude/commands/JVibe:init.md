---
name: JVibe:init
description: 初始化 JVibe 项目文档结构
---

# /JVibe:init - 初始化 JVibe 项目文档

你需要为新项目初始化完整的 JVibe 文档体系。

## 任务

1. **创建 docs 目录**（如果不存在）

2. **创建 4 个核心文档**：

### Standards.md

基于 Standards 模板创建，包含：
- 快速导航
- Project 文档注册表
- 开发流程说明
- 文档体系说明

### Project.md

基于 Project 模板创建，包含：
- 项目架构图（根据 AI 分析生成）
- 技术栈版本（根据推荐填充）
- 模块清单（根据 AI 分析生成）
- 模块依赖关系
- 模块功能统计表（初始为空）
- 环境配置（项目根路径、代码根路径）

### Feature-List.md

基于 Feature-List 模板创建，包含：
- 文档说明
- 功能索引（初始为空，后续逐个添加）

### Appendix.md

基于 Appendix 模板创建，包含：
- 使用方式与约定
- 8 个规范分类（编码规范、API规范、数据库规范等）
- Links 字典

## 询问流程（分阶段引导）

采用**引导式询问**，帮助用户梳理需求。

### 第一阶段：项目名称

```yaml
questions:
  - question: "项目名称是什么？"
    header: "项目名称"
    multiSelect: false
    options:
      - label: "自定义项目名"
        description: "手动输入项目名称"
```

### 第二阶段：项目描述

**核心环节**：引导用户详细描述项目，这是 AI 规划架构的依据。

```yaml
questions:
  - question: "请详细描述你要做什么项目？包括：目标、核心场景、主要用户群体"
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

**提示用户补充细节**：

如果用户描述过于简单，主动追问：
- "这个应用主要解决什么问题？"
- "核心功能场景是什么？"
- "有什么特殊需求吗？（实时通信、文件上传、AI 等）"

### 第三阶段：AI 分析并规划架构

根据用户的项目描述，**AI 自动规划项目架构**：

1. **分析项目需求**：
   - 识别核心业务场景
   - 提取关键能力需求
   - 考虑通用模块（认证、用户管理等）

2. **规划模块架构**（3-6 个核心模块）：

   每个模块包含：
   - 模块名称（如 AuthModule、UserModule）
   - 职责/边界描述
   - 对外接口概览
   - 数据模型概览

   示例输出：
   ```
   基于你的项目描述，我规划了以下模块架构：

   📦 模块架构：

   1. AuthModule (认证模块)
      - 职责：用户注册、登录、Token 管理
      - 接口：/api/auth/register, /api/auth/login, /api/auth/refresh
      - 数据：users, auth_tokens

   2. UserModule (用户管理模块)
      - 职责：用户资料管理、搜索
      - 接口：/api/users/:id, /api/users/search
      - 数据：user_profiles

   3. ChatModule (实时聊天模块)
      - 职责：聊天室管理、消息收发、在线状态
      - 接口：/api/chat/rooms, /ws/chat
      - 数据：chat_rooms, messages, room_members

   📊 模块依赖关系：
   ChatModule → UserModule → AuthModule
   ```

3. **生成架构图**：
   ```mermaid
   graph TD
       A[前端 Frontend] --> B[API网关]
       B --> C[AuthModule]
       B --> D[UserModule]
       B --> E[ChatModule]
       ...
   ```

4. **推荐技术栈**：

   基于模块需求推荐技术：
   ```
   💡 技术栈推荐：

   - 前端：React + TypeScript + Tailwind CSS
   - 后端：Node.js + NestJS
   - 数据库：PostgreSQL
   - 其他：Redis（会话缓存）、Socket.io（实时通信）

   推荐理由：
   - ChatModule 需要实时通信 → Socket.io
   - 多模块架构 → NestJS 模块化设计
   - 关系型数据 → PostgreSQL
   ```

5. **让用户确认或调整**：
   ```yaml
   questions:
     - question: "以上架构规划是否符合预期？"
       header: "确认架构"
       multiSelect: false
       options:
         - label: "确认，开始初始化"
           description: "使用当前架构创建项目文档"
         - label: "需要调整模块"
           description: "添加、删除或修改某些模块"
         - label: "需要调整技术栈"
           description: "更换或调整技术选型"
         - label: "重新规划"
           description: "让 AI 重新分析并规划"
   ```

## 技术栈推荐规则

根据项目类型和模块需求，AI 应参考以下推荐规则：

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

### 模块特性推荐

| 模块特性 | 推荐技术 |
|---------|---------|
| 实时通信模块 | Socket.io / WebSocket |
| 文件存储模块 | S3 / OSS + multer |
| 搜索模块 | Elasticsearch / PostgreSQL FTS |
| 缓存需求 | Redis |
| 消息队列 | RabbitMQ / Redis Pub/Sub |
| 定时任务 | node-cron / Bull |
| AI/LLM 集成 | OpenAI SDK / Langchain |

## 执行步骤

1. **第一阶段询问**：获取项目名称
2. **第二阶段询问**：获取项目描述（引导用户详细描述）
3. **AI 分析规划**：生成模块架构、依赖关系、技术栈推荐
4. **用户确认/调整**：让用户确认或修改架构
5. 创建 `docs/` 目录
6. 自动识别项目路径并写入 Project.md：
   ```yaml
   detect_paths:
     project_root: $PWD (包含 .git 或 .claude)
     code_root: src/ | app/ | lib/ | .
   ```
7. 从模板复制并填充项目信息
8. 创建 4 个核心文档：
   - **Project.md**：填充模块清单、架构图、技术栈
   - **Feature-List.md**：空模板（后续逐个添加功能）
   - **Standards.md**：基础模板
   - **Appendix.md**：基础模板
9. **创建状态标记文件** `.jvibe-state.json`：
   ```json
   {
     "initialized": true,
     "firstSessionAfterInit": true,
     "version": "1.0.0",
     "createdAt": "2026-01-11T10:00:00Z"
   }
   ```
10. 输出确认信息

## 输出要求

- **必须简洁**：不超过 12 行
- **严格按格式**：只输出下方模板，不追加任何说明/表格/模块细节/架构/特性/提交记录
- **禁止扩展**：不要生成“总结报告”“文档特色”“Git 记录”等额外段落

## 输出格式

```
✅ JVibe 项目文档初始化完成！

已创建文档：
  - docs/core/Standards.md
  - docs/core/Project.md
  - docs/core/Feature-List.md
  - docs/core/Appendix.md

项目信息：
  - 项目名称：{项目名}
  - 项目类型：{项目类型}
  - 模块数量：{模块数量}
  - 技术栈：{技术栈列表}

下一步：
  - 添加功能："添加 XXX 功能"
  - 查看状态：/JVibe:status
```

## 注意事项

1. **不覆盖已存在的文档**：如果 docs/ 目录已存在文档，先询问用户是否覆盖
2. **使用模板**：从项目根目录的 `模版-*.md` 和 `模板-*.md` 文件复制内容
3. **填充占位符**：将模板中的占位符替换为用户提供的实际信息
4. **架构优先**：init 阶段只规划模块架构，不涉及具体功能清单
5. **功能清单后续添加**：功能清单保持空模板，用户后续通过自然语言逐个添加
6. **引导而非询问**：对于技术选择，AI 应主动分析并给出建议
7. **允许直接指定**：如果用户在初始化时已经明确说了技术栈或模块，跳过相应环节
