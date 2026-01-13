/**
 * JVibe Uninstall Script
 * 卸载项目内的 JVibe 配置与核心文档
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * 卸载 JVibe 配置
 * @param {Object} options - 卸载选项
 * @param {boolean} options.purgeProjectDocs - 是否移除 docs/project
 * @param {boolean} options.backup - 是否创建备份
 * @param {boolean} options.showNextSteps - 是否输出下一步提示
 */
async function uninstall(options = {}) {
  const purgeProjectDocs = options.purgeProjectDocs || false;
  const backupEnabled = options.backup !== false;
  const showNextSteps = options.showNextSteps !== false;
  const cwd = process.cwd();

  console.log(chalk.blue('\n🧹 正在卸载 JVibe...\n'));

  const targets = [
    { relPath: '.claude', label: '.claude/' },
    { relPath: 'docs/core', label: 'docs/core/' },
    { relPath: 'docs/.jvibe', label: 'docs/.jvibe/' },
    { relPath: '.jvibe-state.json', label: '.jvibe-state.json' },
    { relPath: 'docs/.jvibe-state.json', label: 'docs/.jvibe-state.json' },
    { relPath: 'docs/project', label: 'docs/project/', optional: true }
  ];

  const existingTargets = [];
  for (const target of targets) {
    if (target.optional && !purgeProjectDocs) {
      continue;
    }
    const fullPath = path.join(cwd, target.relPath);
    if (await fs.pathExists(fullPath)) {
      existingTargets.push({ ...target, fullPath });
    }
  }

  if (existingTargets.length === 0) {
    console.log(chalk.yellow('⚠️  未发现可卸载的 JVibe 配置'));
    return;
  }

  let backupDir = null;
  if (backupEnabled) {
    backupDir = path.join(cwd, `.jvibe-uninstall-backup-${Date.now()}`);
    await fs.ensureDir(backupDir);

    for (const target of existingTargets) {
      const destPath = path.join(backupDir, target.relPath);
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(target.fullPath, destPath);
    }
  }

  for (const target of existingTargets) {
    await fs.remove(target.fullPath);
  }

  console.log(chalk.green('\n✅ JVibe 卸载完成！'));
  console.log(chalk.white('\n已移除：'));
  for (const target of existingTargets) {
    console.log(chalk.gray(`  - ${target.label}`));
  }

  if (backupDir) {
    console.log(chalk.gray(`\n备份位置：${path.basename(backupDir)}/`));
  }

  if (showNextSteps) {
    console.log(chalk.yellow('\n📝 下一步：'));
    console.log(chalk.white('  1. 重新运行 jvibe init 或 /JVibe:init 初始化'));
    console.log(chalk.white('  2. 如需恢复，可从备份目录手动还原\n'));
  }
}

module.exports = uninstall;
