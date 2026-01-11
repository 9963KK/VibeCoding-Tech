/**
 * JVibe Upgrade Script
 * 升级项目的 JVibe 配置到最新版本
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const TEMPLATE_DIR = path.join(__dirname, '../template');

/**
 * 升级 JVibe 配置
 * @param {Object} options - 升级选项
 * @param {boolean} options.check - 仅检查更新
 */
async function upgrade(options = {}) {
  const checkOnly = options.check || false;
  const cwd = process.cwd();

  console.log(chalk.blue('\n🔄 检查 JVibe 更新...\n'));

  try {
    // 1. 检查当前版本
    const settingsPath = path.join(cwd, '.claude/settings.json');
    if (!await fs.pathExists(settingsPath)) {
      console.log(chalk.red('❌ 未检测到 JVibe 配置'));
      console.log(chalk.yellow('   请先运行 jvibe init 初始化项目'));
      return;
    }

    const settings = await fs.readJson(settingsPath);
    const currentVersion = settings.jvibe?.version || '未知';
    const latestVersion = require('../package.json').version;

    console.log(chalk.gray(`   当前版本: ${currentVersion}`));
    console.log(chalk.gray(`   最新版本: ${latestVersion}`));

    // 2. 比较版本
    if (currentVersion === latestVersion) {
      console.log(chalk.green('\n✅ 已是最新版本！\n'));
      return;
    }

    if (checkOnly) {
      console.log(chalk.yellow(`\n📦 有新版本可用: ${latestVersion}`));
      console.log(chalk.white('   运行 jvibe upgrade 进行升级\n'));
      return;
    }

    // 3. 执行升级
    console.log(chalk.yellow(`\n📦 正在升级到 ${latestVersion}...\n`));

    // 备份当前配置
    const backupDir = path.join(cwd, '.claude-backup');
    console.log(chalk.gray('   备份当前配置...'));
    await fs.copy(path.join(cwd, '.claude'), backupDir);

    // 更新 agents
    console.log(chalk.gray('   更新 agents...'));
    await fs.copy(
      path.join(TEMPLATE_DIR, '.claude/agents'),
      path.join(cwd, '.claude/agents'),
      { overwrite: true }
    );

    // 更新 commands
    console.log(chalk.gray('   更新 commands...'));
    await fs.copy(
      path.join(TEMPLATE_DIR, '.claude/commands'),
      path.join(cwd, '.claude/commands'),
      { overwrite: true }
    );

    // 更新 hooks
    console.log(chalk.gray('   更新 hooks...'));
    await fs.copy(
      path.join(TEMPLATE_DIR, '.claude/hooks'),
      path.join(cwd, '.claude/hooks'),
      { overwrite: true }
    );

    // 更新版本信息（保留用户的 hooks 配置）
    settings.jvibe = {
      ...settings.jvibe,
      version: latestVersion,
      upgradedAt: new Date().toISOString()
    };
    await fs.writeJson(settingsPath, settings, { spaces: 2 });

    // 清理备份
    await fs.remove(backupDir);

    console.log(chalk.green(`\n✅ 已升级到 ${latestVersion}！\n`));

  } catch (error) {
    console.error(chalk.red('\n❌ 升级失败：'), error.message);
    console.log(chalk.yellow('   备份文件保存在 .claude-backup/'));
    process.exit(1);
  }
}

module.exports = upgrade;
