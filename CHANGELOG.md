# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.8] - 2026-01-19

### Added

- **Agent I/O 协议统一** (`agent-contracts.yaml`)
  - 新增 `docs/.jvibe/agent-contracts.yaml` 作为 subagent 输入输出的单一事实来源
  - 定义了 `planner`、`developer`、`tester`、`bugfix`、`doc-sync` 的 `task_input` 与输出结构
  - 包含硬规则 (HR-001 ~ HR-003) 约束 subagent 行为

- **插件管理配置** (`plugins.yaml`)
  - 新增 `docs/.jvibe/plugins.yaml` 管理工具与插件启用状态
  - 区分 `core_plugins`（核心工具）与 `project_plugins`（项目按需）

- **上下文最小化原则**
  - 所有 Agent 新增"硬规则"章节，禁止全仓库扫描
  - `developer`: 只在 `code_roots`/`test_roots` 范围内读取与修改
  - `tester`: 新增 `mode: targeted | discover` 双模式
  - `bugfix`: 优先使用 tester 报告的 `failures`/`modules_hit`/`files`

- **Tester 双模式支持**
  - `targeted`: 给定 `files`，精确限制测试范围
  - `discover`: 允许从测试输出反推落点文件，解决"用户报错但不知道 F-XXX"场景
  - 新增 `issue` 字段用于 discover 模式的问题描述

- **Keepgo 用户报错判定**
  - 新增关键词匹配（报错/失败/异常/bug/error 等）自动识别用户报告的问题
  - 支持 `feature_id=null` 时进入 discover 测试流程
  - 新增 `user_reported_issue`、`user_reported_feature_id`、`user_issue` 状态字段

### Changed

- **测试失败分流策略**
  - 从简单的 `return_to_developer` 改为 `triage_then_fix` 策略
  - 多模块/核心模块/用户强制 → 调用 `bugfix`
  - 单模块/简单问题 → 回退到 `developer`

- **Handoff Payload 结构**
  - 新增 `mode` 字段（`targeted`/`discover`）
  - `files` 字段在 targeted 模式下必填且非空
  - `feature_id` 允许为 `null`

- **文档更新条件**
  - `doc_updates` 仅在 `pass` 且 `feature_id` 非空时执行
  - 避免无法关联功能编号时错误更新状态

- **Standards.md**
  - 新增 §2.6 Tools & Plugins 章节说明工具与插件概念

### Fixed

- **Hook 脚本 grep 错误处理**
  - 修复 `grep -c ... || true` 导致空字符串的问题
  - 改为 `|| echo 0` 确保输出为数字，避免后续算术运算错误
  - 影响文件：`load-context.sh`、`load-jvibe-full-context.sh`、`sync-jvibe-context.sh`

## [1.1.7] - 2026-01-18

### Added

- Hooks 自动加载和同步 JVibe 上下文

### Fixed

- Hooks 脚本 jq-free 重写，fail-open 模式

## [1.1.6] - 2026-01-17

### Added

- Context hooks 自动加载功能

---

## Summary of v1.1.8

This release introduces a major architectural improvement focused on **context minimization** and **unified I/O contracts** for subagents:

1. **Single Source of Truth**: `agent-contracts.yaml` defines all subagent input/output schemas
2. **Dual-mode Testing**: `targeted` (precise) vs `discover` (user-reported issues without F-XXX)
3. **Smarter Dispatch**: Main agent no longer directly fixes code; uses `bugfix` for complex issues
4. **Robust Hooks**: Fixed shell script arithmetic errors with proper fallback values
