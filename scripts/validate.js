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
  const isWindows = process.platform === 'win32';

  console.log(chalk.blue('\n🔍 验证 JVibe 配置...\n'));

  try {
    // 1. 检查 .claude/.opencode 目录
    const claudeDir = path.join(cwd, '.claude');
    const opencodeDir = path.join(cwd, '.opencode');
    const hasClaudeDir = await fs.pathExists(claudeDir);
    const hasOpencodeDir = await fs.pathExists(opencodeDir);

    if (!hasClaudeDir && !hasOpencodeDir) {
      errors.push('.claude/ 或 .opencode/ 目录不存在');
    }

    if (hasClaudeDir) {
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
      const requiredAgents = ['planner.md', 'developer.md', 'reviewer.md', 'doc-sync.md', 'tester.md', 'bugfix.md'];
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
      const requiredCommands = ['JVibe:init.md', 'JVibe:keepgo.md', 'JVibe:migrate.md', 'JVibe:pr.md', 'JVibe:status.md'];
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
            // Windows 上不可靠，跳过执行权限校验
            if (!isWindows) {
              try {
                await fs.access(hookPath, fs.constants.X_OK);
              } catch {
                warnings.push(`hook 缺少执行权限: ${hook}`);
              }
            }
          }
        }
      } else {
        warnings.push('.claude/hooks/ 目录不存在');
      }
    }

    if (hasOpencodeDir) {
      const configPath = path.join(opencodeDir, 'opencode.jsonc');
      if (!await fs.pathExists(configPath)) {
        warnings.push('缺少 OpenCode 配置: .opencode/opencode.jsonc');
      }

      const agentDir = path.join(opencodeDir, 'agent');
      if (await fs.pathExists(agentDir)) {
        const requiredAgents = ['planner.md', 'developer.md', 'reviewer.md', 'doc-sync.md', 'tester.md', 'bugfix.md'];
        for (const agent of requiredAgents) {
          if (!await fs.pathExists(path.join(agentDir, agent))) {
            warnings.push(`缺少 OpenCode agent: ${agent}`);
          }
        }
      } else {
        warnings.push('.opencode/agent/ 目录不存在');
      }

      const commandDir = path.join(opencodeDir, 'command');
      if (await fs.pathExists(commandDir)) {
        const requiredCommands = ['jvibe-init.md', 'jvibe-keepgo.md', 'jvibe-migrate.md', 'jvibe-pr.md', 'jvibe-status.md'];
        for (const cmd of requiredCommands) {
          if (!await fs.pathExists(path.join(commandDir, cmd))) {
            warnings.push(`缺少 OpenCode command: ${cmd}`);
          }
        }
      } else {
        warnings.push('.opencode/command/ 目录不存在');
      }

      const permissionsPath = path.join(opencodeDir, 'permissions.yaml');
      if (!await fs.pathExists(permissionsPath)) {
        warnings.push('缺少 OpenCode 权限文件: .opencode/permissions.yaml');
      }

      const errorHandlingPath = path.join(opencodeDir, 'error-handling.md');
      if (!await fs.pathExists(errorHandlingPath)) {
        warnings.push('缺少 OpenCode 错误处理: .opencode/error-handling.md');
      }

      const instructionsPath = path.join(opencodeDir, 'instructions.md');
      if (!await fs.pathExists(instructionsPath)) {
        warnings.push('缺少 OpenCode 指令文件: .opencode/instructions.md');
      }
    }

    // 2. 检查文档目录
    const docsDir = path.join(cwd, 'docs');
    const coreDir = path.join(docsDir, 'core');

    if (await fs.pathExists(coreDir)) {
      const requiredDocs = ['Standards.md', 'Project.md', 'Feature-List.md', 'Appendix.md'];
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
