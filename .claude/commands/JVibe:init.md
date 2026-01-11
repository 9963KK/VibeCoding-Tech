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

## 询问用户

在创建文档前，询问用户以下信息（使用 AskUserQuestion）：

```yaml
questions:
  - question: "项目名称是什么？"
    header: "项目名称"
    multiSelect: false
    options:
      - label: "自定义项目名"
        description: "手动输入项目名称"

  - question: "主要技术栈是什么？"
    header: "技术栈"
    multiSelect: true
    options:
      - label: "前端：React + TypeScript"
        description: "现代前端技术栈"
      - label: "前端：Vue 3 + TypeScript"
        description: "Vue 生态"
      - label: "后端：Node.js + Express"
        description: "轻量级后端"
      - label: "后端：Node.js + NestJS"
        description: "企业级后端框架"
      - label: "数据库：PostgreSQL"
        description: "关系型数据库"
      - label: "数据库：MongoDB"
        description: "文档数据库"
      - label: "其他"
        description: "手动指定其他技术栈"

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

## 执行步骤

1. 创建 `docs/` 目录
2. 从模板复制并填充项目信息：
   - 项目名称
   - 技术栈
   - 初始模块（如果用户选择了）
3. 创建 4 个核心文档
4. **创建状态标记文件** `.jvibe-state.json`：
   ```json
   {
     "initialized": true,
     "firstSessionAfterInit": true,
     "version": "1.0.0",
     "createdAt": "2026-01-11T10:00:00Z"
   }
   ```
5. 输出确认信息

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
