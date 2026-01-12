/**
 * JVibe Upgrade Script
 * 升级项目的 JVibe 配置到最新版本
 * 支持旧版本自动检测和迁移
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
    const settingsPath = path.join(claudeDir, 'settings.json');

    // 检查是否有任何 JVibe 相关配置
    const hasClaudeDir = await fs.pathExists(claudeDir);
    const hasDocsDir = await fs.pathExists(path.join(cwd, 'docs'));

    if (!hasClaudeDir && !hasDocsDir) {
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
        console.log(chalk.white('   运行 jvibe upgrade 进行升级和迁移\n'));
      } else if (currentVersion === latestVersion) {
        console.log(chalk.green('\n✅ 已是最新版本！\n'));
      } else {
        console.log(chalk.yellow(`\n📦 有新版本可用: ${latestVersion}`));
        console.log(chalk.white('   运行 jvibe upgrade 进行升级\n'));
      }
      return;
    }

    // 4. 检查是否需要任何操作
    if (!migrationPlan.needsMigration && currentVersion === latestVersion) {
      console.log(chalk.green('\n✅ 已是最新版本，无需升级！\n'));
      return;
    }

    // 5. 确认升级（如果没有 --force）
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

      // 在非交互模式下直接继续
      // 实际项目中可能需要 readline 来获取用户确认
    }

    // 6. 创建备份
    console.log(chalk.gray('\n   创建备份...'));
    const backupDir = path.join(cwd, '.jvibe-backup-' + Date.now());
    if (hasClaudeDir) {
      await fs.copy(claudeDir, path.join(backupDir, '.claude'));
    }
    if (hasDocsDir) {
      await fs.copy(path.join(cwd, 'docs'), path.join(backupDir, 'docs'));
    }
    console.log(chalk.gray(`   备份已保存到: ${path.basename(backupDir)}/`));

    // 7. 执行迁移（如果需要）
    if (migrationPlan.needsMigration) {
      await executeMigration(cwd, TEMPLATE_DIR, migrationPlan, latestVersion);
    }

    // 8. 执行常规升级（如果不是仅迁移模式）
    if (!migrateOnly && currentVersion !== latestVersion) {
      console.log(chalk.yellow(`\n📦 正在升级到 ${latestVersion}...\n`));

      // 更新 agents（如果迁移时没有更新）
      if (migrationPlan.details.agentsToUpdate.length === 0) {
        console.log(chalk.gray('   更新 agents...'));
        await fs.copy(
          path.join(TEMPLATE_DIR, '.claude/agents'),
          path.join(cwd, '.claude/agents'),
          { overwrite: true }
        );
      }

      // 更新 commands（如果迁移时没有更新）
      if (migrationPlan.details.commandsToRename.length === 0) {
        console.log(chalk.gray('   更新 commands...'));
        await fs.copy(
          path.join(TEMPLATE_DIR, '.claude/commands'),
          path.join(cwd, '.claude/commands'),
          { overwrite: true }
        );
      }

      // 更新 hooks（如果迁移时没有更新）
      if (migrationPlan.details.hooksToUpdate.length === 0) {
        console.log(chalk.gray('   更新 hooks...'));
        await fs.copy(
          path.join(TEMPLATE_DIR, '.claude/hooks'),
          path.join(cwd, '.claude/hooks'),
          { overwrite: true }
        );
      }

      // 补充任务交接文件（如不存在）
      const handoffSrc = path.join(TEMPLATE_DIR, 'docs/.jvibe/tasks.yaml');
      const handoffDir = path.join(cwd, 'docs/.jvibe');
      const handoffDest = path.join(handoffDir, 'tasks.yaml');
      if (await fs.pathExists(handoffSrc) && !await fs.pathExists(handoffDest)) {
        await fs.ensureDir(handoffDir);
        await fs.copy(handoffSrc, handoffDest, { overwrite: false });
      }

      // 更新版本信息
      let settings = {};
      if (await fs.pathExists(settingsPath)) {
        try {
          settings = await fs.readJson(settingsPath);
        } catch (e) {
          // 读取失败则创建新配置
        }
      }

      settings.jvibe = {
        ...settings.jvibe,
        version: latestVersion,
        upgradedAt: new Date().toISOString()
      };
      await fs.writeJson(settingsPath, settings, { spaces: 2 });
    }

    // 9. 清理旧备份（保留最新的）
    // 可选：保留备份供用户手动清理

    // 10. 输出成功信息
    console.log(chalk.green(`\n✅ 升级完成！`));

    if (migrationPlan.needsMigration) {
      console.log(chalk.green('   已完成旧版本迁移'));
    }
    if (currentVersion !== latestVersion) {
      console.log(chalk.green(`   版本: ${currentVersion} → ${latestVersion}`));
    }

    console.log(chalk.gray(`\n   备份位置: ${path.basename(backupDir)}/`));
    console.log(chalk.gray('   如需回滚，请手动恢复备份文件'));

    // 11. 检查是否需要 AI 内容迁移
    if (migrationPlan.needsAIMigration) {
      console.log(chalk.yellow('\n⚠️  检测到文档内容需要智能迁移'));
      console.log(chalk.yellow('   以下内容需要 AI 介入处理：'));
      for (const task of migrationPlan.aiTasks) {
        console.log(chalk.yellow(`   - ${task}`));
      }
      console.log(chalk.cyan('\n📝 下一步：'));
      console.log(chalk.white('   在 Claude Code 中运行 /JVibe:migrate 完成内容迁移\n'));
    } else {
      console.log('');
    }

  } catch (error) {
    console.error(chalk.red('\n❌ 升级失败：'), error.message);

    // 提示备份位置
    const backups = await findBackups(cwd);
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
async function findBackups(dir) {
  try {
    const files = await fs.readdir(dir);
    return files
      .filter(f => f.startsWith('.jvibe-backup-'))
      .sort()
      .reverse();
  } catch (e) {
    return [];
  }
}

module.exports = upgrade;
