# 贡献指南

感谢你对 JVibe 的关注！我们欢迎任何形式的贡献。

---

## 行为准则

在参与本项目时，请遵循以下准则：

- 🤝 友善和尊重地对待所有贡献者
- 💬 使用清晰、专业的语言
- 🎯 专注于问题本身，而非个人
- 📝 提供建设性的反馈

---

## 如何贡献

### 报告 Bug

发现 Bug？请创建 Issue 并包含以下信息：

**标题**：`[Bug] 简短描述问题`

**内容**：
```markdown
## 问题描述
清楚地描述遇到的问题

## 复现步骤
1. 执行命令 `jvibe init`
2. ...
3. 出现错误

## 预期行为
应该...

## 实际行为
实际...

## 环境信息
- OS: macOS 13.0
- Node.js: v18.0.0
- JVibe 版本: 1.0.0

## 额外信息
（可选）截图、日志等
```

---

### 提出新功能

有好的想法？创建 Feature Request：

**标题**：`[Feature] 功能名称`

**内容**：
```markdown
## 功能描述
我希望...

## 使用场景
作为一个开发者，当我...时，我需要...

## 解决方案建议
可以通过...来实现

## 替代方案
另一种方式是...
```

---

### 提交代码

#### 1. Fork 仓库

```bash
# 在 GitHub 上 Fork 项目
# 克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/VibeCoding-Tech.git
cd VibeCoding-Tech
```

#### 2. 创建分支

```bash
# 从 main 创建新分支
git checkout -b feature/your-feature-name

# 或修复 Bug
git checkout -b fix/bug-description
```

**分支命名规范**：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 重构
- `test/` - 测试

#### 3. 开发和测试

```bash
# 安装依赖
npm install

# 本地测试
npm link
jvibe --version

# 测试命令
jvibe init --mode=minimal
jvibe status
jvibe validate
```

#### 4. 提交代码

**Commit 消息规范**（Conventional Commits）：

```
<类型>: <简短描述>

<详细描述（可选）>

<footer（可选）>
```

**类型**：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具链

**示例**：
```bash
git add .
git commit -m "feat: 添加 jvibe doctor 命令

添加健康检查命令，诊断项目配置问题。

Closes #123"
```

#### 5. 推送并创建 PR

```bash
# 推送到你的 Fork
git push origin feature/your-feature-name

# 在 GitHub 上创建 Pull Request
```

**PR 标题**：
```
feat: 添加 XXX 功能
fix: 修复 XXX 问题
docs: 更新 XXX 文档
```

**PR 描述模板**：
```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 重构

## 变更说明
简要说明本次 PR 做了什么

## 相关 Issue
Closes #123

## 测试
- [ ] 本地测试通过
- [ ] 添加了测试用例（如适用）

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 更新了相关文档
- [ ] Commit 消息清晰明确
```

---

## 开发指南

### 项目结构

```
jvibe/
├── bin/jvibe.js              # CLI 入口
├── scripts/                  # 命令实现
│   ├── init.js
│   ├── upgrade.js
│   ├── status.js
│   └── validate.js
├── template/                 # 项目模板
│   ├── .claude/
│   └── docs/
└── docs/                     # 文档
```

### 代码规范

#### JavaScript

- 使用 ES6+ 语法
- 使用 2 空格缩进
- 使用 `const` 和 `let`，避免 `var`
- 函数使用清晰的命名

**示例**：
```javascript
// ✅ 好的
async function initializeProject(options) {
  const { mode, force } = options;
  // ...
}

// ❌ 不好的
async function init(opts) {
  var m = opts.mode;
  // ...
}
```

#### Shell 脚本

- 使用 `#!/bin/bash` shebang
- 添加错误处理 `set -e`
- 使用函数分解逻辑

**示例**：
```bash
#!/bin/bash
set -e

# 函数定义
function check_status() {
  # ...
}

# 主逻辑
check_status
```

### 文档规范

- 使用 Markdown 格式
- 包含代码示例
- 保持简洁明了
- 中英文之间加空格

**示例**：
```markdown
## 标题

这是一个 **重点内容** 的说明。

### 代码示例

\`\`\`bash
jvibe init
\`\`\`
```

---

## 发布流程

### 版本号规范（SemVer）

```
主版本.次版本.修订号
1.0.0
```

- **主版本**：不兼容的 API 变更
- **次版本**：向后兼容的功能性新增
- **修订号**：向后兼容的问题修正

### 发布检查清单

- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] CHANGELOG.md 已更新
- [ ] package.json 版本号已更新
- [ ] 创建 Git tag

### 发布命令

```bash
# 1. 更新版本号
npm version patch  # 或 minor/major

# 2. 推送标签
git push origin main --tags

# 3. 发布到 npm
npm publish

# 4. 创建 GitHub Release
gh release create v1.0.1
```

---

## 社区

### 获取帮助

- 📖 阅读 [文档](README.md)
- 💬 在 Issues 中提问
- 🐛 报告 Bug

### 保持联系

- ⭐ Star 项目以获取更新
- 👀 Watch 项目以接收通知
- 🍴 Fork 项目开始贡献

---

## 致谢

感谢所有贡献者！

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

---

## 许可证

通过贡献代码，你同意你的贡献将按照 [MIT License](../LICENSE) 授权。
