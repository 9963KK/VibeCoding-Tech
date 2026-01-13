/**
 * JVibe Upgrade Script
 * 升级项目的 JVibe 配置到最新版本
 * 默认执行卸载重装，可选保留旧迁移策略
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const {
  detectVersion,
  getMigrationPlan,
  executeMigration,
  printMigrationSummary
} = require('../lib/migrate');
const init = require('./init');
const uninstall = require('./uninstall');

const TEMPLATE_DIR = path.join(__dirname, '../template');

/**
 * 升级 JVibe 配置
 * @param {Object} options - 升级选项
 * @param {boolean} options.check - 仅检查更新
 * @param {boolean} options.force - 强制升级（不询问确认）
 * @param {boolean} options.migrate - 仅执行迁移（不更新到最新版本）
 */
async function upgrade(options = {}) {
  const checkOnly = options.check || false;
  const force = options.force || false;
  const migrateOnly = options.migrate || false;
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

    if (!migrateOnly) {
      if (!force) {
        const adapterLabel = hasClaudeDir && hasOpencodeDir
          ? '.claude/、.opencode/ 与 docs/core/'
          : hasOpencodeDir
            ? '.opencode/ 与 docs/core/'
            : '.claude/ 与 docs/core/';
        console.log(chalk.yellow(`\n⚠️  将执行卸载重装（重置 ${adapterLabel}）`));
        console.log(chalk.white('   使用 --force 选项跳过此确认'));
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
      return;
    }

    // migrate-only 模式保留旧迁移逻辑
    if (!migrationPlan.needsMigration && currentVersion === latestVersion) {
      console.log(chalk.green('\n✅ 已是最新版本，无需迁移！\n'));
      return;
    }

    if (!force && (migrationPlan.needsMigration || currentVersion !== latestVersion)) {
      console.log(chalk.yellow('\n⚠️  即将执行以下操作：'));

      if (migrationPlan.needsMigration) {
        console.log(chalk.yellow('   - 迁移旧版本配置到新格式'));
      }
      if (currentVersion !== latestVersion) {
        console.log(chalk.yellow(`   - 升级版本 ${currentVersion} → ${latestVersion}`));
      }

      console.log(chalk.white('\n   使用 --force 选项跳过此确认'));
      console.log(chalk.white('   或重新运行命令继续...\n'));
    }

    console.log(chalk.gray('\n   创建备份...'));
    const backupDir = path.join(cwd, '.jvibe-backup-' + Date.now());
    if (hasClaudeDir) {
      await fs.copy(claudeDir, path.join(backupDir, '.claude'));
    }
    if (hasOpencodeDir) {
      await fs.copy(opencodeDir, path.join(backupDir, '.opencode'));
    }
    if (hasDocsDir) {
      await fs.copy(path.join(cwd, 'docs'), path.join(backupDir, 'docs'));
    }
    console.log(chalk.gray(`   备份已保存到: ${path.basename(backupDir)}/`));

    if (migrationPlan.needsMigration) {
      await executeMigration(cwd, TEMPLATE_DIR, migrationPlan, latestVersion);
    }

    console.log(chalk.green(`\n✅ 迁移完成！`));
    if (migrationPlan.needsMigration) {
      console.log(chalk.green('   已完成旧版本迁移'));
    }
    if (currentVersion !== latestVersion) {
      console.log(chalk.green(`   版本: ${currentVersion} → ${latestVersion}`));
    }

    console.log(chalk.gray(`\n   备份位置: ${path.basename(backupDir)}/`));
    console.log(chalk.gray('   如需回滚，请手动恢复备份文件'));

    if (migrationPlan.needsAIMigration) {
      console.log(chalk.yellow('\n⚠️  检测到文档内容需要智能迁移'));
      console.log(chalk.yellow('   以下内容需要 AI 介入处理：'));
      for (const task of migrationPlan.aiTasks) {
        console.log(chalk.yellow(`   - ${task}`));
      }
      console.log(chalk.cyan('\n📝 下一步：'));
      console.log(chalk.white('   在 Claude Code 或 OpenCode 中运行 /JVibe:migrate /jvibe-migrate 完成内容迁移\n'));
    } else {
      console.log('');
    }

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
