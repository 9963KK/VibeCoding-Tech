/**
 * JVibe Status Script
 * 查看项目的 JVibe 配置状态
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * 显示 JVibe 状态
 */
async function status() {
  const cwd = process.cwd();

  console.log(chalk.blue('\n📊 JVibe 项目状态\n'));

  try {
    // 1. 检查 .claude 目录
    const claudeDir = path.join(cwd, '.claude');
    if (!await fs.pathExists(claudeDir)) {
      console.log(chalk.red('❌ 未检测到 JVibe 配置'));
      console.log(chalk.yellow('   请运行 jvibe init 初始化项目\n'));
      return;
    }

    // 2. 读取版本信息
    const settingsPath = path.join(claudeDir, 'settings.json');
    let settings = {};
    if (await fs.pathExists(settingsPath)) {
      settings = await fs.readJson(settingsPath);
    }

    const jvibeInfo = settings.jvibe || {};

    console.log(chalk.white('配置信息：'));
    console.log(chalk.gray(`  版本:       ${jvibeInfo.version || '未知'}`));
    console.log(chalk.gray(`  模式:       ${jvibeInfo.mode || '未知'}`));
    console.log(chalk.gray(`  安装时间:   ${jvibeInfo.installedAt || '未知'}`));
    if (jvibeInfo.upgradedAt) {
      console.log(chalk.gray(`  升级时间:   ${jvibeInfo.upgradedAt}`));
    }

    // 3. 检查各组件状态
    console.log(chalk.white('\n组件状态：'));

    // Agents
    const agentsDir = path.join(claudeDir, 'agents');
    const agents = await fs.pathExists(agentsDir)
      ? (await fs.readdir(agentsDir)).filter(f => f.endsWith('.md'))
      : [];
    console.log(chalk.gray(`  Agents:     ${agents.length > 0 ? chalk.green('✓') : chalk.red('✗')} (${agents.length} 个)`));

    // Commands
    const commandsDir = path.join(claudeDir, 'commands');
    const commands = await fs.pathExists(commandsDir)
      ? (await fs.readdir(commandsDir)).filter(f => f.endsWith('.md'))
      : [];
    console.log(chalk.gray(`  Commands:   ${commands.length > 0 ? chalk.green('✓') : chalk.red('✗')} (${commands.length} 个)`));

    // Hooks
    const hooksDir = path.join(claudeDir, 'hooks');
    const hooks = await fs.pathExists(hooksDir)
      ? (await fs.readdir(hooksDir)).filter(f => f.endsWith('.sh'))
      : [];
    console.log(chalk.gray(`  Hooks:      ${hooks.length > 0 ? chalk.green('✓') : chalk.red('✗')} (${hooks.length} 个)`));

    // 4. 检查文档状态
    console.log(chalk.white('\n文档状态：'));

    const docsDir = path.join(cwd, 'docs');
    const coreDir = path.join(docsDir, 'core');
    const projectDir = path.join(docsDir, 'project');

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

    console.log('');

  } catch (error) {
    console.error(chalk.red('\n❌ 读取状态失败：'), error.message);
    process.exit(1);
  }
}

module.exports = status;
