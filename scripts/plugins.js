/**
 * JVibe Plugins Script
 * 配置/检查插件（先从 Core Tools 开始）
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { spawn } = require('child_process');
const readline = require('readline');
const {
  loadPluginRegistry,
  configureClaudeCoreTools
} = require('../lib/plugins/core-tools');

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function installSkillCli(globalInstall) {
  return new Promise((resolve) => {
    console.log(chalk.gray(`   正在安装: ${globalInstall}`));

    // 解析命令
    const parts = globalInstall.split('&&').map(s => s.trim());

    const runCommand = (cmd, callback) => {
      const [command, ...args] = cmd.split(/\s+/);
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true
      });
      child.on('close', code => callback(code === 0));
      child.on('error', () => callback(false));
    };

    const runSequentially = (commands, index = 0) => {
      if (index >= commands.length) {
        resolve(true);
        return;
      }
      runCommand(commands[index], success => {
        if (!success) {
          resolve(false);
          return;
        }
        runSequentially(commands, index + 1);
      });
    };

    runSequentially(parts);
  });
}

async function configureCore() {
  const cwd = process.cwd();

  const registry = await loadPluginRegistry();
  const claudeDir = path.join(cwd, '.claude');

  if (!await fs.pathExists(claudeDir)) {
    console.log(chalk.yellow('⚠️  未检测到 .claude/，已跳过 Core Tools 配置'));
    return;
  }

  const result = await configureClaudeCoreTools(cwd, registry);
  if (result && result.error) {
    console.log(chalk.yellow(`⚠️  Core Tools 自动配置已跳过：${result.error}`));
    return;
  }

  // MCP Server 配置结果
  const mcpAdded = typeof result.mcpAdded === 'number'
    ? result.mcpAdded
    : result.added - (result.skillsAdded ? result.skillsAdded.length : 0);
  if (mcpAdded > 0) {
    console.log(chalk.green(`✅ 已写入 MCP Server 配置: ${mcpAdded} 项 (.claude/settings.local.json)`));
  }

  // Skill 配置结果
  if (result && Array.isArray(result.skillsAdded) && result.skillsAdded.length > 0) {
    console.log(chalk.green(`✅ 已安装 Skill: ${result.skillsAdded.length} 项`));

    for (const { pluginId, skillDir } of result.skillsAdded) {
      console.log(chalk.gray(`   - ${pluginId} → ${skillDir}`));
    }
  }

  // Skill CLI 安装提示（即使 Skill 已存在也提示）
  if (result && Array.isArray(result.skillsNeedingCli) && result.skillsNeedingCli.length > 0) {
    for (const { pluginId, cliCommand, globalInstall } of result.skillsNeedingCli) {
      if (!globalInstall) continue;
      const label = cliCommand ? `${pluginId} (${cliCommand})` : pluginId;
      const answer = await askQuestion(chalk.yellow(`   ⚠️  ${label} 需要全局安装 CLI，是否现在安装？(Y/n) `));
      if (answer === '' || answer === 'y' || answer === 'yes') {
        const success = await installSkillCli(globalInstall);
        if (success) {
          console.log(chalk.green(`   ✅ ${pluginId} CLI 安装成功`));
        } else {
          console.log(chalk.red(`   ❌ ${pluginId} CLI 安装失败，请手动执行: ${globalInstall}`));
        }
      } else {
        console.log(chalk.gray(`   跳过安装，稍后可手动执行: ${globalInstall}`));
      }
    }
  }

  if (
    mcpAdded === 0 &&
    (!result.skillsAdded || result.skillsAdded.length === 0) &&
    (!result.skillsNeedingCli || result.skillsNeedingCli.length === 0)
  ) {
    console.log(chalk.green('✅ Core Tools 配置已存在，无需重复写入'));
  }

  if (result && Array.isArray(result.missingTemplates) && result.missingTemplates.length > 0) {
    console.log(chalk.yellow(`⚠️  以下 Core Tools 未提供自动配置模板，请手动配置: ${result.missingTemplates.join(', ')}`));
  }

  if (result && Array.isArray(result.missingEnv) && result.missingEnv.length > 0) {
    console.log(chalk.yellow('⚠️  以下 Core Tools 可能缺少环境变量，启动 MCP Server 时可能失败：'));
    result.missingEnv.forEach(({ pluginId, keys }) => {
      if (!pluginId || !Array.isArray(keys) || keys.length === 0) return;
      console.log(chalk.yellow(`   - ${pluginId}: ${keys.join(', ')}`));
    });
    console.log(chalk.gray('   提示：在当前 shell 中 export 对应变量后重试'));
  }
}

module.exports = {
  configureCore
};
