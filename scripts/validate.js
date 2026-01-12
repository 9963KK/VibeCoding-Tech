/**
 * JVibe Validate Script
 * 验证项目的 JVibe 配置是否完整和正确
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * 验证 JVibe 配置
 */
async function validate() {
  const cwd = process.cwd();
  const errors = [];
  const warnings = [];

  console.log(chalk.blue('\n🔍 验证 JVibe 配置...\n'));

  try {
    // 1. 检查 .claude 目录
    const claudeDir = path.join(cwd, '.claude');
    if (!await fs.pathExists(claudeDir)) {
      errors.push('.claude/ 目录不存在');
    } else {
      // 检查 settings.json
      const settingsPath = path.join(claudeDir, 'settings.json');
      if (!await fs.pathExists(settingsPath)) {
        errors.push('.claude/settings.json 不存在');
      } else {
        try {
          const settings = await fs.readJson(settingsPath);
          if (!settings.hooks) {
            warnings.push('settings.json 中未配置 hooks');
          }
        } catch (e) {
          errors.push('settings.json 格式错误');
        }
      }

      // 检查 agents
      const requiredAgents = ['planner.md', 'developer.md', 'reviewer.md', 'doc-sync.md'];
      const agentsDir = path.join(claudeDir, 'agents');
      if (await fs.pathExists(agentsDir)) {
        for (const agent of requiredAgents) {
          if (!await fs.pathExists(path.join(agentsDir, agent))) {
            errors.push(`缺少 agent: ${agent}`);
          }
        }
      } else {
        errors.push('.claude/agents/ 目录不存在');
      }

      // 检查 commands
      const requiredCommands = ['JVibe:init.md', 'JVibe:pr.md', 'JVibe:status.md'];
      const commandsDir = path.join(claudeDir, 'commands');
      if (await fs.pathExists(commandsDir)) {
        for (const cmd of requiredCommands) {
          if (!await fs.pathExists(path.join(commandsDir, cmd))) {
            warnings.push(`缺少 command: ${cmd}`);
          }
        }
      } else {
        warnings.push('.claude/commands/ 目录不存在');
      }

      // 检查 hooks
      const requiredHooks = ['load-context.sh', 'sync-feature-status.sh', 'guard-output.sh', 'sync-stats.sh'];
      const hooksDir = path.join(claudeDir, 'hooks');
      if (await fs.pathExists(hooksDir)) {
        for (const hook of requiredHooks) {
          const hookPath = path.join(hooksDir, hook);
          if (!await fs.pathExists(hookPath)) {
            warnings.push(`缺少 hook: ${hook}`);
          } else {
            // 检查执行权限
            try {
              await fs.access(hookPath, fs.constants.X_OK);
            } catch {
              warnings.push(`hook 缺少执行权限: ${hook}`);
            }
          }
        }
      } else {
        warnings.push('.claude/hooks/ 目录不存在');
      }
    }

    // 2. 检查文档目录
    const docsDir = path.join(cwd, 'docs');
    const coreDir = path.join(docsDir, 'core');

    if (await fs.pathExists(coreDir)) {
      const requiredDocs = ['规范文档.md', '项目文档.md', '功能清单.md', '附加材料.md'];
      for (const doc of requiredDocs) {
        if (!await fs.pathExists(path.join(coreDir, doc))) {
          warnings.push(`缺少 Core 文档: ${doc}`);
        }
      }
    } else {
      warnings.push('docs/core/ 目录不存在');
    }

    const handoffPath = path.join(docsDir, '.jvibe', 'tasks.yaml');
    if (!await fs.pathExists(handoffPath)) {
      warnings.push('缺少任务交接文件: docs/.jvibe/tasks.yaml');
    }

    // 3. 输出结果
    if (errors.length === 0 && warnings.length === 0) {
      console.log(chalk.green('✅ 配置验证通过！\n'));
    } else {
      if (errors.length > 0) {
        console.log(chalk.red('❌ 错误：'));
        errors.forEach(e => console.log(chalk.red(`   - ${e}`)));
        console.log('');
      }

      if (warnings.length > 0) {
        console.log(chalk.yellow('⚠️  警告：'));
        warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
        console.log('');
      }

      if (errors.length > 0) {
        console.log(chalk.gray('建议运行 jvibe init --force 重新初始化\n'));
        process.exit(1);
      }
    }

  } catch (error) {
    console.error(chalk.red('\n❌ 验证失败：'), error.message);
    process.exit(1);
  }
}

module.exports = validate;
