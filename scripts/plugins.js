/**
 * JVibe Plugins Script
 * 配置/检查插件（先从 Core Tools 开始）
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const {
  loadPluginRegistry,
  configureClaudeCoreTools
} = require('../lib/plugins/core-tools');

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
  if (result && result.added > 0) {
    console.log(chalk.green(`✅ 已写入 Core Tools 配置: ${result.added} 项 (.claude/settings.local.json)`));
  } else {
    console.log(chalk.green('✅ Core Tools 配置已存在，无需重复写入'));
  }
  if (result && Array.isArray(result.missingTemplates) && result.missingTemplates.length > 0) {
    console.log(chalk.yellow(`⚠️  以下 Core Tools 未提供自动配置模板，请手动配置: ${result.missingTemplates.join(', ')}`));
  }
}

module.exports = {
  configureCore
};
