/**
 * JVibe Validate Script
 * 验证项目的 JVibe 配置是否完整和正确
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

function parseYamlTopLevelVersion(raw) {
  const match = raw.match(/^\s*version:\s*(\d+)\s*$/m);
  if (!match) return null;
  const version = Number(match[1]);
  return Number.isFinite(version) ? version : null;
}

async function readFileIfExists(filePath) {
  try {
    if (!await fs.pathExists(filePath)) return null;
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function hasAll(str, parts) {
  return parts.every(p => str.includes(p));
}

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

    const contractsPath = path.join(docsDir, '.jvibe', 'agent-contracts.yaml');
    if (!await fs.pathExists(contractsPath)) {
      warnings.push('缺少 Subagent 协议文件: docs/.jvibe/agent-contracts.yaml');
    } else {
      const raw = await readFileIfExists(contractsPath);
      const version = raw ? parseYamlTopLevelVersion(raw) : null;
      if (!version) {
        warnings.push('Subagent 协议文件缺少 version 字段: docs/.jvibe/agent-contracts.yaml');
      }
    }

    const pluginsPath = path.join(docsDir, '.jvibe', 'plugins.yaml');
    if (!await fs.pathExists(pluginsPath)) {
      warnings.push('缺少插件启用清单: docs/.jvibe/plugins.yaml');
    }

    // 2.5 轻量一致性检查：agent/command 是否支持 mode(targeted|discover) 与 contracts 约束
    // 目的：避免 contracts 与本地 agent 文档长期漂移（只做 warning，不阻断）。
    const checkClaudeAgent = async (name, predicates, message) => {
      if (!hasClaudeDir) return;
      const filePath = path.join(claudeDir, 'agents', `${name}.md`);
      const raw = await readFileIfExists(filePath);
      if (!raw) return;
      if (!predicates(raw)) warnings.push(message);
    };

    const checkClaudeCommand = async (name, predicates, message) => {
      if (!hasClaudeDir) return;
      const filePath = path.join(claudeDir, 'commands', `${name}.md`);
      const raw = await readFileIfExists(filePath);
      if (!raw) return;
      if (!predicates(raw)) warnings.push(message);
    };

    const checkOpencodeAgent = async (name, predicates, message) => {
      if (!hasOpencodeDir) return;
      const filePath = path.join(opencodeDir, 'agent', `${name}.md`);
      const raw = await readFileIfExists(filePath);
      if (!raw) return;
      if (!predicates(raw)) warnings.push(message);
    };

    const checkOpencodeCommand = async (name, predicates, message) => {
      if (!hasOpencodeDir) return;
      const filePath = path.join(opencodeDir, 'command', `${name}.md`);
      const raw = await readFileIfExists(filePath);
      if (!raw) return;
      if (!predicates(raw)) warnings.push(message);
    };

    const expectsContractsReference = (raw) => raw.includes('docs/.jvibe/agent-contracts.yaml');
    const expectsDiscoverMode = (raw) => hasAll(raw, ['mode:', 'targeted', 'discover']);

    await checkClaudeAgent(
      'tester',
      (raw) => expectsContractsReference(raw) && expectsDiscoverMode(raw),
      'Claude tester 可能是旧版本：缺少 contracts 引用或 mode(targeted|discover)，建议升级/重置 .claude/agents/tester.md'
    );
    await checkClaudeAgent(
      'developer',
      (raw) => expectsContractsReference(raw) && raw.includes('mode: targeted'),
      'Claude developer 可能是旧版本：handoff 缺少 mode: targeted，建议升级/重置 .claude/agents/developer.md'
    );
    await checkClaudeAgent(
      'bugfix',
      (raw) => expectsContractsReference(raw) && (raw.includes('F-XXX | null') || raw.includes('F-XXX|null')),
      'Claude bugfix 可能是旧版本：feature_id 未声明可为空，建议升级/重置 .claude/agents/bugfix.md'
    );
    await checkClaudeAgent(
      'doc-sync',
      (raw) => expectsContractsReference(raw) && raw.includes('skip_if_feature_id_null'),
      'Claude doc-sync 可能是旧版本：缺少 skip_if_feature_id_null 护栏，建议升级/重置 .claude/agents/doc-sync.md'
    );
    await checkClaudeCommand(
      'JVibe:keepgo',
      (raw) => raw.includes('user_issue') && raw.includes('discover') && raw.includes('docs/.jvibe/agent-contracts.yaml'),
      'Claude keepgo 可能是旧版本：缺少 discover 机制或 contracts 引用，建议升级/重置 .claude/commands/JVibe:keepgo.md'
    );

    await checkOpencodeAgent(
      'tester',
      (raw) => expectsContractsReference(raw) && expectsDiscoverMode(raw),
      'OpenCode tester 可能是旧版本：缺少 contracts 引用或 mode(targeted|discover)，建议升级/重置 .opencode/agent/tester.md'
    );
    await checkOpencodeAgent(
      'developer',
      (raw) => expectsContractsReference(raw) && raw.includes('mode: targeted'),
      'OpenCode developer 可能是旧版本：handoff 缺少 mode: targeted，建议升级/重置 .opencode/agent/developer.md'
    );
    await checkOpencodeAgent(
      'bugfix',
      (raw) => expectsContractsReference(raw) && (raw.includes('F-XXX | null') || raw.includes('F-XXX|null')),
      'OpenCode bugfix 可能是旧版本：feature_id 未声明可为空，建议升级/重置 .opencode/agent/bugfix.md'
    );
    await checkOpencodeAgent(
      'doc-sync',
      (raw) => expectsContractsReference(raw) && raw.includes('skip_if_feature_id_null'),
      'OpenCode doc-sync 可能是旧版本：缺少 skip_if_feature_id_null 护栏，建议升级/重置 .opencode/agent/doc-sync.md'
    );
    await checkOpencodeCommand(
      'jvibe-keepgo',
      (raw) => raw.includes('user_issue') && raw.includes('discover') && raw.includes('docs/.jvibe/agent-contracts.yaml'),
      'OpenCode keepgo 可能是旧版本：缺少 discover 机制或 contracts 引用，建议升级/重置 .opencode/command/jvibe-keepgo.md'
    );

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
