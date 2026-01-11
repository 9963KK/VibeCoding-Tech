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
- 功能索引（初始为空）

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

  - question: "你想做什么项目？请简单描述一下项目目标"
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

### 第二阶段：AI 分析并推荐技术栈

根据用户在第一阶段的描述，**AI 主动分析并推荐合适的技术栈**：

1. **分析用户需求**：
   - 项目类型（Web/移动端/API/工具）
   - 复杂度（简单/中等/复杂）
   - 特殊需求（实时通信、大数据、AI 等）

2. **生成推荐方案**：
   ```
   基于你的项目描述，我推荐以下技术栈：

   📦 推荐方案：
   - 前端：React + TypeScript + Tailwind CSS
   - 后端：Node.js + Express
   - 数据库：PostgreSQL

   💡 推荐理由：
   - React 生态成熟，适合 xxx 场景
   - PostgreSQL 支持 xxx 特性，适合你的需求
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

### 第三阶段：初始模块（可选）

```yaml
questions:
  - question: "是否需要创建初始模块？"
    header: "初始模块"
    multiSelect: true
    options:
      - label: "用户认证模块（AuthModule）"
        description: "用户注册、登录、权限管理"
      - label: "用户管理模块（UserModule）"
        description: "用户信息、个人资料"
      - label: "暂不创建"
        description: "稍后手动添加模块"
```

## 技术栈推荐规则

根据项目类型，AI 应参考以下推荐规则：

| 项目类型 | 前端推荐 | 后端推荐 | 数据库推荐 |
|---------|---------|---------|-----------|
| 简单 Web 应用 | Vue 3 + TypeScript | Node.js + Express | SQLite / MongoDB |
| 复杂 Web 应用 | React + TypeScript | Node.js + NestJS | PostgreSQL |
| 管理后台 | React + Ant Design | Node.js + NestJS | PostgreSQL |
| 移动端 App | React Native | Node.js + Express | PostgreSQL |
| 小程序 | Taro / uni-app | Node.js + Express | MongoDB |
| API 服务 | - | Node.js + NestJS / Go | PostgreSQL |
| CLI 工具 | - | Node.js / Python | SQLite |
| 实时应用 | React + Socket.io | Node.js + Socket.io | Redis + PostgreSQL |

## 执行步骤

1. **第一阶段询问**：获取项目名称和项目描述
2. **AI 分析**：根据描述推荐技术栈并说明理由
3. **第二阶段询问**：让用户确认或调整技术栈
4. **第三阶段询问**：初始模块选择
5. 创建 `docs/` 目录
6. 从模板复制并填充项目信息
7. 创建 4 个核心文档
8. **创建状态标记文件** `.jvibe-state.json`：
   ```json
   {
     "initialized": true,
     "firstSessionAfterInit": true,
     "version": "1.0.0",
     "createdAt": "2026-01-11T10:00:00Z"
   }
   ```
9. 输出确认信息

## 输出格式

```
✅ JVibe 项目文档初始化完成！

已创建文档：
  - docs/规范文档.md
  - docs/项目文档.md
  - docs/功能清单.md
  - docs/附加材料.md

项目信息：
  - 项目名称：{项目名}
  - 项目类型：{Web 应用 / API 服务 / ...}
  - 技术栈：{技术栈列表}
  - 初始模块：{模块列表}

下一步：
  - 使用自然语言添加功能："添加 XXX 功能"
  - 查看项目状态：/JVibe:status
```

## 注意事项

1. **不覆盖已存在的文档**：如果 docs/ 目录已存在文档，先询问用户是否覆盖
2. **使用模板**：从项目根目录的 `模版-*.md` 和 `模板-*.md` 文件复制内容
3. **填充占位符**：将模板中的占位符替换为用户提供的实际信息
4. **引导而非询问**：对于技术选择，AI 应主动分析并给出建议，而不是让用户自己做决定
5. **允许直接指定**：如果用户在初始化时已经明确说了技术栈，跳过推荐环节，直接使用用户指定的
