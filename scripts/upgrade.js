/**
 * JVibe Upgrade Script
 * 升级项目的 JVibe 配置到最新版本
 * 执行卸载重装策略
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');
const {
  detectVersion,
  getMigrationPlan,
  printMigrationSummary
} = require('../lib/migrate');
const init = require('./init');
const uninstall = require('./uninstall');

function canPrompt() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function confirmProceed(message) {
  if (!canPrompt()) {
    console.log(chalk.yellow('\n⚠️  检测到非交互环境，未执行确认'));
    console.log(chalk.white('   请使用 --force 跳过确认'));
    return false;
  }

  return await new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const prompt = `${message} (y/N) `;
    rl.question(prompt, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
    rl.on('SIGINT', () => {
      rl.close();
      resolve(false);
    });
  });
}

/**
 * 升级 JVibe 配置
 * @param {Object} options - 升级选项
 * @param {boolean} options.check - 仅检查更新
 * @param {boolean} options.force - 强制升级（不询问确认）
 */
async function upgrade(options = {}) {
  const checkOnly = options.check || false;
  const force = options.force || false;
  const cwd = process.cwd();
  const latestVersion = require('../package.json').version;

  console.log(chalk.blue('\n🔄 JVibe 升级检查\n'));

  try {
    // 1. 检查是否存在 JVibe 配置
    const claudeDir = path.join(cwd, '.claude');
    const opencodeDir = path.join(cwd, '.opencode');
    const settingsPath = path.join(claudeDir, 'settings.json');

    // 检查是否有任何 JVibe 相关配置
    const hasClaudeDir = await fs.pathExists(claudeDir);
    const hasOpencodeDir = await fs.pathExists(opencodeDir);
    const hasDocsDir = await fs.pathExists(path.join(cwd, 'docs'));

    if (!hasClaudeDir && !hasOpencodeDir && !hasDocsDir) {
      console.log(chalk.red('❌ 未检测到 JVibe 配置'));
      console.log(chalk.yellow('   请先运行 jvibe init 初始化项目'));
      return;
    }

    // 2. 检测版本和旧版本特征
    console.log(chalk.gray('   检测项目版本...'));
    const versionInfo = await detectVersion(cwd);
    const migrationPlan = await getMigrationPlan(cwd, versionInfo);

    // 打印检测结果
    printMigrationSummary(versionInfo, migrationPlan);

    const currentVersion = versionInfo.version || '0.0.0';

    console.log(chalk.gray(`\n   最新版本: ${latestVersion}`));

    // 3. 仅检查模式
    if (checkOnly) {
      if (migrationPlan.needsMigration) {
        console.log(chalk.yellow('\n📦 检测到旧版本，需要迁移'));
        console.log(chalk.white('   运行 jvibe upgrade 执行卸载重装\n'));
      } else if (currentVersion === latestVersion) {
        console.log(chalk.green('\n✅ 已是最新版本！\n'));
      } else {
        console.log(chalk.yellow(`\n📦 有新版本可用: ${latestVersion}`));
        console.log(chalk.white('   运行 jvibe upgrade 执行卸载重装\n'));
      }
      return;
    }

    // 执行卸载重装
    if (!force) {
      const adapterLabel = hasClaudeDir && hasOpencodeDir
        ? '.claude/、.opencode/ 与 docs/core/'
        : hasOpencodeDir
          ? '.opencode/ 与 docs/core/'
          : '.claude/ 与 docs/core/';
      console.log(chalk.yellow(`\n⚠️  将执行卸载重装（重置 ${adapterLabel}）`));
      console.log(chalk.white('   使用 --force 选项跳过此确认'));
      const confirmed = await confirmProceed('是否继续执行卸载重装？');
      if (!confirmed) {
        console.log(chalk.gray('\n已取消升级\n'));
        return;
      }
    }

    let mode = 'full';
    if (await fs.pathExists(settingsPath)) {
      try {
        const settings = await fs.readJson(settingsPath);
        mode = settings.jvibe?.mode || mode;
      } catch (e) {
        // 读取失败则使用默认模式
      }
    }

    const adapter = hasClaudeDir && hasOpencodeDir
      ? 'both'
      : hasOpencodeDir
        ? 'opencode'
        : 'claude';
    await uninstall({ purgeProjectDocs: false, backup: true, showNextSteps: false });
    await init({ mode, force: false, adapter });

    console.log(chalk.green(`\n✅ 升级完成！`));
    console.log(chalk.green(`   版本: ${currentVersion} → ${latestVersion}`));
    console.log(chalk.gray('\n   已执行卸载重装（保留 docs/project/）\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ 升级失败：'), error.message);

    // 提示备份位置
    const backups = await findBackups(cwd, ['.jvibe-backup-', '.jvibe-uninstall-backup-']);
    if (backups.length > 0) {
      console.log(chalk.yellow(`   最新备份: ${backups[0]}`));
    }

    process.exit(1);
  }
}

/**
 * 查找备份目录
 * @param {string} dir - 项目目录
 * @returns {Promise<string[]>}
 */
async function findBackups(dir, prefixes = ['.jvibe-backup-']) {
  try {
    const files = await fs.readdir(dir);
    return files
      .filter(f => prefixes.some(prefix => f.startsWith(prefix)))
      .sort()
      .reverse();
  } catch (e) {
    return [];
  }
}

module.exports = upgrade;
