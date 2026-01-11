# 📦 发布到 npm 指南

本指南帮助你将 JVibe 发布到 npm。

---

## 前置准备

### 1. 注册 npm 账号

访问 https://www.npmjs.com/signup 注册账号。

### 2. 登录 npm

```bash
npm login
```

输入用户名、密码和邮箱。

### 3. 验证登录

```bash
npm whoami
```

应该显示你的用户名。

---

## 发布流程

### 方式一：手动发布（推荐用于首次发布）

#### 1. 更新版本号

```bash
# 修复版本（1.0.0 -> 1.0.1）
npm version patch

# 功能版本（1.0.0 -> 1.1.0）
npm version minor

# 主要版本（1.0.0 -> 2.0.0）
npm version major
```

这会自动：
- 更新 `package.json` 中的版本号
- 创建 Git commit
- 创建 Git tag（如 `v1.0.1`）

#### 2. 推送到 GitHub

```bash
git push origin main --tags
```

#### 3. 发布到 npm

```bash
npm publish
```

首次发布时，npm 会要求你进行邮箱验证。

#### 4. 验证发布

```bash
# 查看包信息
npm view jvibe

# 测试安装
npm install -g jvibe
jvibe --version
```

---

### 方式二：自动发布（推荐用于后续发布）

我们已经配置了 GitHub Actions，可以自动发布。

#### 1. 配置 NPM_TOKEN

1. 访问 https://www.npmjs.com/settings/[你的用户名]/tokens
2. 点击 "Generate New Token" → "Classic Token"
3. 选择 "Automation" 类型
4. 复制生成的 token

5. 在 GitHub 仓库中：
   - 进入 Settings → Secrets and variables → Actions
   - 点击 "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: 粘贴刚才复制的 token
   - 点击 "Add secret"

#### 2. 发布新版本

```bash
# 1. 更新版本号
npm version patch  # 或 minor/major

# 2. 推送 tag（触发 GitHub Actions）
git push origin main --tags
```

#### 3. 查看发布状态

访问 https://github.com/9963KK/VibeCoding-Tech/actions

GitHub Actions 会自动：
- 安装依赖
- 发布到 npm
- 创建 GitHub Release

---

## 发布检查清单

发布前请确认：

- [ ] 所有测试通过（`npm test`）
- [ ] 本地运行正常（`npm link && jvibe --version`）
- [ ] package.json 中的信息正确
  - [ ] name
  - [ ] version
  - [ ] description
  - [ ] repository
  - [ ] keywords
- [ ] README.md 是最新的
- [ ] 文档已更新
- [ ] CHANGELOG.md 已更新（如果有）

---

## 首次发布特别说明

### 添加作者信息

编辑 `package.json`，填写 `author` 字段：

```json
{
  "author": "你的名字 <your.email@example.com>",
  // 或者
  "author": {
    "name": "你的名字",
    "email": "your.email@example.com",
    "url": "https://yourwebsite.com"
  }
}
```

### 验证包内容

发布前查看将要发布的文件：

```bash
# 查看将被包含的文件
npm pack --dry-run

# 创建 tarball 并查看
npm pack
tar -tzf jvibe-1.0.0.tgz
```

确认包含：
- ✅ `bin/`
- ✅ `scripts/`
- ✅ `template/`
- ✅ `JVIBE.md`
- ✅ `README.md`
- ✅ `LICENSE`

不应包含：
- ❌ `.git/`
- ❌ `node_modules/`
- ❌ `.github/` （已在 .npmignore 中排除）
- ❌ `docs/` 开发文档（已在 .npmignore 中排除）

---

## 发布后

### 1. 测试安装

```bash
# 卸载本地链接
npm unlink -g jvibe

# 从 npm 安装
npm install -g jvibe

# 测试
jvibe --version
jvibe init --help
```

### 2. 更新文档

在 README.md 中更新安装说明：

```markdown
## 安装

\`\`\`bash
npm install -g jvibe
\`\`\`
```

### 3. 宣传

- 在 GitHub README 中添加 npm 徽章
- 发布 Release Notes
- 分享到社交媒体

---

## 徽章

添加到 README.md：

```markdown
[![npm version](https://badge.fury.io/js/jvibe.svg)](https://www.npmjs.com/package/jvibe)
[![npm downloads](https://img.shields.io/npm/dm/jvibe.svg)](https://www.npmjs.com/package/jvibe)
```

---

## 故障排除

### 包名已存在

```
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/jvibe
npm ERR! 403 Package name too similar to existing package
```

**解决方案**：
1. 使用 scoped package：`@your-username/jvibe`
2. 或选择其他包名

### 权限错误

```
npm ERR! code ENEEDAUTH
```

**解决方案**：
```bash
npm login
npm publish
```

### 版本已存在

```
npm ERR! 403 cannot modify pre-existing version
```

**解决方案**：
```bash
npm version patch  # 增加版本号
npm publish
```

---

## 取消发布

**警告**：不推荐取消发布，只在发布后 72 小时内可用。

```bash
# 取消发布特定版本
npm unpublish jvibe@1.0.0

# 取消发布整个包（危险！）
npm unpublish jvibe --force
```

**更好的做法**：发布新版本修复问题。

---

## 相关链接

- [npm 文档](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm CLI 命令](https://docs.npmjs.com/cli/v9/commands)
