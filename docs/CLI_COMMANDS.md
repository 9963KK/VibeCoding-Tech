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

初始化 JVibe 项目配置（默认进入 TUI 配置向导）。

**⚠️ 重要提示：两种初始化方式**

JVibe 提供两种初始化方式，**请只选择其中一种**：

| 方式 | 命令 | 特点 | 适用场景 |
|------|------|------|----------|
| **CLI 初始化** | `jvibe init` | 自动复制所有配置和文档 | 新项目、快速开始 |
| **Skill 初始化** | `/JVibe:init` / `/jvibe-init` | AI 引导式创建文档（可扫描现有项目） | 现有项目、定制化需求 |
| **TUI 配置** | `jvibe` / `jvibe setup` | 终端交互式选择适配与模式 | 新项目、需要可视化配置 |

**注意事项**：
- ❌ **不要同时使用两种方式**，会造成重复文档生成
- ✅ 如果已运行 `jvibe init`，无需再执行 `/JVibe:init` 或 `/jvibe-init`
- ✅ 如果已执行 `/JVibe:init` 或 `/jvibe-init`，无需再运行 `jvibe init`
- ✅ 现有项目场景下，`/JVibe:init` 会先扫描代码/文档再生成核心文档

---

**用法**：
```bash
jvibe init [options]
```

**选项**：
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--mode <type>` | 初始化模式：`full` 或 `minimal` | `full` |
| `--adapter <type>` | 适配环境：`claude` / `opencode` / `both` | `claude` |
| `--force` | 强制覆盖已存在的文件 | `false` |
| `--no-ui` | 跳过 TUI，直接执行初始化 | `false` |

**示例**：
```bash
# 完整初始化（包含 CORE-DOCS + PROJECT-DOCS 示例）
jvibe init

# OpenCode 适配
jvibe init --adapter=opencode

# Claude Code + OpenCode 同时适配
jvibe init --adapter=both

# 最小化初始化（仅 CORE-DOCS）
jvibe init --mode=minimal

# 强制覆盖已存在的配置
jvibe init --force
```

**效果**：
- 复制 `.claude/` 配置到项目
- （如选择）复制 `.opencode/` 配置到项目
- 复制 `docs/core/` 核心文档
- （full 模式）复制 `docs/project/` 示例
- 创建 `docs/.jvibe/tasks.yaml` 任务交接文件
- 更新 `.gitignore`
- 添加版本信息到 `settings.json`

---

### `jvibe upgrade`

升级 JVibe 到最新版本，默认执行卸载重装（重置 `.claude/`/`.opencode/` 与 `docs/core/`）。

**用法**：
```bash
jvibe upgrade [options]
```

**选项**：
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--check` | 仅检查更新，不执行升级 | `false` |
| `--force` | 强制升级，跳过确认 | `false` |
| `--migrate` | 仅执行旧版迁移（保留旧策略） | `false` |

**示例**：
```bash
# 检查是否有新版本或需要迁移
jvibe upgrade --check

# 升级到最新版本（默认卸载重装）
jvibe upgrade

# 强制升级，跳过确认
jvibe upgrade --force

# 仅执行旧版本迁移（保留旧策略）
jvibe upgrade --migrate
```

**升级流程**：
1. 检测当前版本和旧版本特征
2. 创建卸载备份（`.jvibe-uninstall-backup-<timestamp>/`）
3. 卸载旧配置（`.claude/`/`.opencode/`、`docs/core/`、`docs/.jvibe/`）
4. 重新执行初始化（保持 `docs/project/`）
5. 更新版本信息

**旧版本检测**（用于 `--migrate`）：
- 缺少版本信息（`settings.json` 中无 `jvibe.version`）
- 旧位置文档（直接在 `docs/` 而非 `docs/core/`）
- 旧命名的 commands（如 `init.md` 而非 `JVibe:init.md`）
- 旧格式的功能清单（如 `[已完成]` 而非 `✅`）
- 旧版 hooks 脚本（可能存在 bug）

**注意**：
- 默认升级会重置 `.claude/`/`.opencode/` 与 `docs/core/`
- `docs/project/` 默认保留
- 需要保留现有结构请使用 `jvibe upgrade --migrate`
- 交互模式会要求确认；非交互环境请使用 `--force`

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

### `jvibe uninstall`

卸载项目内的 JVibe 配置与核心文档。

**用法**：
```bash
jvibe uninstall [options]
```

**选项**：
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--purge-project-docs` | 同时移除 `docs/project` | `false` |
| `--no-backup` | 不创建卸载备份 | `false` |

**示例**：
```bash
# 卸载 JVibe 配置（保留 docs/project）
jvibe uninstall

# 同时移除 docs/project
jvibe uninstall --purge-project-docs

# 不创建备份
jvibe uninstall --no-backup
```

**说明**：
- 默认会删除 `.claude/`/`.opencode/`、`docs/core/`、`docs/.jvibe/` 和状态文件
- 备份目录：`.jvibe-uninstall-backup-<timestamp>/`

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
  Agents:     ✓ (5 个)
  Commands:   ✓ (3 个)
  Hooks:      ✓ (4 个)

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
- ✅ 5 个必需的 agents 是否存在
- ✅ 3 个 commands 是否存在
- ✅ 4 个 hooks 是否存在且有执行权限
- ✅ 4 个 CORE-DOCS 是否存在
- ✅ 任务交接文件是否存在（`docs/.jvibe/tasks.yaml`）

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
   - 缺少 Core 文档: Standards.md

建议运行 jvibe init --force 重新初始化
```

---

## 使用流程

补充说明：测试失败且涉及**多模块/核心模块**时，主 Agent 会调用 `bugfix` 修复并复测；否则回退给 `developer` 处理。

### 新项目

```bash
# 1. 进入项目目录
cd my-project

# 2. 初始化 JVibe（TUI）
jvibe

# 或者
jvibe setup

# 直连初始化（跳过 TUI）
jvibe init --no-ui

# OpenCode 适配（直连）
jvibe init --adapter=opencode --no-ui

# 3. 在 Claude Code 或 OpenCode 中完成文档初始化
/JVibe:init
/jvibe-init

# 4. 开始开发
# 使用自然语言描述需求...
```

### 已有项目

```bash
# 1. 进入项目目录
cd existing-project

# 2. 初始化 JVibe（不会覆盖现有代码）
jvibe init

# 3. 在 Claude Code / OpenCode 中运行扫描初始化
/JVibe:init
/jvibe-init

# 4. 验证配置
jvibe validate

# 5. 查看状态
jvibe status
```

### 升级项目

```bash
# 1. 检查是否有新版本
jvibe upgrade --check

# 2. 升级（默认卸载重装）
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
