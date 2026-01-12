# CLI 命令参考

JVibe 提供了一套完整的 CLI 命令来管理你的项目。

---

## 安装

```bash
# 全局安装
npm install -g jvibe

# 或使用 npx（无需安装）
npx jvibe <command>
```

---

## 命令列表

### `jvibe init`

初始化 JVibe 项目配置。

**用法**：
```bash
jvibe init [options]
```

**选项**：
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--mode <type>` | 初始化模式：`full` 或 `minimal` | `full` |
| `--force` | 强制覆盖已存在的文件 | `false` |

**示例**：
```bash
# 完整初始化（包含 CORE-DOCS + PROJECT-DOCS 示例）
jvibe init

# 最小化初始化（仅 CORE-DOCS）
jvibe init --mode=minimal

# 强制覆盖已存在的配置
jvibe init --force
```

**效果**：
- 复制 `.claude/` 配置到项目
- 复制 `docs/core/` 核心文档
- （full 模式）复制 `docs/project/` 示例
- 更新 `.gitignore`
- 添加版本信息到 `settings.json`

---

### `jvibe upgrade`

升级 JVibe 到最新版本，支持旧版本自动检测和迁移。

**用法**：
```bash
jvibe upgrade [options]
```

**选项**：
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--check` | 仅检查更新，不执行升级 | `false` |
| `--force` | 强制升级，跳过确认 | `false` |
| `--migrate` | 仅执行迁移，不更新到最新版本 | `false` |

**示例**：
```bash
# 检查是否有新版本或需要迁移
jvibe upgrade --check

# 升级到最新版本（自动检测并迁移旧版本）
jvibe upgrade

# 强制升级，跳过确认
jvibe upgrade --force

# 仅执行旧版本迁移
jvibe upgrade --migrate
```

**升级流程**：
1. 检测当前版本和旧版本特征
2. 显示迁移计划（如有旧版本）
3. 创建备份到 `.jvibe-backup-<timestamp>/`
4. 执行迁移（如需要）：
   - 迁移文档结构（`docs/` → `docs/core/`）
   - 转换功能清单格式（状态符号）
   - 更新 hooks 脚本
   - 重命名 commands
5. 更新 `agents/`, `commands/`, `hooks/`
6. 更新版本信息

**旧版本检测**：
- 缺少版本信息（`settings.json` 中无 `jvibe.version`）
- 旧位置文档（直接在 `docs/` 而非 `docs/core/`）
- 旧命名的 commands（如 `init.md` 而非 `JVibe:init.md`）
- 旧格式的功能清单（如 `[已完成]` 而非 `✅`）
- 旧版 hooks 脚本（可能存在 bug）

**注意**：
- 升级前会自动创建备份
- 如果升级失败，备份保存在 `.jvibe-backup-<timestamp>/`
- 用户自定义内容会尽量保留

---

### `jvibe migrate`

迁移旧版本配置到新格式（`upgrade --migrate` 的别名）。

**用法**：
```bash
jvibe migrate [options]
```

**选项**：
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--force` | 强制迁移，跳过确认 | `false` |

**示例**：
```bash
# 检查并迁移旧版本
jvibe migrate

# 强制迁移
jvibe migrate --force
```

---

### `jvibe status`

查看项目的 JVibe 配置状态。

**用法**：
```bash
jvibe status
```

**输出示例**：
```
📊 JVibe 项目状态

配置信息：
  版本:       1.0.0
  模式:       full
  安装时间:   2026-01-11T00:00:00Z

组件状态：
  Agents:     ✓ (4 个)
  Commands:   ✓ (3 个)
  Hooks:      ✓ (3 个)

文档状态：
  Core 文档:  ✓ (4/4 个)
  Project 文档: ✓ (2 个)
```

---

### `jvibe validate`

验证项目的 JVibe 配置是否完整和正确。

**用法**：
```bash
jvibe validate
```

**检查项**：
- ✅ `.claude/settings.json` 是否存在且格式正确
- ✅ 4 个必需的 agents 是否存在
- ✅ 3 个 commands 是否存在
- ✅ 3 个 hooks 是否存在且有执行权限
- ✅ 4 个 CORE-DOCS 是否存在

**输出示例**：
```
🔍 验证 JVibe 配置...

✅ 配置验证通过！
```

或：
```
🔍 验证 JVibe 配置...

❌ 错误：
   - 缺少 agent: planner.md
   - .claude/settings.json 不存在

⚠️  警告：
   - hook 缺少执行权限: load-context.sh
   - 缺少 Core 文档: 规范文档.md

建议运行 jvibe init --force 重新初始化
```

---

## 使用流程

### 新项目

```bash
# 1. 进入项目目录
cd my-project

# 2. 初始化 JVibe
jvibe init

# 3. 在 Claude Code 中完成文档初始化
/JVibe:init

# 4. 开始开发
# 使用自然语言描述需求...
```

### 已有项目

```bash
# 1. 进入项目目录
cd existing-project

# 2. 初始化 JVibe（不会覆盖现有代码）
jvibe init

# 3. 验证配置
jvibe validate

# 4. 查看状态
jvibe status
```

### 升级项目

```bash
# 1. 检查是否有新版本
jvibe upgrade --check

# 2. 升级（如果有新版本）
jvibe upgrade

# 3. 验证升级结果
jvibe validate
```

---

## 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0
- Claude Code

---

## 故障排除

### 命令找不到

```bash
# 检查是否全局安装
npm list -g jvibe

# 或使用 npx
npx jvibe <command>
```

### 权限错误

```bash
# macOS/Linux: 添加执行权限
chmod +x .claude/hooks/*.sh

# 或重新初始化
jvibe init --force
```

### 版本冲突

```bash
# 清理并重新安装
npm uninstall -g jvibe
npm install -g jvibe

# 验证版本
jvibe --version
```

---

## 相关文档

- [快速开始](GETTING_STARTED.md)
- [架构说明](ARCHITECTURE.md)
- [CORE vs PROJECT 文档](CORE_VS_PROJECT_DOCS.md)
