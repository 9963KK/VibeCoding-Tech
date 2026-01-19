/**
 * JVibe Status Script
 * 查看项目的 JVibe 配置状态
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

function stripYamlComment(line) {
  const index = line.indexOf('#');
  return index === -1 ? line : line.slice(0, index);
}

function parsePluginListsFromYaml(content) {
  const result = {};
  let currentKey = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = stripYamlComment(rawLine).trim();
    if (!line) {
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (keyMatch) {
      const key = keyMatch[1];
      const value = keyMatch[2].trim();
      currentKey = null;

      if (value === '' || value === '[]') {
        result[key] = [];
        if (value === '') {
          currentKey = key;
        }
        continue;
      }

      if (/^-?\d+(\.\d+)?$/.test(value)) {
        result[key] = Number(value);
        continue;
      }

      result[key] = value.replace(/^['"]|['"]$/g, '');
      continue;
    }

    const itemMatch = line.match(/^-+\s*(.+)$/);
    if (itemMatch && currentKey) {
      const item = itemMatch[1].trim().replace(/^['"]|['"]$/g, '');
      if (item) {
        result[currentKey].push(item);
      }
    }
  }

  return result;
}

function parseYamlScalar(content, key) {
  const pattern = new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, 'm');
  const match = content.match(pattern);
  if (!match) {
    return null;
  }
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

/**
 * 显示 JVibe 状态
 */
async function status() {
  const cwd = process.cwd();

  console.log(chalk.blue('\n📊 JVibe 项目状态\n'));

  try {
    // 1. 检查 .claude/.opencode 目录
    const claudeDir = path.join(cwd, '.claude');
    const opencodeDir = path.join(cwd, '.opencode');
    const hasClaudeDir = await fs.pathExists(claudeDir);
    const hasOpencodeDir = await fs.pathExists(opencodeDir);

    if (!hasClaudeDir && !hasOpencodeDir) {
      console.log(chalk.red('❌ 未检测到 JVibe 配置'));
      console.log(chalk.yellow('   请运行 jvibe init 初始化项目\n'));
      return;
    }

    // 2. 读取版本信息（Claude Code）
    if (hasClaudeDir) {
      const settingsPath = path.join(claudeDir, 'settings.json');
      let settings = {};
      if (await fs.pathExists(settingsPath)) {
        settings = await fs.readJson(settingsPath);
      }

      const jvibeInfo = settings.jvibe || {};

      console.log(chalk.white('Claude Code 配置信息：'));
      console.log(chalk.gray(`  版本:       ${jvibeInfo.version || '未知'}`));
      console.log(chalk.gray(`  模式:       ${jvibeInfo.mode || '未知'}`));
      console.log(chalk.gray(`  安装时间:   ${jvibeInfo.installedAt || '未知'}`));
      if (jvibeInfo.upgradedAt) {
        console.log(chalk.gray(`  升级时间:   ${jvibeInfo.upgradedAt}`));
      }

      // 3. 检查各组件状态（Claude Code）
      console.log(chalk.white('\nClaude Code 组件状态：'));

      const agentsDir = path.join(claudeDir, 'agents');
      const agents = await fs.pathExists(agentsDir)
        ? (await fs.readdir(agentsDir)).filter(f => f.endsWith('.md'))
        : [];
      console.log(chalk.gray(`  Agents:     ${agents.length > 0 ? chalk.green('✓') : chalk.red('✗')} (${agents.length} 个)`));

      const commandsDir = path.join(claudeDir, 'commands');
      const commands = await fs.pathExists(commandsDir)
        ? (await fs.readdir(commandsDir)).filter(f => f.endsWith('.md'))
        : [];
      console.log(chalk.gray(`  Commands:   ${commands.length > 0 ? chalk.green('✓') : chalk.red('✗')} (${commands.length} 个)`));

      const hooksDir = path.join(claudeDir, 'hooks');
      const hooks = await fs.pathExists(hooksDir)
        ? (await fs.readdir(hooksDir)).filter(f => f.endsWith('.sh'))
        : [];
      console.log(chalk.gray(`  Hooks:      ${hooks.length > 0 ? chalk.green('✓') : chalk.red('✗')} (${hooks.length} 个)`));
    }

    if (hasOpencodeDir) {
      console.log(chalk.white(`${hasClaudeDir ? '\n' : ''}OpenCode 组件状态：`));
      const agentDir = path.join(opencodeDir, 'agent');
      const opencodeAgents = await fs.pathExists(agentDir)
        ? (await fs.readdir(agentDir)).filter(f => f.endsWith('.md'))
        : [];
      console.log(chalk.gray(`  Agents:     ${opencodeAgents.length > 0 ? chalk.green('✓') : chalk.red('✗')} (${opencodeAgents.length} 个)`));

      const commandDir = path.join(opencodeDir, 'command');
      const opencodeCommands = await fs.pathExists(commandDir)
        ? (await fs.readdir(commandDir)).filter(f => f.endsWith('.md'))
        : [];
      console.log(chalk.gray(`  Commands:   ${opencodeCommands.length > 0 ? chalk.green('✓') : chalk.red('✗')} (${opencodeCommands.length} 个)`));

      const configPath = path.join(opencodeDir, 'opencode.jsonc');
      console.log(chalk.gray(`  Config:     ${await fs.pathExists(configPath) ? chalk.green('✓') : chalk.red('✗')}`));
    }

    // 4. 检查文档状态
    console.log(chalk.white('\n文档状态：'));

    const docsDir = path.join(cwd, 'docs');
    const coreDir = path.join(docsDir, 'core');
    const projectDir = path.join(docsDir, 'project');
    const pluginsConfigPath = path.join(docsDir, '.jvibe', 'plugins.yaml');
    const contractsPath = path.join(docsDir, '.jvibe', 'agent-contracts.yaml');

    if (await fs.pathExists(coreDir)) {
      const coreDocs = (await fs.readdir(coreDir)).filter(f => f.endsWith('.md'));
      console.log(chalk.gray(`  Core 文档:  ${coreDocs.length >= 4 ? chalk.green('✓') : chalk.yellow('⚠')} (${coreDocs.length}/4 个)`));
    } else {
      console.log(chalk.gray(`  Core 文档:  ${chalk.red('✗')} (未创建)`));
    }

    if (await fs.pathExists(projectDir)) {
      const projectDocs = (await fs.readdir(projectDir))
        .filter(f => f.endsWith('.md') && !f.endsWith('.example'));
      console.log(chalk.gray(`  Project 文档: ${chalk.green('✓')} (${projectDocs.length} 个)`));
    } else {
      console.log(chalk.gray(`  Project 文档: ${chalk.gray('-')} (未创建)`));
    }

    if (await fs.pathExists(contractsPath)) {
      try {
        const raw = await fs.readFile(contractsPath, 'utf-8');
        const version = parseYamlScalar(raw, 'version');
        console.log(chalk.gray(`  Contracts:  ${chalk.green('✓')} (${version ? `v${version}` : 'present'})`));
      } catch (e) {
        console.log(chalk.gray(`  Contracts:  ${chalk.yellow('⚠')} (读取失败)`));
      }
    } else {
      console.log(chalk.gray(`  Contracts:  ${chalk.yellow('⚠')} (未创建)`));
    }

    if (await fs.pathExists(pluginsConfigPath)) {
      try {
        const raw = await fs.readFile(pluginsConfigPath, 'utf-8');
        const parsed = parsePluginListsFromYaml(raw);
        const corePlugins = Array.isArray(parsed.core_plugins) ? parsed.core_plugins : [];
        const projectPlugins = Array.isArray(parsed.project_plugins) ? parsed.project_plugins : [];
        console.log(chalk.gray(`  Plugins:    ${chalk.green('✓')} (Core ${corePlugins.length}, Project ${projectPlugins.length})`));
      } catch (e) {
        console.log(chalk.gray(`  Plugins:    ${chalk.yellow('⚠')} (读取失败)`));
      }
    } else {
      console.log(chalk.gray(`  Plugins:    ${chalk.yellow('⚠')} (未创建)`));
    }

    console.log('');

  } catch (error) {
    console.error(chalk.red('\n❌ 读取状态失败：'), error.message);
    process.exit(1);
  }
}

module.exports = status;
